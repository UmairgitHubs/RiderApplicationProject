'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FileSpreadsheet, FileText, Calendar, Filter, Loader2, Download, Check } from 'lucide-react'
import { toast } from 'sonner'
import { hubsApi } from '@/lib/api/hubs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportHubsModalProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    search: string
  }
}

export default function ExportHubsModal({ isOpen, onClose, filters }: ExportHubsModalProps) {
  const [format, setFormat] = useState('csv')
  const [range, setRange] = useState('all_time')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsExporting(true)

    try {
      // Fetch all data matching filters
      const response = await hubsApi.getAll({
        search: filters.search,
      })

      const hubs = response.data || []

      if (hubs.length === 0) {
        toast.error('No data found to export')
        setIsExporting(false)
        return
      }

      if (format === 'csv') {
        generateCSV(hubs)
      } else {
        generatePDF(hubs)
      }

      toast.success(`Hubs report exported as ${format.toUpperCase()}`)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = (hubs: any[]) => {
    const headers = ['ID', 'Hub Name', 'City', 'Address', 'Manager Name', 'Status', 'Total Riders', 'Total Employees', 'Capacity Used', 'Pending Parcels', 'Delivered Parcels']
    
    const csvContent = [
      headers.join(','),
      ...hubs.map((h: any) => [
        h.id,
        `"${h.name}"`,
        `"${h.city}"`,
        `"${h.address}"`,
        `"${h.manager?.name || 'Unassigned'}"`,
        h.status,
        h.stats.totalRiders,
        h.stats.totalEmployees,
        `"${h.details.capacity}"`,
        h.stats.pendingParcels,
        h.stats.deliveredParcels
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `hubs_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDF = (hubs: any[]) => {
    const doc = new jsPDF()
    const now = new Date()

    // --- Header Section ---
    doc.setFontSize(22)
    doc.setTextColor(249, 115, 22) // Primary Orange (#f97316)
    doc.setFont("helvetica", "bold")
    doc.text('Hub Management Report', 14, 20)

    // Subheader / Date
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.setFont("helvetica", "normal")
    doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 14, 28)

    // Filters Applied Summary
    let filterText = `Search: "${filters.search || 'None'}"`
    doc.text(filterText, 14, 34)

    // --- Table Statistics Summary ---
    doc.setDrawColor(220)
    doc.line(14, 38, 196, 38) // Horizontal line

    // --- Data Table ---
    const tableColumn = ["Hub Name", "City", "Manager", "Status", "Riders", "Capacity", "Pending"]
    const tableRows = hubs.map(hub => [
       hub.name,
       hub.city,
       hub.manager?.name || 'Unassigned',
       hub.status,
       hub.stats.totalRiders,
       hub.details.capacity,
       hub.stats.pendingParcels
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

    doc.save(`hubs_report_${now.toISOString().split('T')[0]}.pdf`)
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
              <div className="bg-orange-100 p-2 rounded-lg">
                <Download className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Export Hubs Report</Dialog.Title>
                <p className="text-sm text-gray-500">Download a detailed report of your distribution hubs.</p>
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
                      ? 'border-orange-500 bg-orange-50 text-orange-600 ring-1 ring-orange-500' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-orange-600' : 'text-gray-500'}`} />
                  <span className="font-medium">CSV / Excel</span>
                  {format === 'csv' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-orange-600" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`relative flex items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                    format === 'pdf' 
                      ? 'border-orange-500 bg-orange-50 text-orange-600 ring-1 ring-orange-500' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileText className={`w-5 h-5 ${format === 'pdf' ? 'text-orange-600' : 'text-gray-500'}`} />
                  <span className="font-medium">PDF Document</span>
                  {format === 'pdf' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-orange-600" />
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
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm transition-all"
              >
                <option value="all_time">All Time Data</option>
                <option value="this_month" disabled>This Month (Coming Soon)</option>
                <option value="last_month" disabled>Last Month (Coming Soon)</option>
              </select>
            </div>

            {/* Filter Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex gap-3">
              <Filter className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">Current Filters Applied</p>
                <p className="text-xs text-gray-500">
                  The report will include all hubs matching your current search: "{filters.search || 'All Hubs'}".
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
              className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-orange-200"
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
