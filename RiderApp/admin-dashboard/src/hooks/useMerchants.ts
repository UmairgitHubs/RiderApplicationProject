import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { merchantsApi } from '@/lib/api'
import { toast } from 'sonner'

interface UseMerchantsParams {
  page?: number
  limit?: number
  search?: string
}

export function useMerchants(params: UseMerchantsParams = {}) {
  const { page = 1, limit = 100, search = '' } = params

  return useQuery({
    queryKey: ['merchants', page, search],
    queryFn: () => merchantsApi.getAll({ search, page, limit }),
    placeholderData: keepPreviousData
  })
}

export function useMerchantStats() {
  return useQuery({
    queryKey: ['merchants-stats'],
    queryFn: () => merchantsApi.getStats()
  })
}


export function useUpdateMerchant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => merchantsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
      queryClient.invalidateQueries({ queryKey: ['merchants-stats'] })
      toast.success('Merchant updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update merchant')
    }
  })
}

export function useCreateMerchant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: any) => merchantsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
      queryClient.invalidateQueries({ queryKey: ['merchants-stats'] })
      toast.success('Merchant created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create merchant')
    }
  })
}

