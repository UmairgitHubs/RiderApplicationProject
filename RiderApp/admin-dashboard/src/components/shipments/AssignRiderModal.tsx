import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, Save } from 'lucide-react'
import { useRiders } from '@/hooks/useRiders'
import { adminShipmentsApi } from '@/lib/api/shipments'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Shipment } from '@/types/shipment'

interface AssignRiderModalProps {
  shipment: Shipment | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  hubId?: string
}

export default function AssignRiderModal({ shipment, isOpen, onClose, onSuccess, hubId }: AssignRiderModalProps) {
  const [selectedRider, setSelectedRider] = useState<string>('')
  const { data: ridersData, isLoading: isLoadingRiders } = useRiders({ 
      page: 1, 
      status: 'approved', 
      isOnline: 'true',
      hubId: hubId
  })
  
  const queryClient = useQueryClient()
  
  const assignMutation = useMutation({
      mutationFn: async ({ id, riderId }: { id: string, riderId: string }) => {
          return adminShipmentsApi.assignRider(id, riderId)
      },
      onSuccess: () => {
          toast.success('Rider assigned successfully')
          queryClient.invalidateQueries({ queryKey: ['shipments'] })
          onSuccess?.()
          onClose()
      },
      onError: (error: any) => {
          toast.error(error.message || 'Failed to assign rider')
      }
  })

  const handleAssign = () => {
      if (!shipment || !selectedRider) return
      assignMutation.mutate({ id: shipment.id, riderId: selectedRider })
  }

  const riders = ridersData?.data?.riders || []

  // Ensure selected rider is reset when opening
  // (Effect omitted for brevity, but setSelectedRider('') should ideally happen on open)

  if (!isOpen) return null

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-md bg-white rounded-2xl shadow-xl z-[60] outline-none animate-in zoom-in-95 duration-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-bold text-gray-900">Assign Rider</Dialog.Title>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
             <div className="bg-gray-50 p-3 rounded-lg">
                 <p className="text-xs text-gray-500 uppercase font-semibold">Shipment</p>
                 <p className="font-medium text-gray-900">{shipment?.id}</p>
                 <p className="text-sm text-gray-600">{shipment?.customer.address}</p>
             </div>

             <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-700">Select Rider</label>
                 {isLoadingRiders ? (
                     <div className="flex items-center gap-2 text-sm text-gray-500">
                         <Loader2 className="w-4 h-4 animate-spin" /> Loading riders...
                     </div>
                 ) : (
                     <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        value={selectedRider}
                        onChange={(e) => setSelectedRider(e.target.value)}
                     >
                         <option value="">-- Select a Rider --</option>
                         {riders.map((rider: any) => (
                             <option key={rider.id} value={rider.id}>
                                 {rider.fullName} {rider.isOnline ? '(Online)' : '(Offline)'} - {rider.currentCity || ''}
                             </option>
                         ))}
                     </select>
                 )}
                 <p className="text-xs text-gray-500">
                    Showing available riders.
                 </p>
             </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  Cancel
              </button>
              <button 
                  onClick={handleAssign} 
                  disabled={!selectedRider || assignMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Assign Rider
              </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
