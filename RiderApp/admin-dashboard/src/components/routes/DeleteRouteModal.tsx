'use client'

import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { routesApi } from '@/lib/api/routes'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface DeleteRouteModalProps {
  isOpen: boolean
  onClose: () => void
  routeId: string
  routeName: string
}

export default function DeleteRouteModal({ isOpen, onClose, routeId, routeName }: DeleteRouteModalProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => routesApi.delete(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['route-stats'] })
      toast.success('Route deleted successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete route')
    }
  })

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay 
          asChild
        >
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1100]"
          />
        </Dialog.Overlay>
        <Dialog.Content 
          asChild
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: '-45%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, y: '-45%', x: '-50%' }}
            className="fixed top-[50%] left-[50%] w-[95%] max-w-md bg-white rounded-[2rem] shadow-2xl z-[1100] outline-none overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 leading-none">Delete Route</h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Permanent Action</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6 bg-red-50/50 p-4 rounded-2xl border border-red-100/50 text-red-600">
                  <AlertTriangle className="w-6 h-6 shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">
                    Warning: Deleting this route will unassign all linked shipments and stops. This cannot be undone.
                  </p>
              </div>
              
              <div className="space-y-1 mb-8">
                  <p className="text-sm text-gray-500 font-medium">Are you sure you want to delete:</p>
                  <p className="text-base font-black text-gray-900 truncate">“{routeName}”</p>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-[0.2em] transition-all"
                  disabled={isPending}
                >
                  Keep Route
                </button>
                <button 
                  onClick={() => mutate()}
                  disabled={isPending}
                  className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-xl shadow-red-100 hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      DELETE NOW
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
