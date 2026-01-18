'use client'

import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { 
  Download, 
  Search, 
  Plus, 
  Bike, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Loader2
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import RiderDetailsModal from '@/components/riders/RiderDetailsModal'
import EditRiderModal from '@/components/riders/EditRiderModal'
import AssignOrdersModal from '@/components/riders/AssignOrdersModal'
import AddRiderModal from '@/components/riders/AddRiderModal'
import ExportRidersModal from '@/components/riders/ExportRidersModal'
import RiderStatsCard from '@/components/riders/RiderStatsCard'
import RiderTable from '@/components/riders/RiderTable'
import RiderMobileCard from '@/components/riders/RiderMobileCard'
import ConfirmationModal from '@/components/common/ConfirmationModal'
import { Rider } from '@/types/rider'
import { useRiders, useRiderStats, useUpdateRider, useDeleteRider } from '@/hooks/useRiders'

export default function RidersPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const [editingRider, setEditingRider] = useState<Rider | null>(null)
  const [assigningRider, setAssigningRider] = useState<Rider | null>(null)
  const [deletingRider, setDeletingRider] = useState<Rider | null>(null)
  const [isAddRiderOpen, setIsAddRiderOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  // URL Params
  const page = Number(searchParams.get('page')) || 1
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'
  const isOnline = searchParams.get('is_online') || 'all'

  // Local state for input
  const [searchVal, setSearchVal] = useState(search)

  // Sync URL search to local state
  useEffect(() => {
    setSearchVal(search)
  }, [search])

  // Fetch Riders
  const { data, isLoading, isFetching } = useRiders({ 
    page, 
    search, 
    status, 
    isOnline 
  })

  // Fetch Stats
  const { data: statsData } = useRiderStats()

  const debouncedSearch = useDebouncedCallback((value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('search', value)
    else params.delete('search')
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`)
  }, 500)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchVal(value)
    debouncedSearch(value)
  }

  const handleStatusChange = (val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val !== 'all') params.set('status', val)
    else params.delete('status')
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`)
  }
  
  const handleOnlineFilter = (val: string) => {
    const params = new URLSearchParams(searchParams)
    if (val !== 'all') params.set('is_online', val)
    else params.delete('is_online')
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Mutations
  const updateRiderMutation = useUpdateRider()
  const deleteRiderMutation = useDeleteRider()

  const handleDeleteClick = (rider: Rider) => {
    setDeletingRider(rider)
  }

  const handleConfirmDelete = () => {
    if (!deletingRider) return
    deleteRiderMutation.mutate(deletingRider.id, {
      onSuccess: () => {
        setDeletingRider(null)
        if (selectedRider?.id === deletingRider.id) {
          setSelectedRider(null)
        }
      }
    })
  }

  const riders = data?.data?.riders || []
  const pagination = data?.data?.pagination || { page: 1, totalPages: 1 }
  const stats = statsData?.data || { totalRiders: 0, activeRiders: 0, onlineRiders: 0, inactiveRiders: 0 }

  const statCards = [
    { label: 'Total Riders', value: stats.totalRiders, icon: Bike, color: 'text-primary', bg: 'bg-primary-50', border: 'border-l-4 border-primary' },
    { label: 'Online Now', value: stats.onlineRiders, icon: Clock, color: 'text-green-500', bg: 'bg-green-50', border: 'border-l-4 border-green-500' },
    { label: 'Active Accounts', value: stats.activeRiders, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-l-4 border-blue-500' },
    { label: 'Inactive/Suspended', value: stats.inactiveRiders, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-l-4 border-red-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Rider Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and monitor all delivery riders</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsExportOpen(true)}
            className="flex items-center px-4 py-2 bg-white border border-primary/20 text-primary rounded-lg hover:bg-primary-50 font-medium transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button 
            onClick={() => setIsAddRiderOpen(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Rider
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <RiderStatsCard 
            key={index}
            label={stat.label}
            value={String(stat.value)}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
            border={stat.border}
          />
        ))}
      </div>

      {/* Filters & Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 md:space-y-0 md:flex md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by name, ID, phone..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            value={searchVal}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
             <select 
                value={status} 
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary whitespace-nowrap"
             >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
             <select 
                value={isOnline} 
                onChange={(e) => handleOnlineFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary whitespace-nowrap"
             >
                <option value="all">Any Availability</option>
                <option value="true">Online</option>
                <option value="false">Offline</option>
            </select>
        </div>
      </div>

      {/* Content Area */}
      <div className={isFetching ? 'opacity-70 transition-opacity duration-200' : 'opacity-100 transition-opacity duration-200'}>
            
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {isLoading && riders.length === 0 ? (
                   // Initial loading skeleton or message
                   <div className="text-center py-10">Loading...</div>
                ) : (
                   riders.map((rider: Rider) => (
                    <RiderMobileCard 
                        key={rider.id} 
                        rider={rider} 
                        onViewDetails={setSelectedRider} 
                        onEdit={setEditingRider}
                        // Note: MobileCard currently might not support onDelete. 
                        // If it does, pass onDelete={handleDeleteClick}
                    />
                   ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <RiderTable 
                  riders={riders} 
                  onViewDetails={setSelectedRider} 
                  onEdit={setEditingRider}
                  onDelete={handleDeleteClick}
              />
            </div>

            {/* Empty State */}
            {!isLoading && riders.length === 0 && (
                 <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm">
                    No riders found matching your criteria.
                </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => {
                            const params = new URLSearchParams(searchParams)
                            params.set('page', String(page - 1))
                            router.replace(`${pathname}?${params.toString()}`)
                        }}
                        disabled={page <= 1}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => {
                            const params = new URLSearchParams(searchParams)
                            params.set('page', String(page + 1))
                            router.replace(`${pathname}?${params.toString()}`)
                        }}
                        disabled={page >= pagination.totalPages}
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
      </div>

      <RiderDetailsModal 
        isOpen={!!selectedRider} 
        onClose={() => setSelectedRider(null)} 
        rider={selectedRider} 
        onEdit={(rider) => {
          setEditingRider(rider)
          setSelectedRider(null) 
        }}
        onAssign={(rider) => {
          setAssigningRider(rider)
          setSelectedRider(null)
        }}
      />

      <EditRiderModal
        isOpen={!!editingRider}
        onClose={() => setEditingRider(null)}
        rider={editingRider}
        onSave={async (data) => {
          await updateRiderMutation.mutateAsync({ id: editingRider!.id, data })
          setEditingRider(null)
          setSelectedRider(null) 
        }}
      />

      <AssignOrdersModal 
        isOpen={!!assigningRider}
        onClose={() => setAssigningRider(null)}
        rider={assigningRider}
      />

      <ConfirmationModal
        isOpen={!!deletingRider}
        onClose={() => setDeletingRider(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Rider"
        description={`Are you sure you want to delete ${deletingRider?.name}? This action cannot be undone.`}
        isLoading={deleteRiderMutation.isPending}
        confirmText="Delete Rider"
        variant="danger"
      />

      <AddRiderModal 
        isOpen={isAddRiderOpen} 
        onClose={() => setIsAddRiderOpen(false)} 
      />

      <ExportRidersModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        filters={{
            search,
            status,
            isOnline
        }}
      />
    </div>
  )
}
