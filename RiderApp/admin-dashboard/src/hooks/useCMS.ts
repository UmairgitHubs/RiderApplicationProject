import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cmsApi } from '@/lib/api'
import { toast } from 'sonner'
import { CMSItem } from '@/types/cms'

export function useCMS(params?: { type?: string; search?: string }) {
  return useQuery({
    queryKey: ['cms', params],
    queryFn: () => cmsApi.getAll(params),
  })
}

export function useCMSStats() {
  return useQuery({
    queryKey: ['cms-stats'],
    queryFn: () => cmsApi.getStats(),
  })
}

export function useCreateCMS() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<CMSItem>) => cmsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
      queryClient.invalidateQueries({ queryKey: ['cms-stats'] })
      toast.success('Content created successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create content')
    }
  })
}

export function useUpdateCMS() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CMSItem> }) => cmsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
      toast.success('Content updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update content')
    }
  })
}

export function useDeleteCMS() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cmsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms'] })
      queryClient.invalidateQueries({ queryKey: ['cms-stats'] })
      toast.success('Content deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete content')
    }
  })
}
