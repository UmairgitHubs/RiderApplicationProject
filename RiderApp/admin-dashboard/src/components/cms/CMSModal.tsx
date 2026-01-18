'use client'

import React, { useState, useEffect } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { 
  X, 
  Loader2, 
  FileText, 
  Tag, 
  MessageSquare, 
  Activity, 
  Save,
  Info,
  Layers,
  ChevronDown
} from 'lucide-react'
import { CMSItem } from '@/types/cms'

interface CMSModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  isLoading?: boolean
  initialData?: CMSItem | null
  activeTab: string
}

export default function CMSModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isLoading, 
  initialData, 
  activeTab 
}: CMSModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    status: 'published',
    type: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        category: initialData.category || '',
        status: initialData.status?.toLowerCase() || 'published',
        type: initialData.type || ''
      })
    } else {
      let type = 'FAQ'
      if (activeTab === 'Announcements') type = 'ANNOUNCEMENT'
      if (activeTab === 'Banners') type = 'BANNER'
      if (activeTab === 'Legal Pages') type = 'LEGAL'
      
      setFormData({
        title: '',
        content: '',
        category: '',
        status: 'published',
        type
      })
    }
  }, [initialData, isOpen, activeTab])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const getTitle = () => {
    const action = initialData ? 'Edit' : 'Add New'
    const entity = activeTab.endsWith('s') ? activeTab.slice(0, -1) : activeTab
    return `${action} ${entity}`
  }

  const getDescription = () => {
    if (initialData) return `Update existing information for this ${activeTab.toLowerCase()}`
    return `Create a new entry for the ${activeTab.toLowerCase()} category`
  }

  const getIcon = () => {
    switch(activeTab) {
      case 'Faqs': return <Info className="w-5 h-5 text-orange-500" />
      case 'Announcements': return <Activity className="w-5 h-5 text-yellow-500" />
      case 'Banners': return <Layers className="w-5 h-5 text-purple-500" />
      case 'Legal Pages': return <FileText className="w-5 h-5 text-green-500" />
      default: return <FileText className="w-5 h-5 text-orange-500" />
    }
  }

  const getIconBg = () => {
    switch(activeTab) {
      case 'Faqs': return 'bg-orange-50'
      case 'Announcements': return 'bg-yellow-50'
      case 'Banners': return 'bg-purple-50'
      case 'Legal Pages': return 'bg-green-50'
      default: return 'bg-orange-50'
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-2xl bg-white rounded-2xl shadow-2xl z-[120] outline-none animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white sticky top-0 z-10 rounded-t-2xl">
            <div className="flex items-center gap-4">
              <div className={`${getIconBg()} p-3 rounded-2xl shadow-sm`}>
                {getIcon()}
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-gray-900">{getTitle()}</Dialog.Title>
                <p className="text-sm text-gray-500 mt-0.5">{getDescription()}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="overflow-y-auto p-8 custom-scrollbar">
            <form id="cms-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Title Section */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Title</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <input 
                    required
                    type="text"
                    placeholder={`Enter ${activeTab.slice(0,-1).toLowerCase()} title...`}
                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all bg-gray-50/50 hover:bg-gray-50"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              {/* Category & Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(activeTab === 'Faqs' || formData.type === 'FAQ') && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-1">Category</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                        <Tag className="w-5 h-5" />
                      </div>
                      <select 
                        className="w-full pl-12 pr-10 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all bg-gray-50/50 hover:bg-gray-50 appearance-none"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        <option value="General">General</option>
                        <option value="Payments">Payments</option>
                        <option value="Riders">Riders</option>
                        <option value="Merchants">Merchants</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Status</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none">
                      <Activity className="w-5 h-5" />
                    </div>
                    <select 
                      className="w-full pl-12 pr-10 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all bg-gray-50/50 hover:bg-gray-50 appearance-none"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>


              {/* Content Section */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Content / Description</label>
                <div className="relative group">
                  <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <textarea 
                    required
                    rows={6}
                    placeholder="Enter detailed content here..."
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all bg-gray-50/50 hover:bg-gray-50 resize-none custom-scrollbar"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3 rounded-b-2xl">
            <button 
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all disabled:opacity-50 shadow-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="cms-form"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 px-10 py-3 text-sm font-bold text-white bg-orange-500 rounded-2xl hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/25 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {initialData ? 'Update Content' : 'Save Content'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
