import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, Trash2, X, Loader2, Info, AlertTriangle } from 'lucide-react'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  isLoading?: boolean
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isLoading = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationModalProps) {
  const titleId = React.useId()
  const descId = React.useId()

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 focus:ring-red-500 shadow-red-100'
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500 shadow-yellow-100'
      default:
        return 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 shadow-blue-100'
    }
  }

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-6 h-6" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />
      default:
        return <Info className="w-6 h-6" />
    }
  }

  const getIconContainerStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-50 text-red-500'
      case 'warning':
        return 'bg-yellow-50 text-yellow-500'
      default:
        return 'bg-blue-50 text-blue-500'
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-md bg-white rounded-2xl shadow-2xl z-[200] outline-none animate-in zoom-in-95 duration-200 p-8"
          aria-labelledby={titleId}
          aria-describedby={descId}
        >
          <div className="flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${getIconContainerStyles()}`}>
              {getIcon()}
            </div>

            <Dialog.Title id={titleId} className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </Dialog.Title>
            
            <Dialog.Description id={descId} className="text-gray-500 mb-8 leading-relaxed">
              {description}
            </Dialog.Description>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 text-sm font-bold text-gray-600 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${getVariantStyles()}`}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {confirmText}
              </button>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
