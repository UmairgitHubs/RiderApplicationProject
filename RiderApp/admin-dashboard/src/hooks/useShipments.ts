import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminShipmentsApi } from '@/lib/api'
import { toast } from 'sonner'

interface UseShipmentsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  hubId?: string
  merchantId?: string
  startDate?: string
  endDate?: string
}

export function useShipments(params: UseShipmentsParams = {}) {
  const { 
    page, 
    limit = 10, 
    search, 
    status, 
    hubId, 
    merchantId,
    startDate, 
    endDate 
  } = params

  return useQuery({
    queryKey: ['admin-shipments', page, search, status, hubId, merchantId, startDate, endDate, limit],
    queryFn: () => adminShipmentsApi.getAll({
      page,
      limit,
      search,
      status: status === 'all' ? undefined : status,
      hubId: hubId === 'all' ? undefined : hubId,
      merchantId,
      startDate,
      endDate
    }),
    placeholderData: (previousData) => previousData
  })
}

export function useUnassignedShipments(params: { status?: string; search?: string; limit?: number } = {}) {
  const { status, search, limit = 100 } = params
  
  return useQuery({
    queryKey: ['unassigned-shipments', status, search],
    queryFn: () => adminShipmentsApi.getAll({
      status: status || undefined,
      search: search || undefined,
      limit
    })
  })
}

export function useShipmentDetails(id: string | null) {
  return useQuery({
    queryKey: ['shipment', id],
    queryFn: () => adminShipmentsApi.getById(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
  })
}

export function useUpdateShipment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminShipmentsApi.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipments'] })
      queryClient.invalidateQueries({ queryKey: ['shipment', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      toast.success('Shipment updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update shipment')
    }
  })
}

export function useAllShipments(params: Omit<UseShipmentsParams, 'page' | 'limit'> = {}) {
  return useQuery({
    queryKey: ['admin-shipments-all', params],
    queryFn: () => adminShipmentsApi.getAll({
      ...params,
      page: 1,
      limit: 10000
    }),
    enabled: false
  })
}


