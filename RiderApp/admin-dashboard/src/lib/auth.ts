import Cookies from 'js-cookie'
import { authApi } from './api'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'hub_manager'
  is_active: boolean
}

export const auth = {
  getToken: (): string | undefined => {
    return Cookies.get('admin_token')
  },

  setToken: (token: string): void => {
    Cookies.set('admin_token', token, { expires: 7 })
  },

  removeToken: (): void => {
    Cookies.remove('admin_token')
  },

  isAuthenticated: (): boolean => {
    return !!Cookies.get('admin_token')
  },

  logout: async (): Promise<void> => {
    try {
      await authApi.logout()
    } catch (error) {
    } finally {
      auth.removeToken()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  },

  getCurrentUser: async (): Promise<AdminUser | null> => {
    try {
      const response = await authApi.getMe()
      return response.data || response
    } catch (error) {
      return null
    }
  },
}




