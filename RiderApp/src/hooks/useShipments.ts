import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentApi } from '../services/api';

// ... (Shipment interface is used in components, but good to have a shared type eventually)

export const useShipments = (filters: { status?: string; search?: string; limit?: number }) => {
  return useInfiniteQuery({
    queryKey: ['shipments', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const { status, search, limit = 20 } = filters;
      const params = { 
        page: pageParam, 
        limit, 
        ...(status && status !== 'all' ? { status } : {}),
        ...(search ? { search } : {})
      };
      
      const response = await shipmentApi.getAll(params);
      return (response as any).data; 
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      // Assuming API returns pagination metadata like { pagination: { page, totalPages } }
      // Adjust based on actual API response structure
      const { page, totalPages } = lastPage?.pagination || {};
      return (page < totalPages) ? page + 1 : undefined;
    },
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await shipmentApi.create(data);
      if (!(response as any).success) {
        throw new Error((response as any).error?.message || 'Failed to create shipment');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate queries to refresh the list and dashboard stats
      queryClient.invalidateQueries({ queryKey: ['shipments'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-stats'] });
      queryClient.invalidateQueries({ queryKey: ['merchant-recent-shipments'] });
    },
  });
};
