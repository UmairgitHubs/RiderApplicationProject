'use client'

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Globe, Loader2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

const systemSettingsSchema = z.object({
  maintenance_mode: z.boolean(),
  auto_assignment: z.boolean(),
  gps_tracking: z.boolean(),
})

type SystemSettingsFormData = z.infer<typeof systemSettingsSchema>

export default function SystemSettings() {
  const { settings, isLoading, updateSettings } = useSettings()

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<SystemSettingsFormData>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      maintenance_mode: false,
      auto_assignment: true,
      gps_tracking: true,
    }
  })

  useEffect(() => {
    if (settings) {
      reset({
        maintenance_mode: settings.maintenance_mode,
        auto_assignment: settings.auto_assignment,
        gps_tracking: settings.gps_tracking,
      })
    }
  }, [settings, reset])

  const onSubmit = async (data: SystemSettingsFormData) => {
    await updateSettings(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  return (
    <form id="system-settings-form" onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">System Features</h3>
        </div>

        <div className="space-y-4">
          <Controller
            name="maintenance_mode"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Maintenance Mode</h4>
                  <p className="text-sm text-gray-500 mt-1">Temporarily disable public access to the system</p>
                </div>
                <ToggleSwitch enabled={value} onChange={onChange} />
              </div>
            )}
          />

          <Controller
            name="auto_assignment"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Auto Assignment</h4>
                  <p className="text-sm text-gray-500 mt-1">Automatically assign orders to available riders</p>
                </div>
                <ToggleSwitch enabled={value} onChange={onChange} />
              </div>
            )}
          />

          <Controller
            name="gps_tracking"
            control={control}
            render={({ field: { value, onChange } }) => (
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">GPS Tracking</h4>
                  <p className="text-sm text-gray-500 mt-1">Enable real-time GPS tracking for deliveries</p>
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
