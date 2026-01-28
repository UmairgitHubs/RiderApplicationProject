import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert, Platform, Linking } from 'react-native';
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

  // Updated Optimization: Sorts by Nearest Neighbor starting from 'startLocation'
  const optimizeAndMapOrders = useCallback((orders: any[], startLat: number, startLng: number, type: 'urgent' | 'nextDay') => {
    const unvisited = [...orders];
    const optimizedStops: RouteStop[] = [];
    
    let currentLat = startLat;
    let currentLng = startLng;
    let stopOrderCounter = 1;
    let accumulatedTimeMin = 0;

    // Validate Start Location
    if (!currentLat || !currentLng) {
        currentLat = 0;
        currentLng = 0;
    }

    // Helper to get coords and info based on task type
    const getStopInfo = (item: any) => {
        const shipment = item.shipment || item;
        // Determine task type: explicitly from route stop, or infer from shipment status
        let taskType: 'pickup' | 'delivery' = 'delivery'; // Default
        
        if (item.type && (item.type === 'pickup' || item.type === 'delivery')) {
            taskType = item.type;
        } else if (shipment.status === 'assigned' || shipment.status === 'pending') {
            // If just assigned/pending and no explicit route stop type, assume pickup? 
            // Or if we are in 'activeOrders' mode (no route), 'assigned' usually means we need to pick it up.
            // But 'pending' means unassigned?
            // Let's stick to: if explicit type exists, use it. Else check status.
            taskType = (shipment.status === 'picked_up' || shipment.status === 'in_transit') ? 'delivery' : 'pickup';
        }

        // Get Coords based on taskType
        let latVal, lngVal, address;
        
        if (taskType === 'pickup') {
            latVal = item.latitude || shipment.pickupLatitude || shipment.pickup_latitude;
            lngVal = item.longitude || shipment.pickupLongitude || shipment.pickup_longitude;
            address = item.location || shipment.pickupAddress || shipment.pickup_address;
        } else {
            latVal = item.latitude || shipment.deliveryLatitude || shipment.delivery_latitude;
            lngVal = item.longitude || shipment.deliveryLongitude || shipment.delivery_longitude;
            address = item.location || shipment.deliveryAddress || shipment.delivery_address || shipment.address;
        }
        
        // Fallbacks if specific ones missing (e.g. item.latitude might be the correct one regardless of type if provided by backend stop)
        if (!latVal) latVal = item.latitude || shipment.latitude;
        if (!lngVal) lngVal = item.longitude || shipment.longitude;
        if (!address) address = item.location || shipment.address;

        return {
            lat: parseFloat(latVal || '0'),
            lng: parseFloat(lngVal || '0'),
            address: address || '',
            taskType
        };
    };

    while (unvisited.length > 0) {
      let nearestIndex = -1;
      let minDist = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const order = unvisited[i];
        const { lat, lng } = getStopInfo(order);

        if (lat === 0 && lng === 0) continue;

        const dist = (currentLat === 0 && currentLng === 0) ? 0 : calculateDistance(currentLat, currentLng, lat, lng);
        
        if (dist < minDist) {
          minDist = dist;
          nearestIndex = i;
        }
      }

      if (nearestIndex !== -1) {
        const nearest = unvisited[nearestIndex];
        const shipment = nearest.shipment || nearest;
        const { lat, lng, address, taskType } = getStopInfo(nearest);
        
        // Dynamic Service Time - Ensure we handle ISO dates vs numbers correctly
        let serviceTimeDiff = DEFAULT_SERVICE_TIME_MIN;
        const estTime = shipment.estimatedDeliveryTime || shipment.estimated_delivery_time || shipment.estimatedTime;
        
        if (estTime) {
            // If it's a number or numeric string
            if (!isNaN(Number(estTime))) {
                serviceTimeDiff = parseInt(String(estTime));
            } 
            // If it's likely a Date, we can't easily infer "duration" from a timestamp without start time
            // So we stick to default for service time duration
        }
        
        // Travel Time Estimation
        const roadDistanceKm = minDist * ROAD_FACTOR;
        const travelTimeMin = (roadDistanceKm / AVERAGE_SPEED_KMPH) * 60; 
        
        accumulatedTimeMin += Math.round(travelTimeMin + serviceTimeDiff);

        // Calculate ETA
        const now = new Date();
        now.setMinutes(now.getMinutes() + accumulatedTimeMin);

        optimizedStops.push({
            id: nearest.id || `${shipment.id || 'unknown'}-${taskType}-${stopOrderCounter}`,
            shipmentId: shipment.id,
            trackingId: shipment.trackingNumber || shipment.tracking_number || '',
            recipient: shipment.recipientName || shipment.recipient_name || 'Customer',
            address: address,
            distance: `${roadDistanceKm.toFixed(1)} km`, 
            estimatedTime: `${serviceTimeDiff} min`,
            status: 'pending', 
            type, // Route Type (Urgent/NextDay)
            taskType, // Pickup/Delivery
            eta: now.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'}),
            stopNumber: stopOrderCounter,
            latitude: lat,
            longitude: lng,
        });

        currentLat = lat;
        currentLng = lng;
        stopOrderCounter++;
        unvisited.splice(nearestIndex, 1);
      } else {
        // Handle remaining items with invalid coords
        unvisited.forEach(u => {
             const s = u.shipment || u;
             const { taskType } = getStopInfo(u);
             optimizedStops.push({
                 id: u.id || `${s.id || 'unknown'}-${taskType}-${stopOrderCounter}`,
                 shipmentId: s.id,
                 trackingId: s.trackingNumber || '',
                 recipient: s.recipientName || 'Unknown',
                 address: s.address || 'Unknown',
                 distance: '0 km', // Invalid coords = 0 km
                 estimatedTime: `${DEFAULT_SERVICE_TIME_MIN} min`,
                 status: 'pending',
                 type,
                 taskType,
                 eta: 'N/A',
                 stopNumber: stopOrderCounter++,
                 latitude: 0,
                 longitude: 0
             });
        });
        break;
      }
    }
    return optimizedStops;
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
         // STRICT LOGIC:
         // - "Urgent" Tab = Status 'active' (In Progress)
         // - "Next Day" Tab = Status 'assigned' | 'pending' | 'draft' (Not started yet)
         
         const activeRoute = rawRoutes.find((r: any) => r.status === 'active');
         const pendingRoute = rawRoutes.find((r: any) => ['pending', 'assigned', 'draft'].includes(r.status));
         
         // Select route based on the requested tab (routeType)
         let targetRoute: any = null;
         
         if (routeType === 'urgent') {
             targetRoute = activeRoute;
         } else {
             targetRoute = pendingRoute;
         }
         
         // Start Point: Rider Location or Default
         const startLat = currentLocation?.lat || DEFAULT_START_LOCATION.lat;
         const startLng = currentLocation?.lng || DEFAULT_START_LOCATION.lng;

         let finalStops: RouteStop[] = [];
         let usedRoute = false;

         if (targetRoute && targetRoute.stops.length > 0) {
             usedRoute = true;
             setIsAssignedRoute(true);

             // Deduplicate stops to ensure uniqueness (Shipment ID + Type)
             // This safeguards against backend data corruption or duplicate entries
             const uniqueStopsMap = new Map();
             targetRoute.stops.forEach((s: any) => {
                 const key = `${s.shipment_id || s.shipmentId}-${s.type}-${s.location}`;
                 if (!uniqueStopsMap.has(key)) {
                     uniqueStopsMap.set(key, s);
                 }
             });
             const dedupedStops = Array.from(uniqueStopsMap.values());

             // Separate Completed vs Pending using deduped list
             const completed = dedupedStops.filter((s:any) => s.status === 'completed' || s.shipment?.status === 'delivered');
             const pending = dedupedStops.filter((s:any) => s.status !== 'completed' && s.shipment?.status !== 'delivered');
             
             // 1. Map Completed (Keep as is, distance 0 or original)
             const mappedCompleted: RouteStop[] = completed.map((s:any, i:number) => ({
                 // Critical: Use valid Stop ID, or composite to ensure uniqueness
                 id: s.id || `${s.shipment?.id || 'unknown'}-${s.type || 'stop'}-${i}`,
                 shipmentId: s.shipment?.id || s.shipment_id,
                 trackingId: s.shipment?.trackingNumber || '',
                 recipient: s.shipment?.recipientName || 'Customer',
                 address: s.shipment?.address || s.location || '',
                 distance: '0 km', // Already done
                 estimatedTime: '0 min',
                 status: 'completed' as const,
                 type: routeType,
                 taskType: (s.type || ((s.shipment?.status === 'picked_up' || s.shipment?.status === 'in_transit') ? 'delivery' : 'pickup')) as 'pickup' | 'delivery',
                 eta: 'Completed',
                 stopNumber: i + 1,
                 latitude: parseFloat(s.latitude),
                 longitude: parseFloat(s.longitude)
             }));

             // 2. Optimally Sort Pending based on Current Location
             // Note: We ignore backend sequence to prioritize "Closest First" for the rider
             const mappedPending = optimizeAndMapOrders(pending, startLat, startLng, routeType);

             // 3. Combine
             finalStops = [...mappedCompleted, ...mappedPending];
             
             // Adjust stop numbers
             finalStops.forEach((s, i) => s.stopNumber = i + 1);

         } else {
             // Local Optimization
             usedRoute = false;
             setIsAssignedRoute(false);
             const filtered = filterOrdersByType(activeOrders, routeType);
             
             // Sort all
             finalStops = optimizeAndMapOrders(filtered, startLat, startLng, routeType);
         }

         // Mark Active (First Pending)
         let activeFound = false;
         let newCurrentIndex = 0;
         finalStops = finalStops.map((stop, index) => {
             if (stop.status === 'completed') return stop;
             if (!activeFound) {
                 activeFound = true;
                 newCurrentIndex = index;
                 
                 // CRITICAL: Update distance for FIRST active stop to be from RIDER
                 // optimizeAndMapOrders already did this relative to startLat/Lng!
                 return { ...stop, status: 'active' };
             }
             return { ...stop, status: 'pending' }; 
         });
         
         setCurrentStopIndex(newCurrentIndex);
         setStops(finalStops);
         
         // Stats - Pass possible overrides but calculateStats determines validity
         const overrides = (usedRoute && targetRoute) ? {
            totalKm: targetRoute.distance || targetRoute.distance_km ? Number(targetRoute.distance || targetRoute.distance_km) : undefined,
            totalMinutes: targetRoute.duration || targetRoute.duration_min ? Number(targetRoute.duration || targetRoute.duration_min) : undefined
        } : undefined;
        
        calculateStats(finalStops, overrides);
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

      // Update Counts
      const activeRoute = routes.find((r: any) => r.status === 'active');
      const pendingRoute = routes.find((r: any) => r.status === 'pending' || r.status === 'draft');
      setRouteSpecs({
          urgent: activeRoute?.stops?.length ?? null,
          nextDay: pendingRoute?.stops?.length ?? null
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
    stats: {
        urgent: urgentCount,
        nextDay: nextDayCount
    },
    isAssignedRoute
  };
};
