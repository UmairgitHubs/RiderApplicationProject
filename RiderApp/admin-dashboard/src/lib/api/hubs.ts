import api from './client'

export const hubsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/admin/hubs', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/hubs/${id}`)
    return response.data
  },
  create: async (data: any) => {
    const response = await api.post('/admin/hubs', data)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/admin/hubs/${id}`, data)
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/hubs/${id}`)
    return response.data
  },
  getRiders: async (id: string) => {
    const response = await api.get(`/admin/hubs/${id}/riders`)
    return response.data
  },
  getStats: async () => {
    const response = await api.get('/admin/hubs/stats')
    return response.data
  },
  getManagers: async () => {
    const response = await api.get('/admin/hubs/managers')
    return response.data
  },
}
