import api from './client'

export const usersApi = {
  getAll: async (params?: { role?: string; status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/users', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/admin/users/${id}`, data)
    return response.data
  },
  updateStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive })
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`)
    return response.data
  },
}
