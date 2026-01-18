'use client'

import { useState } from 'react'
import { 
  FileText, 
  Search, 
  Plus, 
  Bell, 
  Image as ImageIcon, 
  FileCheck,
  Loader2,
  RefreshCw
} from 'lucide-react'
import CMSStatsCard from '@/components/cms/CMSStatsCard'
import CMSTabs from '@/components/cms/CMSTabs'
import CMSTable from '@/components/cms/CMSTable'
import CMSMobileCard from '@/components/cms/CMSMobileCard'
import CMSModal from '@/components/cms/CMSModal'
import CMSViewModal from '@/components/cms/CMSViewModal'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { CMSItem } from '@/types/cms'
import { useCMS, useCMSStats, useCreateCMS, useUpdateCMS, useDeleteCMS } from '@/hooks/useCMS'

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState('Faqs')
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<CMSItem | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewItem, setViewItem] = useState<CMSItem | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<CMSItem | null>(null)

  const { data: statsData, isLoading: statsLoading } = useCMSStats()
  const { data: itemsData, isLoading: itemsLoading, refetch } = useCMS(
    { type: activeTab, search: searchTerm }
  )

  const createMutation = useCreateCMS()
  const updateMutation = useUpdateCMS()
  const deleteMutation = useDeleteCMS()

  const stats = [
    { label: 'FAQs', value: statsData?.data?.faqs || '0', icon: FileText, color: 'border-orange-500', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Announcements', value: statsData?.data?.announcements || '0', icon: Bell, color: 'border-yellow-500', iconBg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
    { label: 'Banners', value: statsData?.data?.banners || '0', icon: ImageIcon, color: 'border-purple-500', iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
    { label: 'Legal Pages', value: statsData?.data?.legal || '0', icon: FileCheck, color: 'border-green-500', iconBg: 'bg-green-50', iconColor: 'text-green-500' },
  ]

  const handleCreate = () => {
    setSelectedItem(null)
    setIsModalOpen(true)
  }

  const handleEdit = (item: CMSItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const handleView = (item: CMSItem) => {
    setViewItem(item)
    setIsViewModalOpen(true)
  }

  const handleDelete = (item: CMSItem) => {
    setItemToDelete(item)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteMutation.mutateAsync(itemToDelete.id)
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
    }
  }

  const handleSave = async (formData: any) => {
    if (selectedItem) {
      await updateMutation.mutateAsync({ id: selectedItem.id, data: formData })
    } else {
      await createMutation.mutateAsync(formData)
    }
    setIsModalOpen(false)
  }

  const getAddButtonLabel = () => {
    switch(activeTab) {
      case 'Faqs': return 'Add New FAQ'
      case 'Announcements': return 'Add Announcement'
      case 'Banners': return 'Upload Banner'
      case 'Legal Pages': return 'Add Legal Page'
      default: return 'Add New'
    }
  }

  const rawItems = itemsData?.data || []

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">Content Management System</h1>
          <p className="text-gray-500 text-sm mt-1">Manage FAQs, announcements, banners, and legal pages</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => refetch()}
            className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={handleCreate}
            className="flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{getAddButtonLabel()}</span>
            <span className="sm:hidden">Add New</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <CMSStatsCard 
            key={index}
            label={stat.label}
            value={stat.value.toString()}
            icon={stat.icon}
            color={stat.color}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      {/* Tab & Search Section */}
      <div className="flex flex-col gap-4">
         <CMSTabs activeTab={activeTab} onTabChange={setActiveTab} />
         
         <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-shadow bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Content */}
      {itemsLoading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto" />
            <p className="text-gray-500 mt-2">Loading content...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-4">
            {rawItems.length > 0 ? (
              rawItems.map((item: CMSItem) => (
                <CMSMobileCard 
                  key={item.id} 
                  item={item} 
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <p className="text-gray-400">No content found</p>
              </div>
            )}
          </div>

          <div className="hidden md:block">
            <CMSTable 
              items={rawItems} 
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </>
      )}

      {/* Modal */}
      <CMSModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        isLoading={createMutation.isPending || updateMutation.isPending}
        initialData={selectedItem}
        activeTab={activeTab}
      />

      {/* View Modal */}
      <CMSViewModal 
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setViewItem(null)
        }}
        item={viewItem}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        description="Are you sure you want to delete this content? This action cannot be undone."
        isLoading={deleteMutation.isPending}
        confirmText="Delete Content"
        variant="danger"
      />
    </div>
  )
}
