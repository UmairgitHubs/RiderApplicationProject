import api from './client'
import { CMSItem } from '@/types/cms'

export const cmsApi = {
  getAll: async (params?: { type?: string; search?: string }) => {
    const response = await api.get('/admin/cms', { params })
    return response.data
  },
  getStats: async () => {
    const response = await api.get('/admin/cms/stats')
    return response.data
  },
  create: async (data: Partial<CMSItem>) => {
    const response = await api.post('/admin/cms', data)
    return response.data
  },
  update: async (id: string, data: Partial<CMSItem>) => {
    const response = await api.patch(`/admin/cms/${id}`, data)
    return response.data
  },
  delete: async (id: string) => {
    const response = await api.delete(`/admin/cms/${id}`)
    return response.data
  }
}
