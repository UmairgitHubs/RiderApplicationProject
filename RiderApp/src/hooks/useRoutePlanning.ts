import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert, Platform, Linking } from 'react-native';
import { riderApi } from '../services/api';

export interface RouteStop {
  id: string;
  trackingId: string;
  recipient: string;
  address: string;
  distance: string;
  estimatedTime: string;
  status: 'active' | 'pending' | 'completed';
  type: 'urgent' | 'nextDay';
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

export const useRoutePlanning = (initialRouteType: 'urgent' | 'nextDay' = 'urgent') => {
  const [routeType, setRouteType] = useState<'urgent' | 'nextDay'>(initialRouteType);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
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

      // Check strictly against schedule
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

  const optimizeRoute = useCallback((orders: any[]) => {
    // Nearest Neighbor implementation
    const unvisited = [...orders];
    const optimized: any[] = [];
    
    let currentLat = DEFAULT_START_LOCATION.lat;
    let currentLng = DEFAULT_START_LOCATION.lng;

    while (unvisited.length > 0) {
      let nearestIndex = -1;
      let minDist = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const order = unvisited[i];
        const oLat = parseFloat(order.deliveryLatitude || order.delivery_latitude || '0');
        const oLng = parseFloat(order.deliveryLongitude || order.delivery_longitude || '0');

        if (oLat === 0 && oLng === 0) continue; // Skip invalid coords, will be appended at end

        const dist = calculateDistance(currentLat, currentLng, oLat, oLng);
        if (dist < minDist) {
          minDist = dist;
          nearestIndex = i;
        }
      }

      if (nearestIndex !== -1) {
        const nearestOrder = unvisited[nearestIndex];
        optimized.push(nearestOrder);
        
        // Update current reference to this stop
        currentLat = parseFloat(nearestOrder.deliveryLatitude || nearestOrder.delivery_latitude);
        currentLng = parseFloat(nearestOrder.deliveryLongitude || nearestOrder.delivery_longitude);
        
        unvisited.splice(nearestIndex, 1);
      } else {
        // Append remaining items with invalid coordinates
        optimized.push(...unvisited);
        break;
      }
    }
    return optimized;
  }, [calculateDistance]);

  const mapToRouteStops = useCallback((orders: any[], type: 'urgent' | 'nextDay'): RouteStop[] => {
    return orders.map((order, index) => {
      const recipientName = order.recipientName || order.recipient_name || 'Customer';
      const rawDist = parseFloat(order.distanceKm || order.distance_km || '0');
      const estimatedMinutes = parseInt(order.estimatedDeliveryTime || order.estimated_delivery_time || DEFAULT_STOP_TIME_MIN);
      
      let status: RouteStop['status'] = 'pending';
      if (index === 0) status = 'active';
      else if (order.status === 'delivered') status = 'completed';

      // Calculate ETA
      const baseTime = new Date();
      let cumulativeMinutes = 0;
      for (let i = 0; i <= index; i++) {
        if (i > 0) cumulativeMinutes += DEFAULT_STOP_TIME_MIN; // Travel buffer
        cumulativeMinutes += estimatedMinutes; // Service time
      }
      baseTime.setMinutes(baseTime.getMinutes() + cumulativeMinutes);
      
      const eta = baseTime.toLocaleTimeString('en-US', { 
        hour: 'numeric',   
        minute: '2-digit',
        hour12: true 
      });

      return {
        id: order.id,
        trackingId: order.trackingNumber || order.tracking_number || '',
        recipient: recipientName,
        address: order.deliveryAddress || order.delivery_address || '',
        distance: `${rawDist.toFixed(1)} km`,
        estimatedTime: `${estimatedMinutes} min`,
        status,
        type,
        eta,
        stopNumber: index + 1,
        latitude: order.deliveryLatitude || order.delivery_latitude,
        longitude: order.deliveryLongitude || order.delivery_longitude, 
      };
    });
  }, []);

