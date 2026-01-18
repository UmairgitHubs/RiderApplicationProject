import api from './client'
import { WalletResponse, WalletFilters } from '@/types/wallet'

export const walletApi = {
  getWallets: async (filters: WalletFilters): Promise<WalletResponse> => {
    const response = await api.get('/admin/wallets', { params: filters })
    return response.data.data
  },
  getWalletDetails: async (userId: string, params?: { page?: number; limit?: number; startDate?: string; endDate?: string }) => {
    const response = await api.get(`/admin/wallets/${userId}`, { params })
    return response.data.data
  },
  getAllTransactions: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/admin/wallets', { params }) // This might key off something else later but for now we focused on getWallets
    return response.data
  },
  getAllPayments: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/admin/payments', { params })
    return response.data
  },
  updateTransactionStatus: async (transactionId: string, status: 'completed' | 'rejected') => {
    const response = await api.patch(`/admin/wallets/transactions/${transactionId}/status`, { status })
    return response.data
  },
}
