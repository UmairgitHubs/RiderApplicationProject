'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import * as Dialog from '@radix-ui/react-dialog'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { merchantsApi } from '@/lib/api'
import { 
  X, 
  Loader2, 
  Save, 
  Store, 
  Phone, 
  Mail, 
  MapPin, 
  User 
} from 'lucide-react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

// Schema Validation
const merchantSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number is required'),
  businessName: z.string().min(1, 'Business name is required'),
  businessAddress: z.string().min(1, 'Address is required'),
  category: z.string().optional(),
  status: z.enum(['Active', 'Inactive', 'Suspended']).optional(),
  // Add more fields as necessary
})

type MerchantFormData = z.infer<typeof merchantSchema>

interface EditMerchantModalProps {
  isOpen: boolean
  onClose: () => void
  merchant: any
  onSuccess?: () => void
}

export default function EditMerchantModal({ isOpen, onClose, merchant, onSuccess }: EditMerchantModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      businessName: '',
      businessAddress: '',
      category: '',
      status: 'Active'
    }
  })

  // Populate form on open
  useEffect(() => {
    if (merchant && isOpen) {
      reset({
        fullName: merchant.contactName || merchant.owner?.name || '',
        email: merchant.email || '',
        phone: merchant.phone || '',
        businessName: merchant.name || '',
        businessAddress: merchant.address || '',
        category: merchant.category || '',
        status: merchant.status || 'Active'
      })
    }
  }, [merchant, isOpen, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: MerchantFormData) => merchantsApi.update(merchant.id, data),
    onSuccess: () => {
      toast.success('Merchant profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['merchants'] })
      queryClient.invalidateQueries({ queryKey: ['merchant-details', merchant.id] })
      if (onSuccess) onSuccess()
      onClose()
    },
    onError: (error: any) => {
        toast.error(error.message || 'Failed to update profile')
    }
  })

  const onSubmit = (data: MerchantFormData) => {
    mutate(data)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-4xl bg-white rounded-2xl shadow-xl z-[120] outline-none animate-in zoom-in-95 duration-200 p-0 flex flex-col max-h-[90vh]">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <Dialog.Title className="text-xl font-bold text-gray-900">Edit Merchant Profile</Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 mt-0.5">Update merchant account details</Dialog.Description>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
              <form id="edit-merchant-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Business Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Business Details</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Business Name</label>
                           <input 
                              {...register('businessName')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                           />
                           {errors.businessName && <p className="text-red-500 text-xs">{errors.businessName.message}</p>}
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Category</label>
                           <input 
                              {...register('category')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                           />
                        </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Address</label>
                           <textarea 
                              {...register('businessAddress')}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                           />
                            {errors.businessAddress && <p className="text-red-500 text-xs">{errors.businessAddress.message}</p>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Contact Info</h3>
                       <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Contact Person Name</label>
                           <input 
                              {...register('fullName')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                           />
                           {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Email Address</label>
                           <input 
                              type="email"
                              {...register('email')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                           />
                            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Phone Number</label>
                           <input 
                              {...register('phone')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                           />
                            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Account Status</h3>
                       <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Status</label>
                           <select 
                              {...register('status')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                           >
                             <option value="Active">Active</option>
                             <option value="Inactive">Inactive</option>
                             <option value="Suspended">Suspended</option>
                           </select>
                        </div>
                    </div>
                  </div>
                </div>

              </form>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-merchant-form"
                disabled={isPending || !isDirty}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
