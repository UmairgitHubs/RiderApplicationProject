import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { riderApi } from '../services/api';

export interface RouteStop {
  id: string;
  shipmentId: string;
  trackingId: string;
  recipient: string;
  address: string;
  distance: string;
  estimatedTime: string;
  status: 'active' | 'pending' | 'completed';
  type: 'urgent' | 'nextDay';
  taskType: 'pickup' | 'delivery';
  eta?: string;
  stopNumber: number;
  latitude?: number;
  longitude?: number;
  itemCount?: number; // For grouped stops (e.g., bulk pickup)
  subItems?: { shipmentId: string, trackingId: string }[]; // Details of grouped items
  isGroup?: boolean;
  shipment?: any; // Full shipment object for context
}

export interface RouteStats {
  totalStops: number;
  totalKm: number;
  totalMinutes: number;
  completedStops: number;
  remainingStops: number;
}

const EARTH_RADIUS_KM = 6371;
const DEFAULT_STOP_TIME_MIN = 12;
const DEFAULT_START_LOCATION = { lat: 33.6844, lng: 73.0479 }; // Islamabad
const AVERAGE_SPEED_KMPH = 30; // Average city driving speed
const ROAD_FACTOR = 1.3; // Aproximation for non-straight roads
const DEFAULT_SERVICE_TIME_MIN = 15;

