'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FileSpreadsheet, FileText, Calendar, Loader2, Download, Check, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { walletApi } from '@/lib/api/wallet'
import { WalletUser, WalletTransaction } from '@/types/wallet'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

interface ExportTransactionHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  user: WalletUser
}

export default function ExportTransactionHistoryModal({ isOpen, onClose, user }: ExportTransactionHistoryModalProps) {
  const [reportFormat, setReportFormat] = useState('csv')
  const [range, setRange] = useState('all_time')
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
      
      // Fetch details with dates and high limit
      const response = await walletApi.getWalletDetails(user.id, {
        limit: 2000,
        page: 1,
        startDate: dates.startDate,
        endDate: dates.endDate
      })

      const transactions = response.transactions || []

      if (transactions.length === 0) {
        toast.error(`No transactions found for the selected period (${range.replace('_', ' ')})`)
        setIsExporting(false)
        return
      }

      const reportData = {
        user,
        transactions,
        range,
        generatedAt: new Date(),
        currentBalance: response.user.currentBalance
      }

      if (reportFormat === 'csv') {
        generateCSV(reportData)
      } else {
        generatePDF(reportData)
      }

      toast.success('Transaction history exported successfully')
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to generate export')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = (data: any) => {
    const { transactions, user } = data
    const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Status', 'Balance After']
    
    const csvContent = [
      headers.join(','),
      ...transactions.map((tx: WalletTransaction) => [
        tx.id,
        new Date(tx.createdAt).toLocaleDateString(),
        tx.type,
        tx.category,
        `"${tx.description || ''}"`,
        tx.amount,
        tx.status,
        tx.balanceAfter
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `statement_${user.id}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDF = (data: any) => {
    const { user, transactions, generatedAt, range, currentBalance } = data
    const doc = new jsPDF()

    // Title
    doc.setFontSize(22)
    doc.setTextColor(249, 115, 22) // Orange-500
    doc.setFont("helvetica", "bold")
    doc.text('Wallet Statement', 14, 20)

    // User Info
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text(`${user.name}`, 14, 30)
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`ID: ${user.id} | Role: ${user.role}`, 14, 36)
    doc.text(`Email: ${user.email}`, 14, 42)

    // Statement Info
    doc.text(`Generated on: ${generatedAt.toLocaleDateString()} ${generatedAt.toLocaleTimeString()}`, 130, 30)
    doc.text(`Period: ${range.replace('_', ' ').toUpperCase()}`, 130, 36)
    doc.text(`Current Balance: $${Number(currentBalance).toLocaleString()}`, 130, 42)

    doc.setDrawColor(220)
    doc.line(14, 46, 196, 46)

    // Summary
    const totalIn = transactions
        .filter((t: any) => t.type === 'credit')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalOut = transactions
        .filter((t: any) => t.type === 'debit' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    doc.setFontSize(11)
    doc.setTextColor(50)
    doc.text('Statement Summary:', 14, 55)
    
    doc.setFontSize(10)
    doc.text(`Total Credits: $${totalIn.toLocaleString()}`, 20, 62)
    doc.text(`Total Debits: $${totalOut.toLocaleString()}`, 80, 62)
    doc.text(`Transactions: ${transactions.length}`, 140, 62)

    // Table
    const tableColumn = ["Date", "ID", "Type", "Description", "Status", "Amount"]
    const tableRows = transactions.map((tx: WalletTransaction) => [
       format(new Date(tx.createdAt), 'yyyy-MM-dd HH:mm'),
       tx.id.substring(0, 8),
       tx.type.toUpperCase(),
       tx.description || tx.category,
       tx.status,
       `$${Number(tx.amount).toLocaleString()}`
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
            5: { halign: 'right', fontStyle: 'bold' }
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

    doc.save(`statement_${user.id}_${generatedAt.toISOString().split('T')[0]}.pdf`)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-lg bg-white rounded-xl shadow-xl z-[150] outline-none animate-in zoom-in-95 duration-200 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-10">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-[#f97316]" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Export Statement</Dialog.Title>
                <p className="text-sm text-gray-500">For {user.name}</p>
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
                <Download className="w-4 h-4 text-gray-500" /> Report Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReportFormat('csv')}
                  className={`relative flex items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                    reportFormat === 'csv' 
                      ? 'border-[#f97316] bg-orange-50 text-[#f97316] ring-1 ring-[#f97316]' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 ${reportFormat === 'csv' ? 'text-[#f97316]' : 'text-gray-500'}`} />
                  <span className="font-medium">CSV / Excel</span>
                  {reportFormat === 'csv' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-[#f97316]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setReportFormat('pdf')}
                  className={`relative flex items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                    reportFormat === 'pdf' 
                      ? 'border-[#f97316] bg-orange-50 text-[#f97316] ring-1 ring-[#f97316]' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileText className={`w-5 h-5 ${reportFormat === 'pdf' ? 'text-[#f97316]' : 'text-gray-500'}`} />
                  <span className="font-medium">PDF Document</span>
                  {reportFormat === 'pdf' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-[#f97316]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" /> Time Period
              </label>
              <select 
                value={range} 
                onChange={(e) => setRange(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] text-sm transition-all text-gray-700"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_year">This Year</option>
                <option value="all_time">All Time</option>
              </select>
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
              className="flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium text-white bg-[#f97316] rounded-lg hover:bg-[#ea580c] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#f97316] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Generating...' : 'Download Statement'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