  const calculateStats = useCallback((stopsList: RouteStop[]) => {
    const totalKm = stopsList.reduce((sum, stop) => sum + (parseFloat(stop.distance) || 0), 0);
    
    // Estimate total time: sum of service times + travel buffers
    const serviceTime = stopsList.reduce((sum, stop) => sum + (parseInt(stop.estimatedTime) || 10), 0);
    const travelBuffer = Math.max(0, stopsList.length - 1) * DEFAULT_STOP_TIME_MIN;
    
    const completedStops = stopsList.filter(s => s.status === 'completed').length;

    setRouteStats({
      totalStops: stopsList.length,
      totalKm: parseFloat(totalKm.toFixed(1)),
      totalMinutes: serviceTime + travelBuffer,
      completedStops,
      remainingStops: stopsList.length - completedStops,
    });
  }, []);

  const fetchRouteData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      console.log('Fetching route data for:', routeType);
      
      const [routesRes, ordersRes] = await Promise.all([
          riderApi.getRoutes({ status: 'active,draft,pending' }).catch(err => { console.warn('Routes fetch failed', err); return { data: { routes: [] } }; }),
          riderApi.getActiveOrders().catch(err => { console.warn('Orders fetch failed', err); return { data: { orders: [] } }; })
      ]);

      const routes = routesRes.data?.routes || [];
      const allOrders = ordersRes.data?.orders || [];
      setActiveOrders(allOrders);

      // --- 1. Analyze Available Routes for Counts ---
      // We look for ONE Active route (Urgent) and ONE Pending route (Next Day)
      // This logic drives the "Badges" on the tab, regardless of what we are viewing
      const activeRoute = routes.find((r: any) => r.status === 'active');
      const pendingRoute = routes.find((r: any) => r.status === 'pending' || r.status === 'draft');

      setRouteSpecs({
          urgent: activeRoute?.stops?.length ?? null,
          nextDay: pendingRoute?.stops?.length ?? null
      });

      // --- 2. Determine Current View Content ---
      let mappedStops: RouteStop[] = [];
      let usedRoute = false;

      // Decide which route applies to the CURRENT tab
      const targetRoute = routeType === 'urgent' ? activeRoute : pendingRoute;

      if (targetRoute && targetRoute.stops.length > 0) {
             console.log('Using Assigned Route for', routeType, ':', targetRoute.id);
             usedRoute = true;
             setIsAssignedRoute(true);
             
             // First, map basic data
             mappedStops = targetRoute.stops.map((stop: any, index: number) => {
                 const shipment = stop.shipment || {};
                 
                 // Use real backend estimates if available in shipment, otherwise fallbacks
                 // Note: Ideally backend should store per-leg time/distance on RouteStop. 
                 // For now, we use shipment estimates or defaults.
                 const rawDist = stop.distance || shipment.distanceKm || '0';
                 
                 // Improved ETA calculation logic could go here, but for now we keep the sequence
                 // We can potentially use route.duration_min to offset these if we had start time.
                 const now = new Date();
                 now.setMinutes(now.getMinutes() + (index * 20)); 

                 // Robust check: If shipment is delivered, consider stop completed
                 let effectiveStatus = stop.status;
                 if (shipment.status === 'delivered') {
                     effectiveStatus = 'completed';
                 }

                 return {
                     id: shipment.id || stop.id,
                     trackingId: shipment.trackingNumber || '',
                     recipient: shipment.recipientName || 'Customer',
                     address: shipment.address || stop.location || '',
                     // If rawDist is just a number, format it
                     distance: typeof rawDist === 'number' ? `${rawDist.toFixed(1)} km` : `${parseFloat(rawDist).toFixed(1)} km`,
                     estimatedTime: `${DEFAULT_STOP_TIME_MIN} min`,
                     status: effectiveStatus,
                     type: routeType,
                     eta: now.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit'}),
                     stopNumber: stop.stopOrder,
                     latitude: parseFloat(stop.latitude),
                     longitude: parseFloat(stop.longitude),
                     shipmentStatus: shipment.status // Keep track of raw shipment status
                 };
             });

             // Logic to determine "Active" stop (First non-completed)
             let activeFound = false;
             let newCurrentIndex = 0;

             mappedStops = mappedStops.map((stop, index) => {
                 if (stop.status === 'completed') {
                     return stop;
                 }
                 
                 // The first one we find that is NOT completed becomes Active
                 if (!activeFound) {
                     activeFound = true;
                     newCurrentIndex = index;
                     return { ...stop, status: 'active' };
                 }

                 // All subsequent non-completed stops are Pending
                 return { ...stop, status: 'pending' };
             });
             
             // If all are completed, show the last one? or keep index 0? 
             // Usually if all completed, we might stay on last or show summary. 
             // For now, let's keep the calculated index.
             setCurrentStopIndex(newCurrentIndex);
      }

