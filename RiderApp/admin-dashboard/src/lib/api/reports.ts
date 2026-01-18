import api from './client'

export interface ReportsResponse {
  kpi: {
    total_deliveries: number
    total_revenue: number
    total_cod: number
    success_rate: number
  }
  trends: {
    date: string
    deliveries: number
    revenue: number
    cod: number
  }[]
  distribution: {
    status: { name: string; value: number; color: string }[]
    payment: { name: string; value: number; color: string }[]
  }
  riders: { name: string; deliveries: number; rating: number }[]
  hubs: { name: string; delivered: number; failed: number }[]
  merchants: { name: string; revenue: number; shipments: number }[]
}

export const reportsApi = {
  getReports: async (params?: { startDate?: string; endDate?: string }): Promise<ReportsResponse> => {
    const response = await api.get('/admin/reports', { params })
    return response.data.data
  }
}
