import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { ridersApi } from '@/lib/api'
import { toast } from 'sonner'

interface UseRidersParams {
  page?: number
  search?: string
  status?: string
  isOnline?: string
  hubId?: string
}

export function useRiders(params: UseRidersParams = {}) {
  const { page = 1, search = '', status = 'all', isOnline = 'all', hubId } = params

  return useQuery({
    queryKey: ['riders', page, search, status, isOnline, hubId],
    queryFn: () => ridersApi.getAll({ page, search, status, is_online: isOnline, hubId }),
    placeholderData: keepPreviousData
  })
}

export function useRiderStats() {
  return useQuery({
    queryKey: ['riders-stats'],
    queryFn: () => ridersApi.getStats()
  })
}

export function useRiderDetails(id: string) {
  return useQuery({
    queryKey: ['rider-details', id],
    queryFn: () => ridersApi.getDetails(id),
    enabled: !!id
  })
}

export function useUpdateRider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => ridersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] })
      queryClient.invalidateQueries({ queryKey: ['riders-stats'] })
      toast.success('Rider updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update rider')
    }
  })
}

export function useAssignShipments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ riderId, shipmentIds }: { riderId: string; shipmentIds: string[] }) => 
      ridersApi.assignShipments(riderId, shipmentIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] })
      queryClient.invalidateQueries({ queryKey: ['unassigned-shipments'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to assign shipments')
    }
  })
}

export function useDeleteRider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ridersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] })
      queryClient.invalidateQueries({ queryKey: ['riders-stats'] })
      toast.success('Rider deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete rider')
    }
  })
}

export function useSuspendRider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ridersApi.suspend(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['riders'] })
      queryClient.invalidateQueries({ queryKey: ['rider-details', id] })
      toast.success('Rider suspended successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to suspend rider')
    }
  })
}

export function useCreateRider() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => ridersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riders'] })
      queryClient.invalidateQueries({ queryKey: ['riders-stats'] })
      toast.success('Rider created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create rider')
    }
  })
}
