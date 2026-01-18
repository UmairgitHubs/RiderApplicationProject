'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useHubs } from '@/hooks/useHubs'
import { 
  X, 
  Save, 
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Bike,
  Building2,
  Activity
} from 'lucide-react'
import { Rider } from '@/types/rider'

// Schema for validation
const riderSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  hub: z.string().min(2, 'Hub location is required'),
  location: z.string().min(2, 'Current location is required'),
  vehicleType: z.string().min(2, 'Vehicle type is required'),
  vehiclePlate: z.string().min(2, 'License plate is required'),
  status: z.enum(['Active', 'On Break', 'Inactive']).optional(),
})

type RiderFormData = z.infer<typeof riderSchema>

interface EditRiderModalProps {
  isOpen: boolean
  onClose: () => void
  rider: Rider | null
  onSave: (data: RiderFormData) => Promise<void>
}

export default function EditRiderModal({ isOpen, onClose, rider, onSave }: EditRiderModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Fetch Hubs
  const { data: hubsData } = useHubs()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RiderFormData>({
    resolver: zodResolver(riderSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      hub: '',
      location: '',
      vehicleType: '',
      vehiclePlate: '',
      status: 'Active'
    }
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Update form values when rider changes
  useEffect(() => {
    if (rider) {
      reset({
        name: rider.name,
        phone: rider.phone,
        email: rider.email || '',
        hub: rider.hub,
        location: rider.location,
        vehicleType: rider.vehicle.type,
        vehiclePlate: rider.vehicle.plate,
        // @ts-ignore
        status: rider.status
      })
    }
  }, [rider, reset])

  const onSubmit = async (data: RiderFormData) => {
    try {
      setIsSubmitting(true)
      // Transform data to match backend API expectations
      const apiPayload = {
        fullName: data.name,
        phone: data.phone,
        email: data.email,
        hubId: data.hub, // Form 'hub' field contains the ID now
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehiclePlate,
        status: data.status
      }
      
      await onSave(apiPayload as any)
      onClose()
    } catch (error) {
      console.error('Failed to update rider:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted || !isOpen || !rider) return null

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-[#f97316]">Edit Rider</h2>
            <p className="text-sm text-gray-500 mt-1">{rider.id} - {rider.name}</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Personal Information Card */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-800">Personal Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('name')}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
                        placeholder="John Doe"
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('phone')}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('email')}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                  </div>

                   <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        {...register('location')}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400"
                        placeholder="City, State"
                      />
                    </div>
                    {errors.location && <p className="text-red-500 text-xs">{errors.location.message}</p>}
                  </div>
                </div>
              </div>

              {/* Vehicle & Work Information Card */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <Bike className="w-5 h-5 text-gray-700" />
                  <h3 className="font-semibold text-gray-800">Vehicle & Work Information</h3>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Vehicle Type</label>
                      <select
                        {...register('vehicleType')}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all text-sm font-medium text-gray-900"
                      >
                        <option value="">Select Type</option>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Bicycle">Bicycle</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Van">Van</option>
                      </select>
                      {errors.vehicleType && <p className="text-red-500 text-xs">{errors.vehicleType.message}</p>}
                    </div>

                     <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">License Plate</label>
                      <input
                        {...register('vehiclePlate')}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all text-sm font-medium text-gray-900 placeholder:text-gray-400 uppercase"
                        placeholder="XYZ-123"
                      />
                      {errors.vehiclePlate && <p className="text-red-500 text-xs">{errors.vehiclePlate.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hub</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <select
                        {...register('hub')}
                         className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all text-sm font-medium text-gray-900"
                      >
                        <option value="">Select Hub</option>
                        {hubsData?.data?.map((hub: any) => (
                          <option key={hub.id} value={hub.id}>
                            {hub.name} ({hub.city})
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.hub && <p className="text-red-500 text-xs">{errors.hub.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                    <div className="relative">
                      <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <select
                        {...register('status')}
                        className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all text-sm font-medium text-gray-900"
                      >
                        <option value="Active">Active</option>
                        <option value="On Break">On Break</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 sticky bottom-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors font-medium text-sm shadow-sm flex items-center shadow-orange-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
