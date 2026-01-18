import { useQuery } from '@tanstack/react-query'
import { hubsApi } from '@/lib/api/hubs'

export function useHubs() {
  return useQuery({
    queryKey: ['admin-hubs'],
    queryFn: () => hubsApi.getAll(),
    staleTime: 1000 * 60 * 5 
  })
}
