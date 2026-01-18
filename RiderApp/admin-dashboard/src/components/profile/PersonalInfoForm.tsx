'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User, Mail, Phone, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Profile } from '@/types/profile'
import { useProfile } from '@/hooks/useProfile'

const personalInfoSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone Number is required'),
})

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>

interface PersonalInfoFormProps {
  profile?: Profile
}

export default function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  const { updateProfile, isUpdatingProfile } = useProfile()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || '',
        email: profile.email || '',
        phone: profile.phone || '',
      })
    }
  }, [profile, reset])

  const onSubmit = async (data: PersonalInfoFormData) => {
    try {
      await updateProfile({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      })
    } catch (error) {
      // Error handled by hook
      console.error(error)
    }
  }

  if (!profile) return null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-2">
        <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input 
                    {...register('fullName')}
                    type="text" 
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.fullName ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        {...register('email')}
                        type="email" 
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                    />
                </div>
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        {...register('phone')}
                        type="tel" 
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                    />
                </div>
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

             <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <input 
                    value={profile.role.replace('_', ' ').toUpperCase()}
                    type="text" 
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
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
                {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    </form>
  )
}
