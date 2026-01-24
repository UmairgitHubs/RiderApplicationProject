import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { riderApi, authApi, ApiResponse } from '../services/api';

export interface Delivery {
  id: string;
  trackingId: string;
  recipient: string;
  address: string;
  distance: string;
  earnings: number;
  type: 'urgent' | 'nextDay';
  status: 'pending' | 'accepted' | 'pickedUp' | 'inTransit';
  eta?: string;
  lastUpdate?: string;
}

export interface Completion {
  id: string;
  trackingId: string;
  recipient: string;
  distance: string;
  earnings: number;
  type: 'urgent' | 'nextDay';
  actualDeliveryTime?: string;
}

export interface DashboardStats {
  active: number;
  todayEarnings: number;
  totalEarnings: number;
}

export const useRiderDashboard = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'nextDay'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    active: 0,
    todayEarnings: 0,
    totalEarnings: 0,
  });
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [recentCompletions, setRecentCompletions] = useState<Completion[]>([]);
  const [userName, setUserName] = useState('Rider');
  const [isOnline, setIsOnline] = useState(false);
  
  // Routes State
  const [routeCounts, setRouteCounts] = useState<{ urgent: number | null, nextDay: number | null }>({ urgent: null, nextDay: null });

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Parallel data fetching for optimization
      const [userResponse, activeOrdersResponse, earningsResponse, completedResponse, routesResponse] = await Promise.all([
        authApi.getStoredUser(), 
        riderApi.getActiveOrders(),
        riderApi.getEarnings({ startDate: today.toISOString() }),
        riderApi.getCompletedOrders({ limit: 5 }),
        riderApi.getRoutes({ status: 'active,draft,pending' }).catch(err => { console.warn('Routes fetch failed', err); return { data: { routes: [] } }; })
      ]);

      console.log('Earnings Response:', JSON.stringify(earningsResponse, null, 2));

      // Process User
      if (userResponse?.fullName) {
        setUserName(userResponse.fullName);
      }
      if (userResponse?.isOnline !== undefined) {
          setIsOnline(userResponse.isOnline);
      }

      // Process Routes for Counts
      const routes = routesResponse?.data?.routes || [];
      const activeRoute = routes.find((r: any) => r.status === 'active');
      const pendingRoute = routes.find((r: any) => r.status === 'pending' || r.status === 'draft'); // "Standard" is usually pending

      setRouteCounts({
          urgent: activeRoute?.stops?.filter((s:any) => s.status !== 'completed' && s.shipment?.status !== 'delivered').length ?? null,
          nextDay: pendingRoute?.stops?.filter((s:any) => s.status !== 'completed' && s.shipment?.status !== 'delivered').length ?? null
      });

      // Process Active Orders - Derived STRICTLY from Routes
      const routeDerivedDeliveries: Delivery[] = [];
      const urgentStops = activeRoute?.stops || [];
      const nextDayStops = pendingRoute?.stops || [];

      // Helper to map stops to Delivery objects
      const mapStopsToDeliveries = (stops: any[], type: 'urgent' | 'nextDay') => {
          return stops
             .filter((s: any) => s.shipment && s.status !== 'completed' && s.shipment.status !== 'delivered') // Filter out completed
             .map((stop: any) => {
                 const shipment = stop.shipment;
                 const distanceKm = shipment.distanceKm;
                 const distance = distanceKm ? `${parseFloat(distanceKm).toFixed(1)} km` : 'N/A';
                 
                 // Map status
                 let dStatus: Delivery['status'] = 'pending';
                 // If stop is active, it's effectively 'inTransit' for the rider
                 if (stop.status === 'active') dStatus = 'inTransit';

                 return {
                     id: shipment.id,
                     trackingId: shipment.trackingNumber,
                     recipient: shipment.recipientName || 'Customer',
                     address: shipment.address,
                     distance: distance,
                     earnings: 0, 
                     type: type,
                     status: dStatus,
                     eta: stop.estimatedTime || 'N/A',
                     lastUpdate: undefined
                 };
             });
      };

      routeDerivedDeliveries.push(...mapStopsToDeliveries(urgentStops, 'urgent'));
      routeDerivedDeliveries.push(...mapStopsToDeliveries(nextDayStops, 'nextDay'));
      
      const mappedDeliveries = routeDerivedDeliveries;

      // Process Completed Orders
      const completedOrders = completedResponse?.data?.shipments || [];
      const mappedCompletions: Completion[] = completedOrders
        .slice(0, 5) // Ensure only 5 are actually used even if backend returned more
        .map((order: any) => {
          const recipientName = order.recipientName || order.recipient_name || 'Customer';
          
          let type: 'urgent' | 'nextDay' = 'urgent';
          if (order.scheduledDeliveryTime || order.scheduled_delivery_time) {
            const scheduledTime = new Date(order.scheduledDeliveryTime || order.scheduled_delivery_time);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            if (scheduledTime >= tomorrow) {
              type = 'nextDay';
            }
          }

          const distanceKm = order.distanceKm || order.distance_km;
          const distance = distanceKm ? `${parseFloat(distanceKm).toFixed(1)} km` : 'N/A';

          return {
            id: order.id,
            trackingId: order.trackingNumber || order.tracking_number || '',
            recipient: recipientName,
            distance,
            earnings: parseFloat(order.deliveryFee || order.delivery_fee || 0),
            type,
            actualDeliveryTime: order.actualDeliveryTime
          };
        });

      // Process Stats
      const earningsData = earningsResponse?.data || {};
      const activeCount = mappedDeliveries.length;
      const todayEarnings = Number(earningsData.periodEarnings || earningsData.todayEarnings || 0);
      const totalEarnings = Number(earningsData.totalEarnings || 0);

      setStats({
        active: activeCount,
        todayEarnings,
        totalEarnings,
      });
      setDeliveries(mappedDeliveries);
      setRecentCompletions(mappedCompletions);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert(
        'Connection Error',
        'Failed to update dashboard. Please pull to refresh.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const toggleOnline = useCallback(async (value: boolean) => {
      // Optimistically update
      const previous = isOnline;
      setIsOnline(value);
      
      try {
          const response = await riderApi.toggleOnlineStatus(value);
          if (response.success && response.data) {
              setIsOnline(response.data.isOnline);
          } else {
              // Revert
              setIsOnline(previous);
              Alert.alert('Error', 'Failed to update status');
          }
      } catch (error) {
          setIsOnline(previous);
          Alert.alert('Error', 'Failed to update status');
      }
  }, [isOnline]);

  // Compute filtered lists
  const filteredDeliveries = useMemo(() => {
    return activeFilter === 'all' 
      ? deliveries 
      : deliveries.filter(d => d.type === activeFilter);
  }, [deliveries, activeFilter]);

  const counts = useMemo(() => {
      // Use Route counts if they were fetched successfully, otherwise fall back to raw delivery counts
      const derivedUrgent = routeCounts.urgent !== null ? routeCounts.urgent : deliveries.filter(d => d.type === 'urgent').length;
      const derivedNextDay = routeCounts.nextDay !== null ? routeCounts.nextDay : deliveries.filter(d => d.type === 'nextDay').length;
      
      return {
        urgent: derivedUrgent,
        nextDay: derivedNextDay
      };
  }, [deliveries, routeCounts]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Fetch data on focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  return {
    userName,
    stats,
    loading,
    refreshing,
    activeFilter,
    setActiveFilter,
    filteredDeliveries,
    recentCompletions,
    deliveries,
    counts,
    onRefresh,
    isOnline,
    toggleOnline
  };
};
