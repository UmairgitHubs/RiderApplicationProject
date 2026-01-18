import api from './client'
import { Profile, UpdateProfileData, ChangePasswordData } from '@/types/profile'

interface GetProfileResponse {
  success: boolean
  data: {
    profile: Profile
  }
}

interface UpdateProfileResponse {
  success: boolean
  data: {
    profile: Partial<Profile>
  }
  message: string
}

interface ChangePasswordResponse {
  success: boolean
  message: string
}

export const profileApi = {
  getProfile: async () => {
    const response = await api.get<GetProfileResponse>('/profile')
    return response.data
  },

  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.patch<UpdateProfileResponse>('/profile', data)
    return response.data
  },

  changePassword: async (data: ChangePasswordData) => {
    const response = await api.post<ChangePasswordResponse>('/profile/change-password', data)
    return response.data
  },

  getSessions: async () => {
    const response = await api.get<{ success: boolean; data: { sessions: any[] } }>('/profile/sessions')
    return response.data
  },

  toggleTwoFactor: async (enabled: boolean) => {
    const response = await api.post<{ success: boolean; message: string }>('/profile/2fa/toggle', { enabled })
    return response.data
  },

  getActivityLogs: async () => {
    const response = await api.get<{ success: boolean; data: { logs: any[] } }>('/profile/activity-logs')
    return response.data
  },
}
