import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => analyticsApi.getDashboard() 
  })
}

export function useOrderTrend(params: { month: number; year: number }) {
  return useQuery({
    queryKey: ['order-trend', params],
    queryFn: () => analyticsApi.getOrderTrend(params)
  })
}

export function useCalendarData(params: { month: number; year: number }) {
  return useQuery({
    queryKey: ['calendar-data', params],
    queryFn: () => analyticsApi.getCalendar(params)
  })
}
