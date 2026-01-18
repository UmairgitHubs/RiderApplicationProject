'use client'

import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, User, Phone, Mail, Bike, MapPin, Hash, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateRider } from '@/hooks/useRiders'
import { useHubs } from '@/hooks/useHubs'

const riderSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  vehicleType: z.enum(['bike', 'car', 'van'], {
    errorMap: () => ({ message: 'Please select a vehicle type' }),
  }),
  vehicleNumber: z.string().min(1, 'Vehicle number is required'),
  hubId: z.string().min(1, 'Please select a hub'),
})

type RiderFormData = z.infer<typeof riderSchema>

interface AddRiderModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddRiderModal({ isOpen, onClose }: AddRiderModalProps) {
  const { mutate: createRider, isPending: isCreating } = useCreateRider()
  const { data: hubsData, isLoading: isLoadingHubs } = useHubs()
  
  const hubs = hubsData?.data || []

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<RiderFormData>({
    resolver: zodResolver(riderSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      vehicleType: 'bike',
      vehicleNumber: '',
      hubId: ''
    }
  })

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onSubmit = (data: RiderFormData) => {
    createRider(data, {
      onSuccess: () => {
        onClose()
      }
    })
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-2xl bg-white rounded-xl shadow-xl z-[100] outline-none animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          aria-describedby={undefined}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 rounded-t-xl">
              <div className="flex items-center gap-2">
                 <div className="bg-primary/10 p-2 rounded-lg">
                    <Bike className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                    <Dialog.Title className="text-xl font-bold text-gray-900">Add New Rider</Dialog.Title>
                    <p className="text-sm text-gray-500">Create a new rider account</p>
                 </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Personal Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Personal Information
                </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register('fullName')}
                                type="text" 
                                className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${errors.fullName ? 'border-red-500' : 'border-gray-200'}`}
                                placeholder="John Doe"
                            />
                        </div>
                         {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                         <div className="relative">
                            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register('email')}
                                type="email" 
                                className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${errors.email ? 'border-red-500' : 'border-gray-200'}`}
                                placeholder="john@example.com"
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                    </div>

                     <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register('phone')}
                                type="tel" 
                                className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                                placeholder="+92 300 1234567"
                            />
                        </div>
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register('password')}
                                type="password" 
                                className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${errors.password ? 'border-red-500' : 'border-gray-200'}`}
                                placeholder="Rider's password"
                            />
                        </div>
                        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>
                </div>
              </div>

              {/* Vehicle & Hub Section */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Bike className="w-4 h-4 text-primary" /> Vehicle & Assignment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Vehicle Type</label>
                        <select 
                            {...register('vehicleType')}
                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-white ${errors.vehicleType ? 'border-red-500' : 'border-gray-200'}`}
                        >
                            <option value="bike">Motorbike</option>
                            <option value="car">Car</option>
                            <option value="van">Van/Truck</option>
                        </select>
                         {errors.vehicleType && <p className="text-xs text-red-500">{errors.vehicleType.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Vehicle Number / Plate</label>
                        <div className="relative">
                             <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register('vehicleNumber')}
                                type="text" 
                                className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${errors.vehicleNumber ? 'border-red-500' : 'border-gray-200'}`}
                                placeholder="ABC-123"
                            />
                        </div>
                         {errors.vehicleNumber && <p className="text-xs text-red-500">{errors.vehicleNumber.message}</p>}
                    </div>

                     <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Assigned Hub</label>
                        <div className="relative">
                             <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <select 
                                {...register('hubId')}
                                disabled={isLoadingHubs}
                                className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-white appearance-none ${errors.hubId ? 'border-red-500' : 'border-gray-200'}`}
                            >
                                <option value="">Select a Hub</option>
                                {hubs.map((hub: any) => (
                                    <option key={hub.id} value={hub.id}>{hub.name} ({hub.city})</option>
                                ))}
                            </select>
                        </div>
                        {isLoadingHubs ? <p className="text-xs text-gray-400 mt-1">Loading hubs...</p> : null}
                         {errors.hubId && <p className="text-xs text-red-500">{errors.hubId.message}</p>}
                    </div>
                </div>
              </div>

            </form>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                 <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isCreating}
                    className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Create Rider
                  </button>
            </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
