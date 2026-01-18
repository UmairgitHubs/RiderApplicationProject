import Cookies from 'js-cookie'
import api from './client'

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/admin/auth/login', { email, password })
    if (response.data.success && response.data.data?.token) {
      Cookies.set('admin_token', response.data.data.token, { expires: 7 }) // 7 days
      if (response.data.data?.user?.role) {
          Cookies.set('user_role', response.data.data.user.role, { expires: 7 })
      }
    }
    return response.data
  },
  logout: async () => {
    Cookies.remove('admin_token')
    Cookies.remove('user_role')
    return { success: true }
  },
  getMe: async () => {
    const response = await api.get('/admin/auth/me')
    return response.data
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/admin/auth/forgot-password', { email })
    return response.data
  },
  verifyOTP: async (email: string, code: string) => {
    const response = await api.post('/admin/auth/verify-otp', { email, code })
    return response.data
  },
  verify2FA: async (email: string, code: string) => {
    const response = await api.post('/admin/auth/verify-2fa', { email, code })
    // If successful, set token
     if (response.data.success && response.data.data?.token) {
      Cookies.set('admin_token', response.data.data.token, { expires: 7 })
       if (response.data.data?.user?.role) {
          Cookies.set('user_role', response.data.data.user.role, { expires: 7 })
      }
    }
    return response.data
  },
  resetPassword: async (email: string, code: string, newPassword: string) => {
    const response = await api.post('/admin/auth/reset-password', {
      email,
      code,
      newPassword,
    })
    return response.data
  },
}
