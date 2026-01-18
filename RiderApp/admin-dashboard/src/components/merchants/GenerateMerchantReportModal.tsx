'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FileSpreadsheet, FileText, Calendar, Filter, Loader2, Download, Check } from 'lucide-react'
import { toast } from 'sonner'
import { adminShipmentsApi } from '@/lib/api/shipments'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface GenerateMerchantReportModalProps {
  isOpen: boolean
  onClose: () => void
  merchant: any
}

export default function GenerateMerchantReportModal({ isOpen, onClose, merchant }: GenerateMerchantReportModalProps) {
  const [format, setFormat] = useState('csv')
  const [range, setRange] = useState('this_month')
  const [isExporting, setIsExporting] = useState(false)

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date | undefined
    let endDate: Date | undefined = now

    if (range === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (range === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0)
    } else if (range === 'last_30_days') {
      startDate = new Date()
      startDate.setDate(now.getDate() - 30)
    } else if (range === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1)
    } else if (range === 'all_time') {
      // no dates
    }

    return {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    }
  }

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsExporting(true)

    try {
      const dates = getDateRange()
      
      // Fetch shipments for this merchant
      const response = await adminShipmentsApi.getAll({
        merchantId: merchant.id,
        limit: 1000,
        page: 1,
        startDate: dates.startDate,
        endDate: dates.endDate
      })

      const shipments = response.data.shipments || response.data || []

      if (shipments.length === 0) {
        toast.error('No shipments found for this period')
        setIsExporting(false)
        return
      }

      const reportData = {
        merchant,
        shipments,
        range,
        generatedAt: new Date()
      }

      if (format === 'csv') {
        generateCSV(reportData)
      } else {
        generatePDF(reportData)
      }

      toast.success(`Report generated successfully`)
      onClose()
    } catch (error) {
      console.error('Report generation failed:', error)
      toast.error('Failed to generate report')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = (data: any) => {
    const { shipments } = data
    const headers = ['Tracking ID', 'Date', 'Customer Name', 'Status', 'Amount (Rs.)', 'Pickup Address', 'Delivery Address']
    
    const csvContent = [
      headers.join(','),
      ...shipments.map((s: any) => [
        s.trackingNumber || s.id,
        new Date(s.createdAt).toLocaleDateString(),
        `"${s.recipientName || s.customerName || 'N/A'}"`,
        s.status,
        s.price || s.codAmount || 0,
        `"${s.pickupAddress || 'N/A'}"`,
        `"${s.deliveryAddress || 'N/A'}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `merchant_report_${merchant.id}_${new Date().toISOString().split('T')[0]}.csv`) // Fixed template string
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDF = (data: any) => {
    const { merchant, shipments, generatedAt, range } = data
    const doc = new jsPDF()

    doc.setFontSize(22)
    doc.setTextColor(249, 115, 22)
    doc.setFont("helvetica", "bold")
    doc.text('Merchant Performance Report', 14, 20)

    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(`${merchant.name || 'Merchant'} (ID: ${merchant.id})`, 14, 30)
    
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated on: ${generatedAt.toLocaleDateString()} ${generatedAt.toLocaleTimeString()}`, 14, 36)
    doc.text(`Period: ${range.replace('_', ' ').toUpperCase()}`, 14, 42)

    doc.setDrawColor(220)
    doc.line(14, 46, 196, 46)

    const totalShipments = shipments.length
    const totalRevenue = shipments.reduce((sum: number, s: any) => sum + (Number(s.price) || Number(s.codAmount) || 0), 0)
    const deliveredCount = shipments.filter((s: any) => s.status?.toLowerCase() === 'delivered').length
    
    doc.setFontSize(11)
    doc.setTextColor(50)
    doc.text('Summary Statistics:', 14, 55)
    
    doc.setFontSize(10)
    doc.text(`Total Shipments: ${totalShipments}`, 20, 62)
    doc.text(`Total Revenue: Rs. ${totalRevenue.toLocaleString()}`, 80, 62)
    doc.text(`Delivered: ${deliveredCount}`, 140, 62)

    const tableColumn = ["Tracking ID", "Date", "Customer", "Status", "Amount"]
    const tableRows = shipments.map((s: any) => [
       s.trackingNumber || s.id.substring(0, 8),
       new Date(s.createdAt).toLocaleDateString(),
       s.recipientName || s.customerName || 'N/A',
       s.status,
       `Rs. ${Number(s.price || s.codAmount || 0).toLocaleString()}`
    ])

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'grid',
        headStyles: {
            fillColor: [249, 115, 22],
            textColor: 255,
            fontSize: 9,
            fontStyle: 'bold',
        },
        styles: {
            fontSize: 8,
            cellPadding: 3,
        },
        alternateRowStyles: {
            fillColor: [255, 247, 237]
        },
        columnStyles: {
            4: { halign: 'right' }
        },
        didDrawPage: (data) => {
            const str = 'Page ' + doc.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(150)
            const pageSize = doc.internal.pageSize
            const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
            doc.text(str, data.settings.margin.left, pageHeight - 10)
        }
    })

    doc.save(`merchant_report_${merchant.id}_${generatedAt.toISOString().split('T')[0]}.pdf`)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-lg bg-white rounded-xl shadow-xl z-[110] outline-none animate-in zoom-in-95 duration-200 flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-10">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Generate Report</Dialog.Title>
                <p className="text-sm text-gray-500">For {merchant?.name || 'Merchant'}</p>
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
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-gray-500" /> Report Format
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

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" /> Time Period
              </label>
              <select 
                value={range} 
                onChange={(e) => setRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_year">This Year</option>
                <option value="all_time">All Time</option>
              </select>
            </div>
          </form>

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
              {isExporting ? 'Generating Report...' : 'Download'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
