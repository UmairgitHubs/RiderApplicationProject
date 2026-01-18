import api from './client'

export interface SystemSettings {
  id: string
  company_name: string
  company_email: string
  company_phone: string
  company_address: string
  timezone: string
  currency: string
  cod_commission: number
  base_delivery_fee: number
  min_order_value: number
  rider_commission: number
  agent_commission: number
  maintenance_mode: boolean
  auto_assignment: boolean
  gps_tracking: boolean
  email_notifications: boolean
  sms_notifications: boolean
  session_timeout: number
  two_factor_required_admins: boolean
  updated_at: string
}

export const settingsApi = {
  get: async () => {
    const response = await api.get<{ success: boolean; data: SystemSettings }>('/admin/settings')
    return response.data
  },
  update: async (data: Partial<SystemSettings>) => {
    const response = await api.put<{ success: boolean; data: SystemSettings }>('/admin/settings', data)
    return response.data
  },
  verifyLogic: async (feature: string) => {
    const response = await api.get<{ success: boolean; data: { enabled: boolean; message: string } }>(`/admin/settings/verify/${feature}`)
    return response.data
  },
}
