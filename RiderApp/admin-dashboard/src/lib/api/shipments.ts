import api from './client'

export const shipmentsApi = {
  getAll: async (params?: { status?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/shipments', { params }) // Using admin payload for now as frontend used this
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/shipments/${id}`)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/admin/shipments/${id}`, data)
    return response.data
  },
  cancel: async (id: string) => {
    const response = await api.post(`/admin/shipments/${id}/cancel`)
    return response.data
  },
}

export const adminShipmentsApi = {
  getAll: async (params?: { 
    status?: string; 
    page?: number; 
    limit?: number; 
    search?: string; 
    startDate?: string; 
    endDate?: string; 
    hubId?: string;
    merchantId?: string;
  }) => {
    const response = await api.get('/admin/shipments', { params })
    return response.data
  },
  getById: async (id: string) => {
    const response = await api.get(`/admin/shipments/${id}`)
    return response.data
  },
  update: async (id: string, data: any) => {
    const response = await api.patch(`/admin/shipments/${id}`, data)
    return response.data
  },
  cancel: async (id: string) => {
    const response = await api.post(`/admin/shipments/${id}/cancel`)
    return response.data
  },
  addNote: async (id: string, note: string) => {
    const response = await api.post(`/admin/shipments/${id}/note`, { note })
    return response.data
  },
  getHubs: async () => {
    const response = await api.get('/admin/shipments/hubs')
    return response.data
  }
}
