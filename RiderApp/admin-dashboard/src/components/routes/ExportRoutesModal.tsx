'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FileSpreadsheet, FileText, Calendar, Filter, Loader2, Download, Check, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { routesApi } from '@/lib/api/routes'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportRoutesModalProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    hubId: string
    status: string
  }
}

export default function ExportRoutesModal({ isOpen, onClose, filters }: ExportRoutesModalProps) {
  const [format, setFormat] = useState('csv')
  const [range, setRange] = useState('all_time')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsExporting(true)

    try {
      // Fetch all data matching filters
      const response = await routesApi.getAll({
        hubId: filters.hubId,
        status: filters.status,
      })

      const routes = response.data || []

      if (routes.length === 0) {
        toast.error('No routes found to export')
        setIsExporting(false)
        return
      }

      if (format === 'csv') {
        generateCSV(routes)
      } else {
        generatePDF(routes)
      }

      toast.success(`Routes report exported as ${format.toUpperCase()}`)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = (routes: any[]) => {
    const headers = ['ID', 'Route Name', 'Status', 'Rider Name', 'Start Point (Hub)', 'Pickups', 'Deliveries', 'Distance', 'Est. Time', 'Total COD', 'Progress %', 'Created At']
    
    const csvContent = [
      headers.join(','),
      ...routes.map((r: any) => [
        r.id,
        `"${r.name}"`,
        r.status,
        `"${r.rider?.name || 'Unassigned'}"`,
        `"${r.startPoint}"`,
        r.pickupCount,
        r.deliveryCount,
        `"${r.distance}"`,
        `"${r.estTime}"`,
        r.totalCod,
        r.progress,
        `"${new Date(r.createdAt).toLocaleString()}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `routes_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDF = (routes: any[]) => {
    const doc = new jsPDF()
    const now = new Date()

    // --- Header Section ---
    doc.setFontSize(22)
    doc.setTextColor(237, 125, 49) // Primary Orange (#ED7D31)
    doc.setFont("helvetica", "bold")
    doc.text('Route Management Report', 14, 20)

    // Subheader / Date
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.setFont("helvetica", "normal")
    doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 14, 28)

    // Filters Applied Summary
    let filterText = `Status: ${filters.status || 'All'} | Hub ID: ${filters.hubId || 'All'}`
    doc.text(filterText, 14, 34)

    // --- Table Statistics Summary ---
    doc.setDrawColor(220)
    doc.line(14, 38, 196, 38) // Horizontal line

    // Summary Boxes Layout (2x2 Grid to prevent overlapping)
    const activeCount = routes.filter(r => r.status === 'Active').length
    const completedCount = routes.filter(r => r.status === 'Completed').length
    const totalCod = routes.reduce((sum, r) => sum + Number(r.totalCod || 0), 0)

    doc.setFontSize(10)
    doc.setTextColor(50)
    doc.setFont("helvetica", "bold")
    doc.text('Logistics Intelligence Summary', 14, 45)
    
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    
    // Row 1
    doc.text(`Total Routes: ${routes.length}`, 14, 52)
    doc.text(`Completed: ${completedCount} Routes`, 105, 52) 
    
    // Row 2
    doc.text(`Active Routes: ${activeCount}`, 14, 58)
    const codText = `Total COD Volume: $${totalCod.toLocaleString()}`
    doc.text(codText, 105, 58)

    // --- Data Table ---
    const tableColumn = ["Route Name", "Status", "Rider", "Start Hub", "Stops (P/D)", "COD Amount", "Progress"]
    const tableRows = routes.map(r => [
       r.name,
       r.status,
       r.rider?.name || 'Unassigned',
       r.startPoint,
       `${r.pickupCount} / ${r.deliveryCount}`,
       `$${Number(r.totalCod || 0).toLocaleString()}`,
       `${r.progress}%`
    ])

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 68, // Shifted down for the 2nd row of summary
        theme: 'grid',
        headStyles: {
            fillColor: [237, 125, 49], // #ED7D31 Orange
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
            fillColor: [255, 247, 237] // Light orange tint
        },
        columnStyles: {
            0: { fontStyle: 'bold' }, // Name
            5: { halign: 'right', textColor: [237, 125, 49], fontStyle: 'bold' }, // COD
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

    doc.save(`routes_report_${now.toISOString().split('T')[0]}.pdf`)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-lg bg-white rounded-3xl shadow-2xl z-[100] outline-none animate-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white z-10">
            <div className="flex items-center gap-4">
              <div className="bg-orange-50 p-3 rounded-2xl">
                <Download className="w-6 h-6 text-[#ED7D31]" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-black text-gray-900 leading-none">Export Routes Intel</Dialog.Title>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1.5">Distribution Logistics Report</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleExport} className="p-8 space-y-8">
            
            {/* Format Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">
                Select Report Format
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormat('csv')}
                  className={`relative flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-[2rem] transition-all ${
                    format === 'csv' 
                      ? 'border-[#ED7D31] bg-orange-50/50 text-[#ED7D31] shadow-lg shadow-orange-100' 
                      : 'border-gray-50 hover:border-orange-100 bg-gray-50/30'
                  }`}
                >
                  <FileSpreadsheet className={`w-8 h-8 ${format === 'csv' ? 'text-[#ED7D31]' : 'text-gray-300'}`} />
                  <span className="text-xs font-black uppercase tracking-tight">Spreadsheet</span>
                  {format === 'csv' && (
                    <div className="absolute top-4 right-4 bg-[#ED7D31] rounded-full p-1 shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`relative flex flex-col items-center justify-center gap-3 p-6 border-2 rounded-[2rem] transition-all ${
                    format === 'pdf' 
                      ? 'border-[#ED7D31] bg-orange-50/50 text-[#ED7D31] shadow-lg shadow-orange-100' 
                      : 'border-gray-50 hover:border-orange-100 bg-gray-50/30'
                  }`}
                >
                  <FileText className={`w-8 h-8 ${format === 'pdf' ? 'text-[#ED7D31]' : 'text-gray-300'}`} />
                  <span className="text-xs font-black uppercase tracking-tight">PDF Document</span>
                  {format === 'pdf' && (
                    <div className="absolute top-4 right-4 bg-[#ED7D31] rounded-full p-1 shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest block">
                Temporal Range
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select 
                  value={range} 
                  onChange={(e) => setRange(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-bold outline-none appearance-none"
                >
                  <option value="all_time">All Available History</option>
                  <option value="today">Today's Active Routes</option>
                  <option value="this_week">This Week's Logistics</option>
                </select>
              </div>
            </div>

          </form>

          {/* Footer */}
          <div className="p-8 border-t border-gray-50 bg-white flex flex-col sm:flex-row justify-end gap-4 sticky bottom-0">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-4 text-[10px] font-black text-gray-400 hover:text-gray-900 uppercase tracking-[0.2em] transition-all"
            >
              Dismiss
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-3 px-10 py-4 text-[10px] font-black text-white bg-[#ED7D31] rounded-2xl hover:bg-[#d86a24] disabled:opacity-50 transition-all shadow-xl shadow-orange-100 uppercase tracking-[0.15em]"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Generating...' : 'Download Intelligence'}
            </button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
