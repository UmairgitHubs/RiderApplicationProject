import api from './client'

export const routesApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/admin/routes', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/routes/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/admin/routes', data)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/admin/routes/${id}`, data)
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/routes/${id}`)
    return response.data
  },
  getStats: async () => {
    const response = await api.get('/admin/routes/stats')
    return response.data
  },
  optimize: async () => {
    const response = await api.post('/admin/routes/optimize')
    return response.data
  },
  getUnassignedShipments: async (params?: any) => {
    const response = await api.get('/admin/routes/unassigned-shipments', { params })
    return response.data
  },
  getAvailableRiders: async (params?: any) => {
    const response = await api.get('/admin/routes/available-riders', { params })
    return response.data
  }
}

