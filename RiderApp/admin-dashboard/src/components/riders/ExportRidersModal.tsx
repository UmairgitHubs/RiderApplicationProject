'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FileSpreadsheet, FileText, Calendar, Filter, Loader2, Download, Check } from 'lucide-react'
import { toast } from 'sonner'
import { ridersApi } from '@/lib/api/riders'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportRidersModalProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    search: string
    status: string
    isOnline: string
  }
}

export default function ExportRidersModal({ isOpen, onClose, filters }: ExportRidersModalProps) {
  const [format, setFormat] = useState('csv')
  const [range, setRange] = useState('all_time')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsExporting(true)

    try {
      // Fetch all data matching filters (limit 1000 for now)
      const response = await ridersApi.getAll({
        ...filters,
        limit: 1000,
        page: 1,
        is_online: filters.isOnline !== 'all' ? filters.isOnline : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
      })

      const riders = response.data.riders || []

      if (riders.length === 0) {
        toast.error('No data found to export')
        setIsExporting(false)
        return
      }

      if (format === 'csv') {
        generateCSV(riders)
      } else {
        generatePDF(riders)
      }

      toast.success(`Rider report exported as ${format.toUpperCase()}`)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = (riders: any[]) => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Hub', 'Vehicle Type', 'Vehicle Plate', 'Status', 'Online Status', 'Active Orders', 'Total Deliveries', 'Rating', 'Earnings']
    
    const csvContent = [
      headers.join(','),
      ...riders.map((r: any) => [
        r.id,
        `"${r.name}"`,
        r.email,
        r.phone,
        `"${r.hub}"`,
        r.vehicle.type,
        r.vehicle.plate,
        r.status,
        r.onlineStatus,
        r.activeOrders,
        r.totalDeliveries,
        r.rating,
        r.earnings
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `riders_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDF = (riders: any[]) => {
    const doc = new jsPDF()
    const now = new Date()

    // --- Header Section ---
    // Company/App Name
    doc.setFontSize(22)
    doc.setTextColor(249, 115, 22) // Primary Orange (#f97316)
    doc.setFont("helvetica", "bold")
    doc.text('Rider Management Report', 14, 20)

    // Subheader / Date
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.setFont("helvetica", "normal")
    doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 14, 28)

    // Filters Applied Summary
    let filterText = `Status: ${filters.status === 'all' ? 'All' : filters.status}  |  Online: ${filters.isOnline === 'all' ? 'Any' : (filters.isOnline === 'true' ? 'Online' : 'Offline')}`
    if (filters.search) filterText += `  |  Search: "${filters.search}"`
    
    doc.text(filterText, 14, 34)

    // --- Table Statistics Summary (Optional) ---
    doc.setDrawColor(220)
    doc.line(14, 38, 196, 38) // Horizontal line

    // --- Data Table ---
    const tableColumn = ["Name", "Phone", "Hub", "Vehicle", "Status", "Total Del.", "Earnings"]
    const tableRows = riders.map(rider => [
       rider.name,
       rider.phone,
       rider.hub,
       `${rider.vehicle.type} (${rider.vehicle.plate})`,
       rider.status,
       rider.totalDeliveries,
       `$${rider.earnings.toLocaleString()}`
    ])

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: {
            fillColor: [249, 115, 22], // Orange background
            textColor: 255, // White text
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            overflow: 'linebreak'
        },
        alternateRowStyles: {
            fillColor: [255, 247, 237] // Very light orange/gray
        },
        columnStyles: {
            0: { fontStyle: 'bold' }, // Name
            6: { halign: 'right' } // Earnings aligned right
        },
        didDrawPage: (data) => {
             // Footer Page Number
            const str = 'Page ' + doc.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(150)
            const pageSize = doc.internal.pageSize
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
            doc.text(str, data.settings.margin.left, pageHeight - 10)
        }
    })

    doc.save(`riders_report_${now.toISOString().split('T')[0]}.pdf`)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-lg bg-white rounded-xl shadow-xl z-[100] outline-none animate-in zoom-in-95 duration-200 flex flex-col"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-10">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Export Rider Report</Dialog.Title>
                <p className="text-sm text-gray-500">Download a detailed report of your rider fleet.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleExport} className="p-6 space-y-6">
            
            {/* Format Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" /> Export Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`relative flex items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                    format === 'csv' 
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-primary' : 'text-gray-500'}`} />
                  <span className="font-medium">CSV / Excel</span>
                  {format === 'csv' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`relative flex items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                    format === 'pdf' 
                      ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileText className={`w-5 h-5 ${format === 'pdf' ? 'text-primary' : 'text-gray-500'}`} />
                  <span className="font-medium">PDF Document</span>
                  {format === 'pdf' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-primary" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" /> Date Range
              </label>
              <select 
                value={range} 
                onChange={(e) => setRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              >
                <option value="all_time">All Time Data</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_year">This Year</option>
              </select>
            </div>

            {/* Filter Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex gap-3">
              <Filter className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Current Filters Applied</p>
                <p className="text-xs text-gray-500">
                  The report will honor your current search and filter settings ({filters.status === 'active' ? 'Active Only' : 'All Status'}, {filters.isOnline === 'true' ? 'Online Only' : 'All Availability'}).
                </p>
              </div>
            </div>

          </form>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3 sticky bottom-0">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Generating...' : 'Download Report'}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
