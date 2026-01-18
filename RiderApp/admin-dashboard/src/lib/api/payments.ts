import api from './client';

export const paymentsApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/admin/payments', { params });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/admin/payments/stats');
    return response.data;
  },

  getDetails: async (id: string) => {
    const response = await api.get(`/admin/payments/${id}`);
    return response.data;
  },

  submitToHub: async (id: string) => {
    const response = await api.post(`/admin/payments/${id}/submit-to-hub`);
    return response.data;
  },

  reconcile: async (id: string) => {
    const response = await api.post(`/admin/payments/${id}/reconcile`);
    return response.data;
  }
};