      // --- 3. Fallback to Local Optimization ---
      if (!usedRoute) {
          console.log('Using local optimization for:', routeType);
          setIsAssignedRoute(false);
          const filtered = filterOrdersByType(allOrders, routeType);
          const optimized = optimizeRoute(filtered);
          mappedStops = mapToRouteStops(optimized, routeType);
          
          // Apply same sequential logic to local fallback
           let activeFound = false;
           let newCurrentIndex = 0;

           mappedStops = mappedStops.map((stop, index) => {
               if (stop.status === 'completed') return stop;
               if (!activeFound) {
                   activeFound = true;
                   newCurrentIndex = index;
                   return { ...stop, status: 'active' };
               }
               return { ...stop, status: 'pending' };
           });
           setCurrentStopIndex(newCurrentIndex);
      }

      setStops(mappedStops);
      calculateStats(mappedStops);

    } catch (error: any) {
      console.error('RoutePlanning: Fetch Error', error);
      Alert.alert('Error', error.message || 'Failed to load route data.');
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  }, [routeType, filterOrdersByType, optimizeRoute, mapToRouteStops, calculateStats]);

  // Effects
  useEffect(() => {
    fetchRouteData();
  }, [fetchRouteData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRouteData(true);
  }, [fetchRouteData]);


  // --- Actions ---
  const handleStartNavigation = useCallback((stop?: RouteStop) => {
    // ... existing ...
    const target = stop || stops[currentStopIndex];
    if (!target) return;

    const lat = target.latitude;
    const lng = target.longitude;
    const label = encodeURIComponent(target.recipient);

    let url = '';
    if (lat && lng) {
      const latLng = `${lat},${lng}`;
      url = Platform.select({
        ios: `maps:0,0?q=${label}@${latLng}`,
        android: `geo:0,0?q=${latLng}(${label})`
      }) || '';
    } else {
      url = Platform.select({
        ios: `maps:0,0?q=${encodeURIComponent(target.address)}`,
        android: `geo:0,0?q=${encodeURIComponent(target.address)}`
      }) || '';
    }

    Linking.openURL(url).catch(() => {
       const query = (lat && lng) ? `${lat},${lng}` : target.address;
       Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
    });
  }, [stops, currentStopIndex]);

  const handleViewFullRoute = useCallback(() => {
     // ... existing ...
     if (stops.length === 0) {
        Alert.alert('Empty Route', 'No stops to map.');
        return;
     }

     const activeStops = stops.filter(s => s.status !== 'completed');
     if (activeStops.length === 0) return;

     const destination = activeStops[activeStops.length - 1];
     const waypoints = activeStops.slice(0, activeStops.length - 1);

     let destQuery = destination.latitude && destination.longitude 
        ? `${destination.latitude},${destination.longitude}`
        : encodeURIComponent(destination.address);

     let url = `https://www.google.com/maps/dir/?api=1&destination=${destQuery}`;

     if (waypoints.length > 0) {
        const wpQueries = waypoints.map(wp => 
            (wp.latitude && wp.longitude) 
                ? `${wp.latitude},${wp.longitude}` 
                : encodeURIComponent(wp.address)
        ).join('|');
        url += `&waypoints=${wpQueries}`;
     }
     
     Linking.openURL(url);
  }, [stops]);

  // Counts for the tabs
  // Dynamic: Use RouteSpecs if available, else Fallback to Orders
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
    stats: {
        urgent: urgentCount,
        nextDay: nextDayCount
    },
    isAssignedRoute
  };
};
