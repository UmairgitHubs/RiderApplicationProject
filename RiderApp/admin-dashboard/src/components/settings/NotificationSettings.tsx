'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Bell, Loader2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

const notificationSettingsSchema = z.object({
  email_notifications: z.boolean(),
  sms_notifications: z.boolean(),
})

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>

export default function NotificationSettings() {
  const { settings, isLoading, updateSettings } = useSettings()

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      email_notifications: true,
      sms_notifications: true,
    }
  })

  useEffect(() => {
    if (settings) {
      reset({
        email_notifications: settings.email_notifications,
        sms_notifications: settings.sms_notifications,
      })
    }
  }, [settings, reset])

  const onSubmit = async (data: NotificationSettingsFormData) => {
    try {
      await updateSettings(data)
    } catch (err) {
      console.error('Failed to update notification settings:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  const onError = (errors: any) => {
    console.error('Notification Settings Validation Errors:', errors)
  }

  return (
    <form id="notification-settings-form" onSubmit={handleSubmit(onSubmit, onError)} className="p-4 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Notification Channels</h3>
        </div>

        <div className="space-y-4">
          {/* Email Notifications */}
          <Controller
            name="email_notifications"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-500 mt-1">Send notifications via email</p>
                </div>
                <ToggleSwitch enabled={value} onChange={onChange} />
              </div>
            )}
          />

          {/* SMS Notifications */}
          <Controller
            name="sms_notifications"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">SMS Notifications</h4>
                  <p className="text-sm text-gray-500 mt-1">Send notifications via SMS</p>
                </div>
                <ToggleSwitch enabled={value} onChange={onChange} />
              </div>
            )}
          />
        </div>
      </div>
    </form>
  )
}
