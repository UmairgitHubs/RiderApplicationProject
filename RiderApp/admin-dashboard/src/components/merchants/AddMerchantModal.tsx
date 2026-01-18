'use client'

import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, User, Phone, Mail, Store, MapPin, Search, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateMerchant } from '@/hooks/useMerchants'

const merchantSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(3, 'Business name must be at least 3 characters'),
  businessAddress: z.string().min(5, 'Address is required'),
  category: z.string().min(1, 'Please select a business category'),
  taxId: z.string().optional(),
})

type MerchantFormData = z.infer<typeof merchantSchema>

interface AddMerchantModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddMerchantModal({ isOpen, onClose }: AddMerchantModalProps) {
  const { mutate: createMerchant, isPending: isCreating } = useCreateMerchant()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<MerchantFormData>({
    resolver: zodResolver(merchantSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      businessName: '',
      businessAddress: '',
      category: 'Retail',
      taxId: ''
    }
  })

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const onSubmit = (data: MerchantFormData) => {
    createMerchant(data, {
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
                    <Store className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                    <Dialog.Title className="text-xl font-bold text-gray-900">Add New Merchant</Dialog.Title>
                    <p className="text-sm text-gray-500">Create a new merchant account</p>
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
                    <User className="w-4 h-4 text-primary" /> Owner Information
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
                                placeholder="Business Owner Name"
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
                                placeholder="merchant@business.com"
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
                                placeholder="Create password"
                            />
                        </div>
                        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                    </div>
                </div>
              </div>

              {/* Business Info Section */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" /> Business Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Business Name</label>
                        <div className="relative">
                            <Store className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register('businessName')}
                                type="text" 
                                className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${errors.businessName ? 'border-red-500' : 'border-gray-200'}`}
                                placeholder="Awesome Store"
                            />
                        </div>
                         {errors.businessName && <p className="text-xs text-red-500">{errors.businessName.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Business Category</label>
                        <select 
                            {...register('category')}
                            className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors bg-white ${errors.category ? 'border-red-500' : 'border-gray-200'}`}
                        >
                            <option value="Retail">Retail</option>
                            <option value="Food & Beverage">Food & Beverage</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Health & Beauty">Health & Beauty</option>
                            <option value="Other">Other</option>
                        </select>
                         {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Business Address</label>
                        <div className="relative">
                             <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input 
                                {...register('businessAddress')}
                                type="text" 
                                className={`w-full pl-9 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors ${errors.businessAddress ? 'border-red-500' : 'border-gray-200'}`}
                                placeholder="Shop #1, Market Area, City"
                            />
                        </div>
                         {errors.businessAddress && <p className="text-xs text-red-500">{errors.businessAddress.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Tax ID (Optional)</label>
                        <input 
                            {...register('taxId')}
                            type="text" 
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                            placeholder="NTN / STRN"
                        />
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
                    Create Merchant
                  </button>
            </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
