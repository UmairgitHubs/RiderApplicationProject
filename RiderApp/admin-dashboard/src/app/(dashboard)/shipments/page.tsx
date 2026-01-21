'use client'

import { useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useShipments, useAllShipments } from '@/hooks/useShipments'
import { useHubs } from '@/hooks/useHubs'
import { 
  Printer, 
  Download, 
  Search, 
  Box, 
  CheckCircle2, 
  Truck, 
  Clock, 
  XCircle, 
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { toast } from 'sonner'
import ShipmentStatsCard from '@/components/shipments/ShipmentStatsCard'
import ShipmentTable from '@/components/shipments/ShipmentTable'
import ShipmentMobileCard from '@/components/shipments/ShipmentMobileCard'
import ShipmentDetailsModal from '@/components/shipments/ShipmentDetailsModal'
import EditShipmentModal from '@/components/shipments/EditShipmentModal'
import ExportShipmentsModal from '@/components/shipments/ExportShipmentsModal'
import { Shipment } from '@/types/shipment'

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

export default function ShipmentsPage() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const page = Number(searchParams.get('page')) || 1
  const searchQuery = searchParams.get('search') || ''
  const statusFilter = searchParams.get('status') || ''
  const hubFilter = searchParams.get('hub') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''
  const limit = 10

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getDateRangeValue = () => {
    if (!startDate && !endDate) return 'all'
    const today = new Date()
    const todayStr = formatLocalDate(today)
    if (startDate === todayStr && endDate === todayStr) return 'today'
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    const yStr = formatLocalDate(yesterday)
    if (startDate === yStr && endDate === yStr) return 'yesterday'
    const lastWeek = new Date(today)
    lastWeek.setDate(today.getDate() - 7)
    const wStr = formatLocalDate(lastWeek)
    if (startDate === wStr && endDate === todayStr) return 'week'
    const lastMonth = new Date(today)
    lastMonth.setDate(today.getDate() - 30)
    const mStr = formatLocalDate(lastMonth)
    if (startDate === mStr && endDate === todayStr) return 'month'
    return 'all'
  }

  const { data, isLoading, refetch } = useShipments({
      page, 
      limit, 
      search: searchQuery,
      status: statusFilter,
      hubId: hubFilter,
      startDate,
      endDate
  })

  const { refetch: fetchAll } = useAllShipments({
      search: searchQuery,
      status: statusFilter,
      hubId: hubFilter,
      startDate,
      endDate
  })

  const { data: hubsData } = useHubs()

  const updatedParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    return params
  }

  const handleSearch = useDebounce((term: string) => {
    const params = updatedParams('search', term)
    replace(`${pathname}?${params.toString()}`)
  }, 500)

  const formatCurrency = (val: any) => `$${Number(val || 0).toFixed(2)}`

  const triggerExport = async (type: 'labels' | 'csv' | 'pdf') => {
    setIsGenerating(true)
    try {
      const response = await fetchAll()
      const allShipments = response.data?.data?.shipments || []
      
      if (!allShipments.length) {
        toast.error('No shipments to export')
        return
      }

      if (type === 'labels') {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [101.6, 152.4] })
        const ORANGE = [249, 115, 22]; const DARK_GRAY = [31, 41, 55]; const LIGHT_GRAY = [243, 244, 246]
        allShipments.forEach((d: any, index: number) => {
          if (index > 0) doc.addPage()
          const width = 101.6; const height = 152.4; const margin = 5; const contentW = width - (margin * 2)
          doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]).rect(0, 0, width, 20, 'F')
          doc.setTextColor(255).setFontSize(14).setFont("helvetica", "bold").text("EXPRESS LOGISTICS", margin, 12)
          doc.setFontSize(9).setFont("helvetica", "normal").text(new Date(d.createdAt).toLocaleDateString(), width - margin, 12, { align: 'right' })
          doc.setTextColor(0, 0, 0).setFontSize(8).setFont("helvetica", "bold").text("TRACKING NUMBER", width / 2, 35, { align: 'center' })
          doc.setFontSize(18).setFont("courier", "bold").text(d.trackingNumber || d.id, width / 2, 43, { align: 'center' })
          doc.setFillColor(DARK_GRAY[0], DARK_GRAY[1], DARK_GRAY[2]).rect(0, height - 25, width, 25, 'F')
          doc.setTextColor(255).setFontSize(8).text("CASH ON DELIVERY AMOUNT:", margin, height - 19)
          doc.setFontSize(26).setFont("helvetica", "bold").text(formatCurrency(d.amount || d.codAmount), width - margin, height - 9, { align: 'right' })
        })
        window.open(doc.output('bloburl'), '_blank')
      } else if (type === 'csv') {
        const headers = ['Tracking ID', 'Date', 'Merchant', 'Customer', 'Status', 'COD Amount']
        const rows = allShipments.map((d: any) => [d.trackingNumber || d.id, new Date(d.createdAt).toLocaleDateString(), `"${d.merchantName || 'N/A'}"`, `"${d.recipientName || 'N/A'}"`, d.status, d.amount || 0])
        const csvContent = [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob); const link = document.createElement('a')
        link.setAttribute('href', url); link.setAttribute('download', `shipments_export_${formatLocalDate(new Date())}.csv`)
        document.body.appendChild(link); link.click(); document.body.removeChild(link)
      } else if (type === 'pdf') {
        const doc = new jsPDF()
        doc.setTextColor(249, 115, 22).setFontSize(18).setFont("helvetica", "bold").text('Shipments Report', 14, 20)
        const tableRows = allShipments.map((d: any) => [d.trackingNumber || d.id, d.merchantName, d.recipientName, d.status, formatCurrency(d.amount || 0), new Date(d.createdAt).toLocaleDateString()])
        autoTable(doc, { startY: 40, head: [['Tracking ID', 'Merchant', 'Customer', 'Status', 'COD', 'Date']], body: tableRows, theme: 'striped', headStyles: { fillColor: [249, 115, 22], textColor: 255 } })
        doc.save(`shipments_report_${formatLocalDate(new Date())}.pdf`)
      }
    } catch (error) {
       toast.error("Failed to generate export")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStatusChange = (status: string) => {
    const params = updatedParams('status', status)
    replace(`${pathname}?${params.toString()}`)
  }

  const handleHubChange = (hub: string) => {
    const params = updatedParams('hub', hub)
    replace(`${pathname}?${params.toString()}`)
  }

  const handleDateChange = (range: string) => {
    const params = new URLSearchParams(searchParams)
    const today = new Date()
    if (range === 'today') {
      const str = formatLocalDate(today)
      params.set('startDate', str); params.set('endDate', str)
    } else if (range === 'yesterday') {
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
      const str = formatLocalDate(yesterday); params.set('startDate', str); params.set('endDate', str)
    } else if (range === 'week') {
      const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7)
      params.set('startDate', formatLocalDate(lastWeek)); params.set('endDate', formatLocalDate(today))
    } else if (range === 'month') {
      const lastMonth = new Date(today); lastMonth.setDate(today.getDate() - 30)
      params.set('startDate', formatLocalDate(lastMonth)); params.set('endDate', formatLocalDate(today))
    } else {
      params.delete('startDate'); params.delete('endDate')
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
  const filteredStats = data?.data?.stats || []
  const getCount = (statusName: string) => {
    const stat = filteredStats.find((s: any) => s.name.toLowerCase() === statusName.toLowerCase())
    return stat ? stat.value.toString() : '0'
  }
  
  const stats = [
    { label: 'Total Shipments', value: totalRecords.toString(), icon: Box, color: 'text-primary', bg: 'bg-primary-50', border: 'border-l-4 border-primary' },
    { label: 'Delivered', value: getCount('Delivered'), icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-l-4 border-green-500' },
    { label: 'In Transit', value: getCount('In Transit'), icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-l-4 border-blue-500' },
    { label: 'Pending', value: getCount('Pending'), icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-l-4 border-yellow-500' },
    { label: 'Failed', value: getCount('Failed'), icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-l-4 border-red-500' },
    { label: 'Returned', value: getCount('Returned'), icon: RotateCcw, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-l-4 border-purple-500' },
  ]

  const rawShipments = data?.data?.shipments || []
  const shipments: Shipment[] = rawShipments.map((s: any) => ({
    id: s.trackingNumber || s.id,
    date: new Date(s.createdAt).toLocaleString(),
    merchant: { name: s.merchantName || 'Unknown', code: 'MER-...' },
    customer: { name: s.recipientName, address: s.deliveryAddress },
    rider: s.rider || 'Unassigned',
    hub: s.hub || 'Unassigned',
    status: s.status,
    codAmount: Number(s.amount || s.codAmount || 0),
    codStatus: s.paymentStatus || 'Pending',
    priority: 'Normal'
  }))

  const handleViewShipment = (shipment: Shipment) => { setSelectedShipment(shipment); setIsModalOpen(true) }
  const handleEditShipment = (shipment?: Shipment) => { if (shipment) setSelectedShipment(shipment); setIsModalOpen(false); setIsEditModalOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Shipment Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track and manage all shipments with detailed analytics</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => triggerExport('labels')}
            disabled={isGenerating}
            className="flex items-center px-4 py-2 bg-white border border-primary/20 text-primary rounded-lg hover:bg-primary-50 font-medium transition-colors outline-none focus:ring-2 focus:ring-primary/20"
          >
            <Printer className="w-4 h-4 mr-2" />
            {isGenerating ? 'Processing...' : 'Print Labels'}
          </button>
          
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 font-medium transition-colors shadow-sm outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-1"
          >
              <Download className="w-4 h-4 mr-2" />
              Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, index) => (
          <ShipmentStatsCard 
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            bg={stat.bg}
            border={stat.border}
          />
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 md:space-y-0 md:flex md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by tracking ID, merchant, customer..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            defaultValue={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4 md:w-[400px]">
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
          <select 
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary"
            onChange={(e) => handleHubChange(e.target.value)}
            value={hubFilter || 'all'}
          >
            <option value="all">All Hubs</option>
            {hubsData?.data?.map((hub: any) => (
              <option key={hub.id} value={hub.id}>{hub.name}</option>
            ))}
          </select>
        </div>
      </div>

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
              <PaginationButton onClick={() => handlePageChange(page - 1)} disabled={page <= 1} isMobile={true}>Previous</PaginationButton>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <PaginationButton onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages} isMobile={true}>Next</PaginationButton>
            </div>
          </div>

          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
               <ShipmentTable shipments={shipments} onViewClick={handleViewShipment} onEditClick={handleEditShipment} />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to <span className="font-medium">{Math.min(page * limit, totalRecords)}</span> of <span className="font-medium">{totalRecords}</span> results
              </p>
              <div className="flex gap-2">
                <PaginationButton onClick={() => handlePageChange(page - 1)} disabled={page <= 1}><ChevronLeft className="w-4 h-4 mr-1" />Previous</PaginationButton>
                <PaginationButton onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>Next<ChevronRight className="w-4 h-4 ml-1" /></PaginationButton>
              </div>
            </div>
          </div>
        </>
      )}
      
      <ShipmentDetailsModal shipment={selectedShipment} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onEdit={handleEditShipment} />
      <EditShipmentModal key={selectedShipment?.id || 'edit-modal'} shipmentId={selectedShipment?.id || null} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onShipmentUpdated={refetch} />
      <ExportShipmentsModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} onExport={(format) => triggerExport(format as 'labels' | 'csv' | 'pdf')} totalShipments={totalRecords} filters={{ search: searchQuery, status: statusFilter, dateRange: getDateRangeValue(), hub: hubFilter }} />
    </div>
  )
}
