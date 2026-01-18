'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FileSpreadsheet, FileText, Calendar, Filter, Loader2, Download, Check } from 'lucide-react'
import { toast } from 'sonner'
import { merchantsApi } from '@/lib/api/merchants'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportMerchantsModalProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    search: string
  }
}

export default function ExportMerchantsModal({ isOpen, onClose, filters }: ExportMerchantsModalProps) {
  const [format, setFormat] = useState('csv')
  const [range, setRange] = useState('all_time')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsExporting(true)

    try {
      // Fetch all data matching filters (limit 1000 for now)
      const response = await merchantsApi.getAll({
        ...filters,
        limit: 1000,
        page: 1,
      })

      const merchants = response.data.merchants || []

      if (merchants.length === 0) {
        toast.error('No data found to export')
        setIsExporting(false)
        return
      }

      if (format === 'csv') {
        generateCSV(merchants)
      } else {
        generatePDF(merchants)
      }

      toast.success(`Merchant report exported as ${format.toUpperCase()}`)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = (merchants: any[]) => {
    const headers = ['ID', 'Business Name', 'Owner', 'Location', 'Category', 'Active Orders', 'Total Orders', 'Wallet Balance', 'Status']
    
    const csvContent = [
      headers.join(','),
      ...merchants.map((m: any) => [
        m.id,
        `"${m.name}"`,
        `"${m.owner.name}"`,
        `"${m.location}"`,
        m.category,
        m.activeOrders,
        m.totalOrders,
        m.wallet,
        m.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `merchants_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDF = (merchants: any[]) => {
    const doc = new jsPDF()
    const now = new Date()

    // --- Header Section ---
    doc.setFontSize(22)
    doc.setTextColor(249, 115, 22) // Primary Orange (#f97316)
    doc.setFont("helvetica", "bold")
    doc.text('Merchant Management Report', 14, 20)

    // Subheader / Date
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.setFont("helvetica", "normal")
    doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 14, 28)

    // Filters Applied Summary
    let filterText = `Search: "${filters.search || 'None'}"`
    doc.text(filterText, 14, 34)

    // --- Table Statistics Summary line (Optional) ---
    doc.setDrawColor(220)
    doc.line(14, 38, 196, 38) // Horizontal line

    // --- Data Table ---
    const tableColumn = ["Business Name", "Owner", "Location", "Category", "Active", "Total", "Wallet", "Status"]
    const tableRows = merchants.map(m => [
       m.name,
       m.owner.name,
       m.location,
       m.category,
       m.activeOrders,
       m.totalOrders,
       `$${Number(m.wallet).toLocaleString()}`,
       m.status
    ])

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: {
            fillColor: [249, 115, 22], // Orange background
            textColor: 255, // White text
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: {
            fontSize: 8,
            cellPadding: 3,
            overflow: 'linebreak'
        },
        alternateRowStyles: {
            fillColor: [255, 247, 237] // Very light orange/gray
        },
        columnStyles: {
            0: { fontStyle: 'bold' }, // Name
            6: { halign: 'right' } // Wallet aligned right
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

    doc.save(`merchants_report_${now.toISOString().split('T')[0]}.pdf`)
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
                <Dialog.Title className="text-lg font-bold text-gray-900">Export Merchant Report</Dialog.Title>
                <p className="text-sm text-gray-500">Download a detailed report of your merchants.</p>
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
                  The report will honor your current search settings (Search: "{filters.search || 'None'}").
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
