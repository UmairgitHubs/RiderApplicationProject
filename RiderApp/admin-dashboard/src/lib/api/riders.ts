import api from './client'

export const ridersApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number; status?: string; is_online?: string; hubId?: string }) => {
    const response = await api.get('/admin/riders', { params })
    return response.data
  },
  getStats: async () => {
    const response = await api.get('/admin/riders/stats')
    return response.data
  },
  getDetails: async (id: string) => {
    const response = await api.get(`/admin/riders/${id}`)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/admin/riders/${id}`, data)
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/riders/${id}`)
    return response.data
  },
  assignShipments: async (id: string, shipmentIds: string[]) => {
    const response = await api.post(`/admin/riders/${id}/assign-orders`, { shipmentIds })
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/admin/riders', data)
    return response.data
  },
  suspend: async (id: string) => {
    const response = await api.post(`/admin/riders/${id}/suspend`)
    return response.data
  }
}
