import api from './client';
import { Agent, AgentStats } from '@/types/agent';

export const agentsApi = {
  getAll: async (params?: { search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/agents', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<{ success: boolean; data: AgentStats }>('/admin/agents/stats');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/admin/agents', data);
    return response.data;
  },

  getDetails: async (id: string) => {
    const response = await api.get(`/admin/agents/${id}`);
    return response.data;
  }
};
