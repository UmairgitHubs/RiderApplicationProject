import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi } from '@/lib/api'
import { UpdateProfileData, ChangePasswordData } from '@/types/profile'
import { toast } from 'sonner'

export function useProfile() {
  const queryClient = useQueryClient()

  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  })

  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useMutation({
    mutationFn: (data: UpdateProfileData) => profileApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update profile')
    },
  })

  const { mutateAsync: changePassword, isPending: isChangingPassword } = useMutation({
    mutationFn: (data: ChangePasswordData) => profileApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to change password')
    },
  })

  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: profileApi.getSessions,
  })

  const { mutateAsync: toggleTwoFactor, isPending: isTogglingTwoFactor } = useMutation({
    mutationFn: (enabled: boolean) => profileApi.toggleTwoFactor(enabled),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success(`Two-factor authentication ${variables ? 'enabled' : 'disabled'} successfully`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update 2FA settings')
    },
  })

  const { data: activityLogsData, isLoading: isLoadingActivityLogs } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: profileApi.getActivityLogs,
  })

  return {
    profile: profileData?.data?.profile,
    isLoadingProfile,
    profileError,
    updateProfile,
    isUpdatingProfile,
    changePassword,
    isChangingPassword,
    sessions: sessionsData?.data?.sessions,
    isLoadingSessions,
    toggleTwoFactor,
    isTogglingTwoFactor,
    activityLogs: activityLogsData?.data?.logs,
    isLoadingActivityLogs,
  }
}
