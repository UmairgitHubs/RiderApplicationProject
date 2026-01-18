'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Lock, Shield, History, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

import { useProfile } from '@/hooks/useProfile'
import { Profile, Session } from '@/types/profile'
import { formatDistanceToNow } from 'date-fns'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

interface ProfileSecurityProps {
  profile?: Profile
}

export default function ProfileSecurity({ profile }: ProfileSecurityProps) {
  const { changePassword, isChangingPassword, toggleTwoFactor, isTogglingTwoFactor, sessions } = useProfile()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema)
  })

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      reset()
    } catch (error) {
       console.error(error)
    }
  }

  return (
    <div className="p-2 space-y-8">
      {/* Change Password Section */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Current Password</label>
            <input 
              {...register('currentPassword')}
              type="password"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.currentPassword ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <input 
              {...register('newPassword')}
              type="password"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.newPassword ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
            <input 
              {...register('confirmPassword')}
              type="password"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={isChangingPassword}
            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors shadow-sm mt-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="border-t border-gray-100 my-8"></div>

      {/* Two-Factor Authentication Section */}
      <div>
         <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-gray-900">2FA Status</h4>
            <p className="text-sm text-gray-500 mt-1">
              {profile?.twoFactorEnabled 
                ? 'Your account is secured with two-factor authentication.' 
                : 'Add an extra layer of security to your account'}
            </p>
          </div>
          <button 
            onClick={() => toggleTwoFactor(!profile?.twoFactorEnabled)}
            disabled={isTogglingTwoFactor}
            className={`px-4 py-2 ${profile?.twoFactorEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded-lg font-medium text-sm transition-colors shadow-sm whitespace-nowrap disabled:opacity-50`}
          >
            {isTogglingTwoFactor ? 'Processing...' : (profile?.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA')}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 my-8"></div>

      {/* Active Sessions Section */}
      <div>
         <div className="flex items-center gap-2 mb-6">
          <History className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
        </div>

        <div className="space-y-4">
          {sessions?.map((session: Session) => (
            <div key={session.id} className="bg-gray-50 rounded-xl p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {/* Device Icon */}
                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-white items-center justify-center border border-gray-200 text-gray-500">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  
                  {/* Session Info */}
                  <div>
                    <h4 className="font-semibold text-gray-900 flex flex-wrap items-center gap-2">
                      {session.device_name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">{session.ip_address}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Last active: {formatDistanceToNow(new Date(session.last_active), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {/* Logic to determine 'Active' (current) vs just logged in could be based on token, but for now we list all */}
                 <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Active
                </span>
              </div>
            </div>
          ))}
          {!sessions?.length && (
              <p className="text-gray-500 text-sm">No active sessions found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