export const useRoutePlanning = (initialRouteType: 'urgent' | 'nextDay' = 'urgent') => {
  const navigation = useNavigation<any>();
  const [routeType, setRouteType] = useState<'urgent' | 'nextDay'>(initialRouteType);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  
  // Data State
  const [rawRoutes, setRawRoutes] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  
  // Location State
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  
  const [isAssignedRoute, setIsAssignedRoute] = useState(false);
  const [routeSpecs, setRouteSpecs] = useState<{ urgent: number | null, nextDay: number | null }>({ urgent: null, nextDay: null });
  
  // Stats state
  const [routeStats, setRouteStats] = useState<RouteStats>({
    totalStops: 0,
    totalKm: 0,
    totalMinutes: 0,
    completedStops: 0,
    remainingStops: 0,
  });

  // --- Helpers ---

  const deg2rad = (deg: number) => deg * (Math.PI / 180);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
  }, []);

  // --- Core Logic ---

  const filterOrdersByType = useCallback((orders: any[], type: 'urgent' | 'nextDay') => {
    return orders.filter((order) => {
      const pType = (order.packageType || order.package_type || '').toLowerCase();
      let isNextDay = false;
      if (order.scheduledDeliveryTime || order.scheduled_delivery_time) {
        const scheduledTime = new Date(order.scheduledDeliveryTime || order.scheduled_delivery_time);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        isNextDay = scheduledTime >= tomorrow;
      }
      return type === 'urgent' ? !isNextDay : isNextDay;
    });
  }, []);

  // Helper to fetch real driving metrics for a single leg (Active Stop)
  const fetchPreciseMetrics = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
      try {
          return null; 
      } catch (e) { return null; }
  };

  // Updated Optimization: Sorts by Nearest Neighbor with forced Hub Sequencing
  const optimizeAndMapOrders = useCallback((orders: any[], startLat: number, startLng: number, type: 'urgent' | 'nextDay') => {
    
    // Helper to get consistent location/address info
    const getStopInfo = (item: any) => {
        const shipment = item.shipment || item;
        
        let taskType: 'pickup' | 'delivery' = 'delivery'; 
        if (item._taskType) { 
            taskType = item._taskType; 
        } else if (item.type) {
            taskType = item.type;
        } else if (shipment.status === 'assigned' || shipment.status === 'pending') {
            taskType = (shipment.status === 'picked_up' || shipment.status === 'in_transit') ? 'delivery' : 'pickup';
        }

        let latVal = 0, lngVal = 0, address = '';
        
        // Is Second Leg?
        // Logic: 
        // 1. Status implies it (received_at_hub, in_transit, out_for_delivery)
        // 2. OR it is 'assigned'/'pending' BUT has a Pickup Rider ID (meaning first mile done) AND a Hub ID
        const isSecondLeg = (
            shipment.status === 'received_at_hub' || 
            shipment.status === 'in_transit' || 
            shipment.status === 'out_for_delivery' ||
            ((shipment.status === 'assigned' || shipment.status === 'pending') && !!shipment.pickupRiderId && !!shipment.hubId)
        );

        const hubAddress = shipment.hub?.address || shipment.hub?.name || 'Hub';
        const hubLat = shipment.hub?.latitude;
        const hubLng = shipment.hub?.longitude;

        if (taskType === 'pickup') {
            if (item.location) { latVal = item.latitude; lngVal = item.longitude; address = item.location; }
            else if (shipment.pickupAddress && !isSecondLeg) { // Only use merchant address if NOT second leg
                 latVal = shipment.pickupLatitude; lngVal = shipment.pickupLongitude; address = shipment.pickupAddress; 
            }
            else {
                // Determine source: Hub or Merchant
                if (isSecondLeg) { 
                    latVal = hubLat; lngVal = hubLng; address = hubAddress; 
                }
                else { 
                    latVal = shipment.pickup_latitude; lngVal = shipment.pickup_longitude; address = shipment.pickup_address; 
                }
            }
        } else {
            if (item.location) { latVal = item.latitude; lngVal = item.longitude; address = item.location; }
            else if (shipment.deliveryAddress) { latVal = shipment.deliveryLatitude; lngVal = shipment.deliveryLongitude; address = shipment.deliveryAddress; }
            else {
                // If it's First Mile (not second leg), we are delivering TO HUB
                // Logic: NOT Second Leg AND Has Hub ID = First Mile (Merchant -> Hub)
                if (!isSecondLeg && shipment.hubId) { latVal = hubLat; lngVal = hubLng; address = hubAddress; }
                else { latVal = shipment.delivery_latitude; lngVal = shipment.delivery_longitude; address = shipment.delivery_address; }
            }
        }

        if (!latVal && !lngVal) { latVal = item.latitude || shipment.latitude; lngVal = item.longitude || shipment.longitude; }
        if (!address) address = item.location || shipment.address || 'Unknown Location';

        // Robust check for Hub containment
        // We consider it a "Hub Stop" if address matches Hub OR coords match Hub
        // OR taskType implies Hub interaction (e.g. First Mile Delivery)
        
        const isHubStop = address === hubAddress || 
                         (Math.abs(latVal - hubLat) < 0.0001 && Math.abs(lngVal - hubLng) < 0.0001) ||
                         (taskType === 'delivery' && !isSecondLeg) || // First Mile Drop
                         (taskType === 'pickup' && isSecondLeg); // Second Mile Pick

        // Exclude customer locations that might accidentally be named "Hub"? Unlikely.
        
        return { lat: parseFloat(String(latVal || 0)), lng: parseFloat(String(lngVal || 0)), address, taskType, isHub: isHubStop };
    };

    // 1. Segmentation
    const hubPickups: any[] = [];
    const hubDeliveries: any[] = [];
    const standardStops: any[] = [];

    orders.forEach(order => {
        const info = getStopInfo(order);
        // Tag order with computed info for later use to avoid re-calc
        order._computed = info;

        if (info.isHub) {
            if (info.taskType === 'pickup') hubPickups.push(order);
            else hubDeliveries.push(order);
        } else {
            standardStops.push(order);
        }
    });

    // 2. Optimization Sequence Construction
    const finalSequence: RouteStop[] = [];
    let currentLat = startLat || 0;
    let currentLng = startLng || 0;
    let stopOrderCounter = 1;
    let accumulatedTimeMin = 0;

    const processItem = (order: any) => {
        const shipment = order.shipment || order;
        const info = order._computed; // Already computed
        
        // Coords
        const lat = info.lat;
        const lng = info.lng;

        // Dist Calc
        const dist = (currentLat === 0 && currentLng === 0) ? 0 : calculateDistance(currentLat, currentLng, lat, lng);
        
        // Time
        let serviceTimeDiff = DEFAULT_SERVICE_TIME_MIN;
        const estTime = shipment.estimatedDeliveryTime || shipment.estimated_delivery_time || shipment.estimatedTime;
        if (estTime && !isNaN(Number(estTime))) serviceTimeDiff = parseInt(String(estTime));

        const roadDistanceKm = dist * ROAD_FACTOR;
        const travelTimeMin = (roadDistanceKm / AVERAGE_SPEED_KMPH) * 60;
        accumulatedTimeMin += Math.round(travelTimeMin + serviceTimeDiff);

        // ETA
        const now = new Date();
        now.setMinutes(now.getMinutes() + accumulatedTimeMin);
        
        // Update Current Cursor
        currentLat = lat;
        currentLng = lng;

        finalSequence.push({
            id: order.id || `${shipment.id || 'unknown'}-${info.taskType}-${stopOrderCounter}`,
            shipmentId: shipment.id,
            trackingId: shipment.trackingNumber || shipment.tracking_number || '',
            recipient: shipment.recipientName || shipment.recipient_name || 'Customer',
            address: info.address, 
            distance: `${roadDistanceKm.toFixed(1)} km`, 
            estimatedTime: `${serviceTimeDiff} min`,
            status: 'pending', 
            type, 
            taskType: info.taskType, 
            eta: now.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'}),
            stopNumber: stopOrderCounter++,
            latitude: lat,
            longitude: lng,
            itemCount: order.itemCount,
            subItems: order.subItems,
            isGroup: order.isGroup
        });
    };

    // Sequence Strategy:
    // A. Hub Pickups (Start) - e.g. Second Mile loading
    hubPickups.forEach(processItem);

    // B. Optimize Standard Stops (Middle) - e.g. Merchants or Customers
    const unvisitedMiddle = [...standardStops];
    while (unvisitedMiddle.length > 0) {
        let nearestIndex = -1;
        let minDist = Infinity;

        for (let i = 0; i < unvisitedMiddle.length; i++) {
            const item = unvisitedMiddle[i];
            const info = item._computed;
            if (info.lat === 0 && info.lng === 0) continue;

            const d = calculateDistance(currentLat, currentLng, info.lat, info.lng);
            if (d < minDist) {
                minDist = d;
                nearestIndex = i;
            }
        }

        // Fallback for invalid coords
        if (nearestIndex === -1 && unvisitedMiddle.length > 0) nearestIndex = 0;

        if (nearestIndex !== -1) {
            processItem(unvisitedMiddle[nearestIndex]);
            unvisitedMiddle.splice(nearestIndex, 1);
        } else {
            break; 
        }
    }

    // C. Hub Deliveries (End) - Skipped because we use "Navigate to Hub" button for final dropoff
    // hubDeliveries.forEach(processItem);

    return finalSequence;
  }, [calculateDistance]);

  const calculateStats = useCallback((stopsList: RouteStop[], overrides?: { totalKm?: number, totalMinutes?: number }) => {
    // robust sum
    const sumKm = stopsList.reduce((sum, stop) => {
        const d = parseFloat(stop.distance);
        return sum + (isNaN(d) ? 0 : d);
    }, 0);
    
    // Use override ONLY if it's a valid positive number
    // This fixes the "0 KM" issue when backend sends initialized 0
    const totalKm = (overrides?.totalKm && overrides.totalKm > 0.1) 
        ? overrides.totalKm 
        : sumKm;

    const serviceTime = stopsList.reduce((sum, stop) => {
        const t = parseInt(stop.estimatedTime);
        return sum + (isNaN(t) ? 10 : t);
    }, 0);
    
    const travelBuffer = Math.max(0, stopsList.length - 1) * DEFAULT_STOP_TIME_MIN;
    const calcMinutes = serviceTime + travelBuffer;
    
    const totalMinutes = (overrides?.totalMinutes && overrides.totalMinutes > 1) 
        ? overrides.totalMinutes 
        : calcMinutes;
        
    const completedStops = stopsList.filter(s => s.status === 'completed').length;

    setRouteStats({
      totalStops: stopsList.length,
      totalKm: parseFloat(totalKm.toFixed(1)),
      totalMinutes: Math.round(totalMinutes),
      completedStops,
      remainingStops: stopsList.length - completedStops,
    });
  }, []);

  // --- Sync Logic: Raw Data + Location -> Stops ---
  useEffect(() => {
     const processRoute = () => {
         // Gather all applicable routes
         const activeRoutes = rawRoutes.filter((r: any) => r.status === 'active');
         const pendingRoutes = rawRoutes.filter((r: any) => ['pending', 'assigned', 'draft'].includes(r.status));
         
         let targetRoutes: any[] = [];
         if (routeType === 'urgent') {
             targetRoutes = activeRoutes;
         } else {
             targetRoutes = pendingRoutes;
         }

         // 1. Extract stops from Routes
         let routeStopsRaw: any[] = [];
         if (targetRoutes.length > 0) {
             setIsAssignedRoute(true);
             routeStopsRaw = targetRoutes.reduce((acc: any[], route: any) => {
                 if (route.stops && Array.isArray(route.stops)) {
                    // Filter out stops that are pure waypoints with no payload
                    const validStops = route.stops.filter((s: any) => s.shipment_id || s.shipment);
                    return [...acc, ...validStops];
                 }
                 return acc;
             }, []);
         } else {
             setIsAssignedRoute(false);
         }

         // 2. Extract loose orders (directly assigned shipments not in a route)
         const filteredOrders = filterOrdersByType(activeOrders, routeType);
         
         // 3. Identify Shipment IDs already in routes to avoid duplicates
         const routeShipmentIds = new Set(routeStopsRaw.map((s: any) => s.shipment?.id || s.shipment_id || s.shipmentId));
         
         // 4. Convert loose orders to "Pseudo Stops"
         const looseStopsRaw = filteredOrders.filter(order => !routeShipmentIds.has(order.id)).map((order, index) => {
             // Mock the structure of a backend route stop for consistency
             return {
                 id: `loose-${order.id}`,
                 shipment_id: order.id,
                 shipment: order,
                 type: (order.status === 'picked_up' || order.status === 'in_transit') ? 'delivery' : 'pickup', // infer type
                 status: (order.status === 'delivered') ? 'completed' : 'pending',
                 location: '', // will be resolved in normalization
                 latitude: order.pickupLatitude || order.latitude, // best guess, fixed in normalization
                 longitude: order.pickupLongitude || order.longitude
             };
         });

         // 5. Combine and Deduplicate
         const allRawStops = [...routeStopsRaw, ...looseStopsRaw];
         const uniqueStopsMap = new Map();
         
         allRawStops.forEach((s: any) => {
             const sShipment = s.shipment || {};
             // Use Shipment ID + Type (pickup/delivery) as unique key
             // Fallback to ID if type unclear
             const type = s.type || ((sShipment.status === 'picked_up' || sShipment.status === 'in_transit') ? 'delivery' : 'pickup');
             const shipmentId = sShipment.id || s.shipment_id || s.shipmentId || s.id;
             const key = `${shipmentId}-${type}`;
             
             if (!uniqueStopsMap.has(key)) {
                 uniqueStopsMap.set(key, s);
             }
         });
         const dedupedStops = Array.from(uniqueStopsMap.values()).filter((s: any) => {
             const sShipment = s.shipment || {};
             const type = s.type || ((sShipment.status === 'picked_up' || sShipment.status === 'in_transit') ? 'delivery' : 'pickup');
             
             // If this represents a DELIVERY stop, but we haven't picked up the package yet, HIDE IT.
             // This ensures only the Pickup stop is visible initially.
             if (type === 'delivery') {
                 const status = sShipment.status;
                 if (status === 'assigned' || status === 'pending') {
                     return false; 
                 }
             }
             return true;
         });

         // 6. Separate Completed vs Pending
         const completed = dedupedStops.filter((s:any) => s.status === 'completed' || s.shipment?.status === 'delivered');
         const pending = dedupedStops.filter((s:any) => s.status !== 'completed' && s.shipment?.status !== 'delivered');

         // 7. Normalize Completed Stops
         const mappedCompleted: RouteStop[] = completed.map((s:any, i:number) => {
             const sShipment = s.shipment || {};
             const taskType = (s.type || ((sShipment.status === 'picked_up' || sShipment.status === 'in_transit') ? 'delivery' : 'pickup')) as 'pickup' | 'delivery';
             let address = '';
             if (taskType === 'pickup') {
                 address = sShipment.pickup_address || sShipment.pickupAddress || s.location;
             } else {
                 address = sShipment.delivery_address || sShipment.deliveryAddress || s.location;
             }
             return {
                 id: s.id || `completed-${i}`,
                 shipmentId: sShipment.id || s.shipment_id,
                 trackingId: sShipment.trackingNumber || sShipment.tracking_number || '',
                 recipient: sShipment.recipientName || sShipment.recipient_name || 'Customer',
                 address: address || '',
                 distance: '0 km',
                 estimatedTime: '0 min',
                 status: 'completed' as const,
                 type: routeType,
                 taskType: taskType,
                 eta: 'Completed',
                 stopNumber: i + 1,
                 latitude: parseFloat(s.latitude || '0'),
                 longitude: parseFloat(s.longitude || '0')
             };
         });

         // 8. Group and Optimize Pending Stops
         
         // 8a. Group Pickups by Location
         const pendingDeliveries: any[] = [];
         const pendingPickups: any[] = [];
         
         pending.forEach((s: any) => {
             const sShipment = s.shipment || {};
             
             // Filter out First Mile Delivery Stops (Hub Dropoffs) - Legacy Support
             if (s.type === 'delivery' && (sShipment.status === 'assigned' || sShipment.status === 'pending')) {
                 return;
             }
             
             const taskType = (s.type || ((sShipment.status === 'picked_up' || sShipment.status === 'in_transit') ? 'delivery' : 'pickup'));
             
             // Normalize internal structure for grouping
             const item = { ...s, _taskType: taskType };
             if (taskType === 'pickup') {
                 pendingPickups.push(item);
             } else {
                 pendingDeliveries.push(item);
             }
         });

         // Group Pickups
         const groupedPickups: any[] = [];
         const pickupGroups = new Map<string, any[]>();
         
         // Helper for key generation
         const getEfficientKey = (item: any) => {
             // Use the same consistent logic as optimization
             const info = optimizeAndMapOrders([item], 0, 0, routeType)[0]; 
             // Note: Calling optimizeAndMapOrders here is slightly inefficient but ensures consistency. 
             // Better: abstract getStopInfo out. For now, let's replicate the core 'Hub vs Merchant' logic briefly:
             
             let lat = 0, lng = 0, address = '';
             const shipment = item.shipment || item;
             
             // Check if Second Leg (Hub Pickup)
             const isSecondLeg = (
                shipment.status === 'received_at_hub' || 
                shipment.status === 'in_transit' || 
                shipment.status === 'out_for_delivery' ||
                ((shipment.status === 'assigned' || shipment.status === 'pending') && !!shipment.pickupRiderId && !!shipment.hubId)
            );

            if (isSecondLeg) {
                 // Use Hub Coords/Address for grouping key
                 lat = shipment.hub?.latitude || 0;
                 lng = shipment.hub?.longitude || 0;
                 address = shipment.hub?.address || shipment.hub?.name || 'Hub';
            } else {
                 // Use Merchant/Raw Coords
                 lat = parseFloat(item.latitude || item.pickupLatitude || shipment.pickupLatitude || shipment.pickup_latitude || '0');
                 lng = parseFloat(item.longitude || item.pickupLongitude || shipment.pickupLongitude || shipment.pickup_longitude || '0');
                 address = item.location || shipment.pickup_address || shipment.pickupAddress || 'Unknown';
            }

            if (lat !== 0 && lng !== 0) return `${lat.toFixed(4)},${lng.toFixed(4)}`;
            return address.trim().toLowerCase();
         };

         pendingPickups.forEach(p => {
             const key = getEfficientKey(p);
             if (!pickupGroups.has(key)) pickupGroups.set(key, []);
             pickupGroups.get(key)?.push(p);
         });

         pickupGroups.forEach((items, key) => {
             if (items.length === 1) {
                 groupedPickups.push(items[0]);
             } else {
                 const first = items[0];
                 const sShipment = first.shipment || {};
                 groupedPickups.push({
                     ...first,
                     id: `group-pick-${key}`,
                     isGroup: true,
                     itemCount: items.length,
                     subItems: items.map(i => ({ shipmentId: i.shipment?.id || i.shipment_id, trackingId: i.shipment?.trackingNumber || i.shipment?.tracking_number })),
                     latitude: first.latitude, longitude: first.longitude, location: first.location, 
                     shipment: { ...sShipment, recipient_name: `${items.length} Pickup(s)`, recipientName: `${items.length} Pickup(s)`, tracking_number: 'Bulk Order', trackingNumber: 'Bulk Order' }
                 });
             }
         });

         // Group Deliveries
         const groupedDeliveries: any[] = [];
         const deliveryGroups = new Map<string, any[]>();
         
         pendingDeliveries.forEach(p => {
             const sShipment = p.shipment || {};
             const lat = parseFloat(p.latitude || p.deliveryLatitude || sShipment.deliveryLatitude || sShipment.delivery_latitude || '0');
             const lng = parseFloat(p.longitude || p.deliveryLongitude || sShipment.deliveryLongitude || sShipment.delivery_longitude || '0');
             const address = p.location || sShipment.delivery_address || sShipment.deliveryAddress || 'Unknown';
             const key = (lat !== 0 && lng !== 0) ? `${lat.toFixed(4)},${lng.toFixed(4)}` : address.trim().toLowerCase();
             
             if (!deliveryGroups.has(key)) deliveryGroups.set(key, []);
             deliveryGroups.get(key)?.push(p);
         });

         deliveryGroups.forEach((items, key) => {
             if (items.length === 1) {
                 groupedDeliveries.push(items[0]);
             } else {
                 const first = items[0];
                 const sShipment = first.shipment || {};
                 groupedDeliveries.push({
                     ...first,
                     id: `group-del-${key}`,
                     isGroup: true,
                     itemCount: items.length,
                     subItems: items.map(i => ({ shipmentId: i.shipment?.id || i.shipment_id, trackingId: i.shipment?.trackingNumber || i.shipment?.tracking_number })),
                     latitude: first.latitude, longitude: first.longitude, location: first.location, 
                     shipment: { ...sShipment, recipient_name: 'Bulk Dropoff', recipientName: 'Bulk Dropoff', tracking_number: `${items.length} Packages`, trackingNumber: `${items.length} Packages` }
                 });
             }
         });

         const itemsToOptimize = [...groupedPickups, ...groupedDeliveries];

         // 8b. Optimize
         const startLat = currentLocation?.lat || DEFAULT_START_LOCATION.lat;
         const startLng = currentLocation?.lng || DEFAULT_START_LOCATION.lng;
         
         const mappedPending = optimizeAndMapOrders(itemsToOptimize, startLat, startLng, routeType);
         
         // 8c. Propagate Group Data
         mappedPending.forEach(stop => {
             const originalInfo = itemsToOptimize.find(o => o.id === stop.id || (o.isGroup && o.id === stop.id) || o.shipment?.id === stop.shipmentId);
             if (originalInfo && originalInfo.isGroup) {
                 stop.itemCount = originalInfo.itemCount;
                 stop.subItems = originalInfo.subItems;
                 stop.recipient = originalInfo.shipment?.recipientName;
                 stop.trackingId = originalInfo.shipment?.trackingNumber;
             }
         });

         // 9. Final List

         let finalStops = [...mappedCompleted, ...mappedPending];
         finalStops.forEach((s, i) => s.stopNumber = i + 1);

         // 10. Mark Active Information
         let activeFound = false;
         let newCurrentIndex = 0;
         finalStops = finalStops.map((stop, index) => {
             if (stop.status === 'completed') return stop;
             if (!activeFound) {
                 activeFound = true;
                 newCurrentIndex = index;
                 return { ...stop, status: 'active' };
             }
             return { ...stop, status: 'pending' }; 
         });
         
         setCurrentStopIndex(newCurrentIndex);
         setStops(finalStops);
         
         // Stats calculation
         calculateStats(finalStops);
     };

     processRoute();
  }, [rawRoutes, activeOrders, routeType, currentLocation, optimizeAndMapOrders, calculateStats, filterOrdersByType]);


  // --- Fetch Data ---
  const fetchRouteData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const [routesRes, ordersRes] = await Promise.all([
          riderApi.getRoutes({ status: 'active,draft,pending,assigned' }).catch(err => { console.warn('Routes error', err); return { data: { routes: [] } }; }),
          riderApi.getActiveOrders().catch(err => { console.warn('Orders error', err); return { data: { orders: [] } }; })
      ]);

      const routes = routesRes.data?.routes || [];
      const orders = ordersRes.data?.orders || [];

      // Update Counts - Aggregate ALL stops from ALL relevant routes
      const activeStats = routes.filter((r: any) => r.status === 'active').reduce((acc: number, r: any) => acc + (r.stops?.length || 0), 0);
      const pendingStats = routes.filter((r: any) => ['pending', 'draft', 'assigned'].includes(r.status)).reduce((acc: number, r: any) => acc + (r.stops?.length || 0), 0);
      
      setRouteSpecs({
          urgent: activeStats > 0 ? activeStats : null,
          nextDay: pendingStats > 0 ? pendingStats : null
      });

      setRawRoutes(routes);
      setActiveOrders(orders);

    } catch (error: any) {
      console.error('Data Fetch Error', error);
      Alert.alert('Error', 'Failed to load data.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, []);

  // --- Location Watcher ---
  useEffect(() => {
      let subscription: Location.LocationSubscription;
      (async () => {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Location permission denied');
                return;
            }
            
            // Initial
            const loc = await Location.getCurrentPositionAsync({});
            setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            
            // Watch
            subscription = await Location.watchPositionAsync(
                { 
                    accuracy: Location.Accuracy.High, 
                    distanceInterval: 100 // Update every 100 meters to avoid jitter
                },
                (newLoc) => {
                    console.log('Location Update:', newLoc.coords.latitude, newLoc.coords.longitude);
                    setCurrentLocation({ lat: newLoc.coords.latitude, lng: newLoc.coords.longitude });
                }
            );
          } catch(e) {
              console.error('Location service error', e);
          }
      })();
      return () => {
          if (subscription) subscription.remove();
      };
  }, []);

  // Initial Fetch
  useEffect(() => {
    fetchRouteData();
  }, [fetchRouteData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRouteData(true);
  }, [fetchRouteData]);

  // Actions
  const handleStartNavigation = useCallback((stop?: RouteStop) => {
    const target = stop || stops[currentStopIndex];
    if (!target) return;

    const lat = target.latitude;
    const lng = target.longitude;
    const label = encodeURIComponent(target.recipient);
    
    // Construct Google Maps URL (or platform specific)
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = lat && lng ? `${lat},${lng}` : target.address;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    Linking.openURL(url || '').catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(latLng as string)}`);
    });
  }, [stops, currentStopIndex]);

  const handleViewFullRoute = useCallback(() => {
     if (stops.length === 0) {
        Alert.alert('Empty Route', 'No stops to map.');
        return;
     }

     const activeStops = stops.filter(s => s.status !== 'completed');
     if (activeStops.length === 0) return;

     const destination = activeStops[activeStops.length - 1];
     const waypoints = activeStops.slice(0, activeStops.length - 1);
     
     // Optimize waypoints order in GMaps too?
     // Since we already optimized locally, passing them in order is fine.
     
     let destQuery = destination.latitude && destination.longitude 
        ? `${destination.latitude},${destination.longitude}`
        : encodeURIComponent(destination.address);

     let url = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}&travelmode=driving`;
     
     if (currentLocation) {
         url += `&origin=${currentLocation.lat},${currentLocation.lng}`;
     }

     if (waypoints.length > 0) {
        const wpQueries = waypoints.map(wp => 
            (wp.latitude && wp.longitude) 
                ? `${wp.latitude},${wp.longitude}` 
                : encodeURIComponent(wp.address)
        ).join('|');
        url += `&waypoints=${wpQueries}`;
     }
     
     Linking.openURL(url);
  }, [stops, currentLocation]);

  const handleStartRoute = useCallback(async () => {
     // Find the pending route ID
     const pendingRoute = rawRoutes.find((r: any) => ['pending', 'assigned', 'draft'].includes(r.status));
     if (!pendingRoute) {
         Alert.alert('Error', 'No Assigned route found.');
         return;
     }
     
     try {
         setLoading(true);
         await riderApi.startRoute(pendingRoute.id);
         Alert.alert('Success', 'Route started! Switch to Urgent tab to begin.');
         // Refresh data
         await fetchRouteData(true);
         // Automatically switch to urgent
         setRouteType('urgent');
     } catch (e: any) {
         Alert.alert('Error', e.message || 'Failed to start route');
     } finally {
         setLoading(false);
     }
  }, [rawRoutes, fetchRouteData]);

  const urgentCount = useMemo(() => 
      routeSpecs.urgent !== null ? routeSpecs.urgent : filterOrdersByType(activeOrders, 'urgent').length, 
  [activeOrders, filterOrdersByType, routeSpecs.urgent]);

  const nextDayCount = useMemo(() => 
      routeSpecs.nextDay !== null ? routeSpecs.nextDay : filterOrdersByType(activeOrders, 'nextDay').length, 
  [activeOrders, filterOrdersByType, routeSpecs.nextDay]);

  return {
    routeType,
    setRouteType,
    stops,
    currentStopIndex,
    routeStats,
    loading,
    refreshing,
    onRefresh,
    handleStartNavigation,
    handleViewFullRoute,
    handleStartRoute,
    handleNavigateToHub: useCallback(() => {
        // Collect ALL Unique Hubs based on CURRENT context first
        const uniqueHubs = new Map<string, any>();
        
        // Filter routes based on what the user is currently looking at
        // If viewing 'urgent', look at 'active' routes. If 'nextDay', look at 'pending/assigned'.
        const targetStatus = routeType === 'urgent' ? ['active'] : ['pending', 'assigned', 'draft'];
        
        const relevantRoutes = rawRoutes.filter((r: any) => targetStatus.includes(r.status));
        
        // 1. From Relevant Routes
        relevantRoutes.forEach((r: any) => {
            if (r.hub) uniqueHubs.set(r.hub.id, r.hub);
        });

        // 2. Determine distinct hubs from RELEVANT context
        let distinctHubs = Array.from(uniqueHubs.values());

        // 3. Fallback: If no hub found in current context (e.g. loose orders only?), check ALL routes/orders
        if (distinctHubs.length === 0) {
             rawRoutes.forEach((r: any) => { if (r.hub) uniqueHubs.set(r.hub.id, r.hub); });
             activeOrders.forEach((o: any) => {
                const h = o.shipment?.hub || o.hub;
                if (h) uniqueHubs.set(h.id, h);
            });
            distinctHubs = Array.from(uniqueHubs.values());
        }

        console.log('NavigateToHub Debug:', { 
            routeType,
            relevantRoutesCount: relevantRoutes.length,
            uniqueHubsFound: distinctHubs.length,
            hubNames: distinctHubs.map(h => h.name)
        });

        if (distinctHubs.length === 0) {
             Alert.alert('Hub Location Not Found', 'Could not determine the Hub location for this route.');
             return;
        }

        const openMap = (hub: any) => {
             const lat = parseFloat(hub.latitude || hub.lat || 0);
             const lng = parseFloat(hub.longitude || hub.lng || 0);
             const label = hub.name || 'Hub';
             const address = hub.address || hub.city || 'Hub Location';

            if (lat !== 0 && lng !== 0) {
                // Navigate to internal Navigation Screen
                navigation.navigate('Navigation', { 
                    type: 'Hub',
                    address: address,
                    latitude: lat,
                    longitude: lng,
                    recipientName: label,
                    trackingId: 'Return to Base',
                });
            } else if (address) {
                 // Even with just address, our NavigationScreen can self-heal/geocode
                 navigation.navigate('Navigation', { 
                    type: 'Hub',
                    address: address,
                    recipientName: label,
                    trackingId: 'Return to Base',
                });
            } else {
                 Alert.alert('Invalid Coordinates', `Hub "${hub.name}" has no location data.`);
            }
        };

        if (distinctHubs.length === 1) {
            // Single Hub - Go Direct
            openMap(distinctHubs[0]);
        } else {
            // Multiple Hubs - Let User Choose
            Alert.alert(
                'Select Hub',
                'Multiple hubs detected. Choose destination:',
                [
                    ...distinctHubs.map(hub => ({
                        text: hub.name || hub.city || 'Hub',
                        onPress: () => openMap(hub)
                    })),
                    { text: 'Cancel', style: 'cancel' }
                ]
            );
        }
    }, [rawRoutes, activeOrders, routeType]),
    stats: {
        urgent: urgentCount,
        nextDay: nextDayCount
    },
    isAssignedRoute
  };
};
