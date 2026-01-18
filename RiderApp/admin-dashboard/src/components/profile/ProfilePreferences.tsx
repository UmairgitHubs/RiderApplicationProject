import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Bell, Save, Globe, Moon } from 'lucide-react'
import { toast } from 'sonner'
import { Profile } from '@/types/profile'
import { useProfile } from '@/hooks/useProfile'
import { useEffect } from 'react'

const preferencesSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  weeklyReports: z.boolean(),
})

type PreferencesFormData = z.infer<typeof preferencesSchema>

import ToggleSwitch from '@/components/ui/ToggleSwitch'

interface ProfilePreferencesProps {
  profile?: Profile
}

export default function ProfilePreferences({ profile }: ProfilePreferencesProps) {
  const { updateProfile, isUpdatingProfile } = useProfile()

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      weeklyReports: true,
    },
  })

  useEffect(() => {
    if (profile) {
      setValue('emailNotifications', profile.emailNotifications ?? true)
      setValue('pushNotifications', profile.pushNotifications ?? true)
      setValue('weeklyReports', profile.weeklyReports ?? true)
    }
  }, [profile, setValue])

  const onSubmit = async (data: PreferencesFormData) => {
    try {
      await updateProfile({
        emailNotifications: data.emailNotifications,
        pushNotifications: data.pushNotifications,
        weeklyReports: data.weeklyReports,
      })
    } catch (error) {
       console.error(error)
    }
  }

  if (!profile) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-2">
      <div className="flex items-center gap-2 mb-6">
        <Bell className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">Preferences</h3>
      </div>

      <div className="space-y-6">

        {/* Notifications */}
        <div className="space-y-4">
             <h4 className="font-medium text-gray-900 border-b border-gray-100 pb-2">Notifications</h4>

            {/* Email Notifications */}
            <Controller
            name="emailNotifications"
            control={control}
            render={({ field: { value, onChange } }) => (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 flex items-center justify-between">
                    <div>
                    <h4 className="font-semibold text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500 mt-1">Receive notifications via email</p>
                    </div>
                    <ToggleSwitch enabled={value} onChange={onChange} />
                </div>
            )}
            />

            {/* Push Notifications */}
            <Controller
            name="pushNotifications"
            control={control}
            render={({ field: { value, onChange } }) => (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 flex items-center justify-between">
                    <div>
                    <h4 className="font-semibold text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-500 mt-1">Receive browser push notifications</p>
                    </div>
                    <ToggleSwitch enabled={value} onChange={onChange} />
                </div>
            )}
            />

            {/* Weekly Reports */}
            <Controller
            name="weeklyReports"
            control={control}
            render={({ field: { value, onChange } }) => (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 flex items-center justify-between">
                    <div>
                    <h4 className="font-semibold text-gray-900">Weekly Reports</h4>
                    <p className="text-sm text-gray-500 mt-1">Receive weekly performance reports</p>
                    </div>
                    <ToggleSwitch enabled={value} onChange={onChange} />
                </div>
            )}
            />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button 
            type="submit" 
            disabled={isUpdatingProfile}
            className="flex items-center px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors shadow-sm disabled:opacity-50"
        >
            <Save className="w-4 h-4 mr-2" />
            {isUpdatingProfile ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}
