'use client'

import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { 
  X, 
  FileText, 
  Calendar, 
  Tag, 
  Layers, 
  Eye as ViewIcon,
  Clock,
  ExternalLink,
  Info,
  Activity,
  MessageSquare
} from 'lucide-react'
import { CMSItem } from '@/types/cms'

interface CMSViewModalProps {
  isOpen: boolean
  onClose: () => void
  item: CMSItem | null
}

export default function CMSViewModal({ isOpen, onClose, item }: CMSViewModalProps) {
  if (!item) return null

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-orange-100 text-orange-700'
    }
  }

  const getTypeIcon = () => {
    switch(item.type) {
      case 'FAQ': return <Info className="w-5 h-5 text-orange-500" />
      case 'ANNOUNCEMENT': return <Activity className="w-5 h-5 text-yellow-500" />
      case 'BANNER': return <Layers className="w-5 h-5 text-purple-500" />
      case 'LEGAL': return <FileText className="w-5 h-5 text-green-500" />
      default: return <FileText className="w-5 h-5 text-orange-500" />
    }
  }

  const getTypeIconBg = () => {
    switch(item.type) {
      case 'FAQ': return 'bg-orange-50'
      case 'ANNOUNCEMENT': return 'bg-yellow-50'
      case 'BANNER': return 'bg-purple-50'
      case 'LEGAL': return 'bg-green-50'
      default: return 'bg-orange-50'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'FAQ': return 'Frequently Asked Question'
      case 'ANNOUNCEMENT': return 'Announcement'
      case 'BANNER': return 'Marketing Banner'
      case 'LEGAL': return 'Legal Documentation'
      default: return type
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-3xl bg-white rounded-2xl shadow-2xl z-[120] outline-none animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className={`${getTypeIconBg()} p-3 rounded-2xl shadow-sm`}>
                {getTypeIcon()}
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900 line-clamp-1">
                  Preview Content
                </Dialog.Title>
                <p className="text-sm text-gray-500 mt-0.5">{getTypeLabel(item.type)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.open(`/cms/preview/${item.id}`, '_blank')}
                className="p-2 hover:bg-orange-50 rounded-full transition-colors text-gray-400 hover:text-orange-500"
                title="Open in new window"
              >
                <ExternalLink className="w-5 h-5" />
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto p-8 custom-scrollbar space-y-8">
            {/* Meta Information Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 ml-0.5">Status</p>
                <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold shadow-sm ${getStatusColor(item.status)}`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 ml-0.5">Views</p>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                    <ViewIcon className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  {item.views.toLocaleString()}
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 ml-0.5">Category</p>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                    <Tag className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="line-clamp-1">{item.category || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 ml-0.5">Last Updated</p>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  {new Date(item.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>


            {/* Main Content Area */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-gray-900 leading-tight">
                  {item.title}
                </h2>
                <div className="w-16 h-1.5 bg-orange-500 rounded-full shadow-lg shadow-orange-500/20" />
              </div>
              <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 shadow-inner">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg font-medium">
                  {item.content}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex justify-end rounded-b-2xl">
            <button 
              onClick={onClose}
              className="px-10 py-3 text-sm font-bold text-white bg-orange-500 rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/25 active:scale-95"
            >
              Close Preview
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
