'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Building2, Mail, Phone, MapPin, Globe, Loader2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'

const generalSettingsSchema = z.object({
  company_name: z.string().min(1, 'Company Name is required'),
  company_email: z.string().email('Invalid email address'),
  company_phone: z.string().min(1, 'Company Phone is required'),
  company_address: z.string().min(1, 'Company Address is required'),
  timezone: z.string(),
  currency: z.string(),
})

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>

export default function GeneralSettings() {
  const { settings, isLoading, updateSettings } = useSettings()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      company_name: '',
      company_email: '',
      company_phone: '',
      company_address: '',
      timezone: 'Eastern Standard Time (EST)',
      currency: 'USD ($)',
    }
  })

  useEffect(() => {
    if (settings) {
      reset({
        company_name: settings.company_name,
        company_email: settings.company_email,
        company_phone: settings.company_phone,
        company_address: settings.company_address,
        timezone: settings.timezone,
        currency: settings.currency,
      })
    }
  }, [settings, reset])

  const onSubmit = async (data: GeneralSettingsFormData) => {
    try {
      await updateSettings(data)
    } catch (err) {
      // Failed to update general settings
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
    <form id="general-settings-form" onSubmit={handleSubmit(onSubmit)} className="p-4 md:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Company Name</label>
            <input 
              {...register('company_name')}
              type="text" 
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.company_name ? 'border-red-500' : 'border-gray-200'}`}
            />
            {errors.company_name && <p className="text-xs text-red-500">{errors.company_name.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Company Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                {...register('company_email')}
                type="email" 
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.company_email ? 'border-red-500' : 'border-gray-200'}`}
              />
            </div>
            {errors.company_email && <p className="text-xs text-red-500">{errors.company_email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Company Phone</label>
             <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                {...register('company_phone')}
                type="tel" 
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.company_phone ? 'border-red-500' : 'border-gray-200'}`}
              />
            </div>
            {errors.company_phone && <p className="text-xs text-red-500">{errors.company_phone.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Company Address</label>
             <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                {...register('company_address')}
                type="text" 
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.company_address ? 'border-red-500' : 'border-gray-200'}`}
              />
            </div>
            {errors.company_address && <p className="text-xs text-red-500">{errors.company_address.message}</p>}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100"></div>

      <div>
        <div className="flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Regional Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Timezone</label>
            <select 
                {...register('timezone')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 bg-white"
            >
                <option>Eastern Standard Time (EST)</option>
                <option>Pacific Standard Time (PST)</option>
                <option>UTC</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Currency</label>
             <select 
                {...register('currency')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 bg-white"
             >
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
                <option>PKR (Rs)</option>
            </select>
          </div>
        </div>
      </div>
    </form>
  )
}
