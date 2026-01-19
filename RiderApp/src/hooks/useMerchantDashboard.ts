import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { shipmentApi } from '../services/api';

export interface DashboardStats {
  active: number;
  delivered: number;
  total: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  recipientName: string;
  deliveryAddress: string;
  deliveryFee: number;
  codAmount: number;
  packageCount: number;
  rider?: {
    full_name: string;
  };
}

export const useMerchantDashboard = () => {
  // Query for Dashboard Stats
  const { 
    data: stats, 
    isLoading: statsLoading, 
    refetch: refetchStats,
    isRefetching: statsRefetching
  } = useQuery({
    queryKey: ['merchant-stats'],
    queryFn: async () => {
      const response = await shipmentApi.getStats();
      return (response as any).data;
    },
    initialData: { active: 0, delivered: 0, total: 0 }
  });

  // Query for Recent Shipments
  const { 
    data: shipmentsData, 
    isLoading: shipmentsLoading, 
    refetch: refetchShipments,
    isRefetching: shipmentsRefetching
  } = useQuery({
    queryKey: ['merchant-recent-shipments'],
    queryFn: async () => {
      const response = await shipmentApi.getAll({ limit: 10 });
      return (response as any).data?.shipments || [];
    },
    initialData: []
  });

  // Refetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchStats();
      refetchShipments();
    }, [])
  );

  const onRefresh = useCallback(() => {
    refetchStats();
    refetchShipments();
  }, []);

  // Derived state from query data
  const activeShipment = shipmentsData.find((s: any) => 
    ['in_transit', 'picked_up', 'assigned'].includes(s.status) && !(s.batchId || s.batch_id) // Prioritize individual active
  ) || null;

  // Group by Batch ID for Franchise Orders
  const franchiseOrders = shipmentsData.reduce((acc: any, curr: any) => {
    const batchId = curr.batchId || curr.batch_id;
    if (batchId) {
      if (!acc[batchId]) {
        acc[batchId] = {
          id: batchId,
          status: 'active', // Derived from first item
          pieces: 0,
          destinations: []
        };
      }
      acc[batchId].pieces += 1;
      acc[batchId].destinations.push({
        id: acc[batchId].pieces,
        name: curr.recipientName || curr.recipient_name,
        location: curr.deliveryAddress || curr.delivery_address,
        tracking: curr.trackingNumber || curr.tracking_number
      });
    }
    return acc;
  }, {});

  // Get the most recent/active franchise order
  const activeBulkOrder = Object.values(franchiseOrders)[0] || null;

  const recentShipments = shipmentsData
    .filter((s: any) => s.id !== activeShipment?.id && !(s.batchId || s.batch_id)) // Exclude batch items from individual list
    .slice(0, 3);

  return {
    stats: stats as DashboardStats,
    activeShipment: activeShipment as Shipment | null,
    activeBulkOrder: activeBulkOrder as any,
    recentShipments: recentShipments as Shipment[],
    loading: statsLoading || shipmentsLoading,
    refreshing: statsRefetching || shipmentsRefetching,
    onRefresh
  };
};
