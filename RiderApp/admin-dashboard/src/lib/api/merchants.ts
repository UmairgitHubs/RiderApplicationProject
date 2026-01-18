import api from './client'

export const merchantsApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/merchants', { params })
    return response.data
  },
  getStats: async () => {
    const response = await api.get('/admin/merchants/stats')
    return response.data
  },
  getDetails: async (id: string) => {
    const response = await api.get(`/admin/merchants/${id}`)
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/admin/merchants/${id}`, data)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/admin/merchants', data)
    return response.data
  }
}
