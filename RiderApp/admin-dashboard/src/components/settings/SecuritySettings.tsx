'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Shield, Loader2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

const securitySettingsSchema = z.object({
  session_timeout: z.coerce.string().min(1, 'Session timeout is required'),
  two_factor_required_admins: z.boolean(),
})

type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>

export default function SecuritySettings() {
  const { settings, isLoading, updateSettings } = useSettings()

   const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
        session_timeout: '',
        two_factor_required_admins: false,
    }
  })

  useEffect(() => {
    if (settings) {
      reset({
        session_timeout: settings.session_timeout.toString(),
        two_factor_required_admins: settings.two_factor_required_admins,
      })
    }
  }, [settings, reset])

  const onSubmit = async (data: SecuritySettingsFormData) => {
    const sanitizedData = {
        session_timeout: parseInt(data.session_timeout.toString().replace(/\D/g, '')) || 30,
        two_factor_required_admins: data.two_factor_required_admins,
    }

    try {
        await updateSettings(sanitizedData)
    } catch (err) {
        // Failed to update security settings
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <form id="security-settings-form" onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-8">
      <div className="flex items-center mb-8">
        <Shield className="w-5 h-5 text-orange-500 mr-2" />
        <h2 className="text-lg font-semibold text-gray-900">Security & Authentication</h2>
      </div>

      <div className="space-y-6">
        <Controller
            name="two_factor_required_admins"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="bg-gray-50 rounded-xl p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500">Require 2FA for all admin accounts</p>
                </div>
                <ToggleSwitch enabled={value} onChange={onChange} />
              </div>
            )}
        />

        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center mb-1">
             <h3 className="text-base font-semibold text-gray-900">Session Timeout (minutes)</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">Automatically log out inactive users</p>
          <div className="max-w-xs">
            <input 
                {...register('session_timeout')}
                type="number" 
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white ${errors.session_timeout ? 'border-red-500' : 'border-gray-200'}`}
                placeholder="e.g. 30"
            />
            {errors.session_timeout && <p className="text-xs text-red-500 mt-1">{errors.session_timeout.message as string}</p>}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Password Policy</h3>
          <p className="text-sm text-gray-500 mb-4">Minimum password requirements</p>
          
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2.5"></span>
              Minimum 8 characters
            </li>
            <li className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2.5"></span>
              Require uppercase letters
            </li>
            <li className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2.5"></span>
              Require numbers
            </li>
            <li className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2.5"></span>
              Require special characters
            </li>
          </ul>
        </div>
      </div>
    </form>
  )
}
