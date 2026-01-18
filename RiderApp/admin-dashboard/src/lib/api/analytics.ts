import api from './client'

export const analyticsApi = {
  getDashboard: async () => {
    const response = await api.get('/admin/analytics/dashboard')
    return response.data
  },
  getRevenue: async (params?: { period?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/admin/analytics/revenue', { params })
    return response.data
  },
  getUsers: async (params?: { period?: string }) => {
    const response = await api.get('/admin/analytics/users', { params })
    return response.data
  },
  getShipments: async (params?: { period?: string }) => {
    const response = await api.get('/admin/analytics/shipments', { params })
    return response.data
  },
  getRiders: async (params?: { period?: string }) => {
    const response = await api.get('/admin/analytics/riders', { params })
    return response.data
  },
  getOrderTrend: async (params: { month: number; year: number }) => {
    const response = await api.get('/admin/analytics/orders-trend', { params })
    return response.data
  },
  getCalendar: async (params: { month: number; year: number }) => {
    const response = await api.get('/admin/analytics/calendar', { params })
    return response.data
  },
}
