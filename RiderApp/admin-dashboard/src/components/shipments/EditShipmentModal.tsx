import React, { useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Save, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useShipmentDetails, useUpdateShipment } from '@/hooks/useShipments'

const editShipmentSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientPhone: z.string().min(1, 'Recipient phone is required'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
  pickupAddress: z.string().min(1, 'Pickup address is required'),
  codAmount: z.coerce.number().min(0, 'COD amount must be positive'),
  deliveryFee: z.coerce.number().min(0, 'Delivery fee must be positive').optional(),
  packageWeight: z.coerce.number().optional(),
  packageValue: z.coerce.number().optional(),
  specialInstructions: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  paymentStatus: z.string().optional(),
  priority: z.enum(['High', 'Normal']).optional(),
  scheduledPickupTime: z.string().optional(),
})

type EditShipmentFormValues = z.infer<typeof editShipmentSchema>

interface EditShipmentModalProps {
  shipmentId: string | null
  isOpen: boolean
  onClose: () => void
  onShipmentUpdated?: () => void
}

export default function EditShipmentModal({ shipmentId, isOpen, onClose, onShipmentUpdated }: EditShipmentModalProps) {
  const titleId = React.useId()
  const descId = React.useId()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditShipmentFormValues>({
    resolver: zodResolver(editShipmentSchema),
  })

  const { data: shipmentData, isLoading: isLoadingShipment } = useShipmentDetails(shipmentId)

  useEffect(() => {
    if (shipmentData?.data?.shipment && isOpen) {
      const s = shipmentData.data.shipment
      
      const getVal = (keySnake: string, keyCamel: string) => {
        return s[keySnake] !== undefined ? s[keySnake] : s[keyCamel]
      }
      
      const getNum = (keySnake: string, keyCamel: string) => {
         const val = getVal(keySnake, keyCamel)
         return val ? parseFloat(String(val)) : 0
      }

      if (!isDirty) {
          reset({
            recipientName: getVal('recipient_name', 'recipientName') || '',
            recipientPhone: getVal('recipient_phone', 'recipientPhone') || '',
            deliveryAddress: getVal('delivery_address', 'deliveryAddress') || '',
            pickupAddress: getVal('pickup_address', 'pickupAddress') || '',
            codAmount: getNum('cod_amount', 'codAmount'),
            deliveryFee: getNum('delivery_fee', 'deliveryFee'),
            packageWeight: getNum('package_weight', 'packageWeight'),
            packageValue: getNum('package_value', 'packageValue'),
            specialInstructions: getVal('special_instructions', 'specialInstructions') || '',
            status: getVal('status', 'status') || '',
            paymentStatus: getVal('payment_status', 'paymentStatus') || 'pending',
            priority: getVal('priority', 'priority') || 'Normal',
            scheduledPickupTime: (s.scheduled_pickup_time || s.scheduledPickupTime)
                ? new Date(s.scheduled_pickup_time || s.scheduledPickupTime).toISOString().slice(0, 16) 
                : '',
          })
      }
    }
  }, [shipmentData, reset, isOpen, isDirty])

  useEffect(() => {
      if (!isOpen) {
          reset()
      }
  }, [isOpen, reset])

  const updateMutation = useUpdateShipment()

  const onSubmit = (data: EditShipmentFormValues) => {
    if (!shipmentId) return
    updateMutation.mutate({ id: shipmentId, data }, {
        onSuccess: () => {
            onShipmentUpdated?.()
            onClose()
        }
    })
  }

  if (!isOpen) return null

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-4xl bg-white rounded-2xl shadow-xl z-[60] outline-none animate-in zoom-in-95 duration-200 p-0 flex flex-col max-h-[90vh]"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <Dialog.Title id={titleId} className="text-xl font-bold text-gray-900">Edit Shipment</Dialog.Title>
              <Dialog.Description id={descId} className="text-sm text-gray-500 mt-0.5">Update shipment details</Dialog.Description>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {isLoadingShipment ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <form id="edit-shipment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Recipient Details</h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Recipient Name</label>
                           <input {...register('recipientName')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                           {errors.recipientName && <p className="text-red-500 text-xs">{errors.recipientName.message}</p>}
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Phone Number</label>
                           <input {...register('recipientPhone')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                            {errors.recipientPhone && <p className="text-red-500 text-xs">{errors.recipientPhone.message}</p>}
                        </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                           <textarea {...register('deliveryAddress')} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                            {errors.deliveryAddress && <p className="text-red-500 text-xs">{errors.deliveryAddress.message}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Pickup Details</h3>
                      <div className="space-y-2">
                         <label className="text-sm font-medium text-gray-700">Pickup Address</label>
                         <textarea {...register('pickupAddress')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                          {errors.pickupAddress && <p className="text-red-500 text-xs">{errors.pickupAddress.message}</p>}
                      </div>
                       <div className="space-y-2">
                         <label className="text-sm font-medium text-gray-700">Scheduled Pickup Time</label>
                         <input type="datetime-local" {...register('scheduledPickupTime')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Shipment Info</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Status</label>
                           <select {...register('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                             <option value="pending">Pending</option>
                             <option value="assigned">Assigned</option>
                             <option value="picked_up">Picked Up</option>
                             <option value="in_transit">In Transit</option>
                             <option value="delivered">Delivered</option>
                             <option value="cancelled">Cancelled</option>
                             <option value="returned">Returned</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Priority</label>
                           <select {...register('priority')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                             <option value="Normal">Normal</option>
                             <option value="High">High</option>
                           </select>
                        </div>
                      </div>
                       <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Special Instructions</label>
                           <textarea {...register('specialInstructions')} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider border-b pb-2">Package & Financials</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                           <input type="number" step="0.1" {...register('packageWeight')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Value ($)</label>
                           <input type="number" step="0.01" {...register('packageValue')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                         <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">COD Amount ($)</label>
                           <input type="number" step="0.01" {...register('codAmount')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-sm font-medium text-gray-700">Delivery Fee ($)</label>
                           <input type="number" step="0.01" {...register('deliveryFee')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                        </div>
                         <div className="space-y-2 col-span-2">
                           <label className="text-sm font-medium text-gray-700">Payment Status</label>
                           <select {...register('paymentStatus')} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white">
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="failed">Failed</option>
                              <option value="refunded">Refunded</option>
                           </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200">Cancel</button>
              <button type="submit" form="edit-shipment-form" disabled={isSubmitting || isLoadingShipment} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
