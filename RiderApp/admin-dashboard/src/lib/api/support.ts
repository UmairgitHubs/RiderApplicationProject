import client from './client';
import { SupportTicket, SupportStat } from '@/types/support';

export const supportApi = {
  getTickets: async (params?: { status?: string; priority?: string; search?: string; page?: number }) => {
    const { data } = await client.get('/admin/support', { params });
    return data;
  },

  getStats: async () => {
    const { data } = await client.get('/admin/support/stats');
    return data;
  },

  getTicketById: async (id: string) => {
    const { data } = await client.get(`/admin/support/${id}`);
    return data;
  },

  reply: async (id: string, message: string, status?: string) => {
    const { data } = await client.post(`/admin/support/${id}/reply`, { message, status });
    return data;
  },

  updateTicket: async (id: string, updates: { status?: string; priority?: string }) => {
    const { data } = await client.patch(`/admin/support/${id}/status`, updates);
    return data;
  },
  
  create: async (payload: { user_id: string; subject: string; category: string; priority?: string; message: string }) => {
    const { data } = await client.post('/admin/support', payload);
    return data;
  },

  searchUsers: async (query: string) => {
    const { data } = await client.get('/admin/support/search-users', { params: { q: query } });
    return data;
  }
};
