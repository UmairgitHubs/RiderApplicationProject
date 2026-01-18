'use client'

import { useState } from 'react'
import { useSearchParams, usePathname, useRouter, useParams } from 'next/navigation'
import { useShipments } from '@/hooks/useShipments'
import { merchantsApi } from '@/lib/api' // Assuming we can fetch merchant details directly or use hook
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import ShipmentTable from '@/components/shipments/ShipmentTable'
import ShipmentMobileCard from '@/components/shipments/ShipmentMobileCard'
import ShipmentDetailsModal from '@/components/shipments/ShipmentDetailsModal'
import EditShipmentModal from '@/components/shipments/EditShipmentModal'
import { Shipment } from '@/types/shipment'

// Debounce helper
function useDebounce(callback: Function, delay: number) {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)
  return (...args: any[]) => {
    if (timer) clearTimeout(timer)
    const newTimer = setTimeout(() => {
      callback(...args)
    }, delay)
    setTimer(newTimer)
  }
}

// Pagination Button Component
function PaginationButton({ onClick, disabled, children, className, isMobile = false }: any) {
  const baseClasses = isMobile 
    ? "px-4 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    : "flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${className || ''}`}>
      {children}
    </button>
  )
}

export default function MerchantOrdersPage() {
  const params = useParams()
  const merchantId = params?.id as string
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // URL State
  const page = Number(searchParams.get('page')) || 1
  const searchQuery = searchParams.get('search') || ''
  const statusFilter = searchParams.get('status') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const limit = 10

  // Fetch Merchant Details for header
  const { data: merchantData, isLoading: isLoadingMerchant } = useQuery({
    queryKey: ['merchant-details', merchantId],
    queryFn: () => merchantsApi.getDetails(merchantId),
    enabled: !!merchantId
  })

  const merchantName = merchantData?.data?.name || merchantData?.data?.contactName || 'Merchant'

  // Helper for local date YYYY-MM-DD
  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Derived date range value for select
  const getDateRangeValue = () => {
    if (!startDate && !endDate) return 'all'
    const today = new Date()
    const todayStr = formatLocalDate(today)
    
    // Check Today
    if (startDate === todayStr && endDate === todayStr) return 'today'
    
    // Check Yesterday
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yStr = formatLocalDate(yesterday)
    if (startDate === yStr && endDate === yStr) return 'yesterday'
    
    // Check Week
    const lastWeek = new Date(today)
    lastWeek.setDate(today.getDate() - 7)
    const wStr = formatLocalDate(lastWeek)
    if (startDate === wStr && endDate === todayStr) return 'week'

    // Check Month
    const lastMonth = new Date(today)
    lastMonth.setDate(today.getDate() - 30)
    const mStr = formatLocalDate(lastMonth)
    if (startDate === mStr && endDate === todayStr) return 'month'

    return 'all'
  }

  // Fetch shipments
  const { data, isLoading, refetch } = useShipments({
      page, 
      limit, 
      search: searchQuery,
      status: statusFilter,
      merchantId, // Filter by this merchant
      startDate,
      endDate
  })

  // Handlers
  const updatedParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1') // Reset to page 1
    return params
  }

  const handleSearch = useDebounce((term: string) => {
    const params = updatedParams('search', term)
    replace(`${pathname}?${params.toString()}`)
  }, 500)

  const handleStatusChange = (status: string) => {
    const params = updatedParams('status', status)
    replace(`${pathname}?${params.toString()}`)
  }

  const handleDateChange = (range: string) => {
    const params = new URLSearchParams(searchParams)
    const today = new Date()
    
    if (range === 'today') {
      const str = formatLocalDate(today)
      params.set('startDate', str)
      params.set('endDate', str)
    } else if (range === 'yesterday') {
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)
      const str = formatLocalDate(yesterday)
      params.set('startDate', str)
      params.set('endDate', str)
    } else if (range === 'week') {
      const lastWeek = new Date(today)
      lastWeek.setDate(today.getDate() - 7)
      params.set('startDate', formatLocalDate(lastWeek))
      params.set('endDate', formatLocalDate(today))
    } else if (range === 'month') {
      const lastMonth = new Date(today)
      lastMonth.setDate(today.getDate() - 30)
      params.set('startDate', formatLocalDate(lastMonth))
      params.set('endDate', formatLocalDate(today))
    } else {
      params.delete('startDate')
      params.delete('endDate')
    }
    params.set('page', '1')
    replace(`${pathname}?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    replace(`${pathname}?${params.toString()}`)
  }

  const totalPages = data?.data?.pagination?.totalPages || 1
  const totalRecords = data?.data?.pagination?.total || 0

  const rawShipments = data?.data?.shipments || []
  const shipments: Shipment[] = rawShipments.map((s: any) => ({
    id: s.trackingNumber || s.id,
    date: new Date(s.createdAt).toLocaleString(),
    merchant: { name: s.merchantName || merchantName || 'Unknown', code: 'MER-...' },
    customer: { name: s.recipientName, address: s.deliveryAddress },
    rider: s.rider || 'Unassigned',
    hub: 'Central Hub',
    status: s.status,
    codAmount: Number(s.amount || s.codAmount || 0),
    codStatus: s.paymentStatus || 'Pending',
    priority: 'Normal'
  }))

  const handleViewShipment = (shipment: Shipment) => {
    setSelectedShipment(shipment)
    setIsModalOpen(true)
  }

  const handleEditShipment = (shipment?: Shipment) => {
    if (shipment) setSelectedShipment(shipment)
    setIsModalOpen(false)
    setIsEditModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-4">
            <Link href="/merchants" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
            <h1 className="text-2xl font-bold text-primary">
                {isLoadingMerchant ? 'Loading Merchant...' : `${merchantName}'s Orders`}
            </h1>
            <p className="text-gray-500 text-sm mt-1">Viewing all shipments for this merchant</p>
            </div>
        </div>

      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 md:space-y-0 md:flex md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by tracking ID, customer..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 md:w-[300px]">
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary"
            onChange={(e) => handleDateChange(e.target.value)}
            value={getDateRangeValue()}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary"
            onChange={(e) => handleStatusChange(e.target.value)}
            value={statusFilter || 'all'}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="picked_up">Picked Up</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-4">
            {shipments.map((shipment) => (
              <ShipmentMobileCard 
                key={shipment.id} 
                shipment={shipment}
                onViewClick={handleViewShipment}
                onEditClick={handleEditShipment}
              />
            ))}
            
            <div className="flex justify-between items-center pt-2">
              <PaginationButton 
                onClick={() => handlePageChange(page - 1)} 
                disabled={page <= 1}
                isMobile={true}
              >
                Previous
              </PaginationButton>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <PaginationButton
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                isMobile={true}
              >
                Next
              </PaginationButton>
            </div>
          </div>

          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
               <ShipmentTable 
                 shipments={shipments} 
                 onViewClick={handleViewShipment} 
                 onEditClick={handleEditShipment}
               />
            </div>
            
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalRecords)}</span> of <span className="font-medium">{totalRecords}</span> results
              </p>
              <div className="flex gap-2">
                <PaginationButton 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </PaginationButton>
                <PaginationButton
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </PaginationButton>
              </div>
            </div>
          </div>
        </>
      )}
      
      <ShipmentDetailsModal 
        shipment={selectedShipment} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onEdit={handleEditShipment}
      />

      <EditShipmentModal
        key={selectedShipment?.id || 'edit-modal'}
        shipmentId={selectedShipment?.id || null}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onShipmentUpdated={refetch}
      />
    </div>
  )
}
