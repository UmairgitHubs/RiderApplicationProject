'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FileSpreadsheet, FileText, Download, Check, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { walletApi } from '@/lib/api/wallet'
import { UserType, WalletUser } from '@/types/wallet'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportWalletsModalProps {
  isOpen: boolean
  onClose: () => void
  role: UserType
}

export default function ExportWalletsModal({ isOpen, onClose, role }: ExportWalletsModalProps) {
  const [format, setFormat] = useState('csv')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsExporting(true)

    try {
      // Fetch all wallets for the current role
      const response = await walletApi.getWallets({
        role,
        limit: 1000,
        page: 1
      })

      const users = response.users || []

      if (users.length === 0) {
        toast.error('No wallet data found to export')
        setIsExporting(false)
        return
      }

      const reportData = {
        role,
        users,
        generatedAt: new Date(),
        stats: response.stats
      }

      if (format === 'csv') {
        generateCSV(reportData)
      } else {
        generatePDF(reportData)
      }

      toast.success(`${role} wallet report generated successfully`)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to generate export')
    } finally {
      setIsExporting(false)
    }
  }

  const generateCSV = (data: any) => {
    const { users, role } = data
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Current Balance', 'Pending Amount', 'Total Deposits', 'Total Withdrawals', 'Last Transaction']
    
    const csvContent = [
      headers.join(','),
      ...users.map((u: WalletUser) => [
        u.id,
        `"${u.name}"`,
        `"${u.email}"`,
        u.role,
        u.currentBalance,
        u.pendingAmount,
        u.totalDeposits,
        u.totalWithdrawals,
        u.lastTransactionDate || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${role.toLowerCase()}_wallets_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generatePDF = (data: any) => {
    const { role, users, generatedAt, stats } = data
    const doc = new jsPDF()

    // Title
    doc.setFontSize(22)
    doc.setTextColor(249, 115, 22) // Orange-500
    doc.setFont("helvetica", "bold")
    doc.text(`${role} Wallet Report`, 14, 20)

    // Meta info
    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Generated on: ${generatedAt.toLocaleDateString()} ${generatedAt.toLocaleTimeString()}`, 14, 30)
    doc.text(`Total Users: ${users.length}`, 14, 36)

    doc.setDrawColor(220)
    doc.line(14, 42, 196, 42)

    // Overall Stats
    doc.setFontSize(11)
    doc.setTextColor(50)
  
    
    doc.setFontSize(10)
    doc.text(`Total Balance: $${stats.totalBalance.toLocaleString()}`, 20, 58)
    doc.text(`Total Deposits: $${stats.totalDeposits.toLocaleString()}`, 80, 58)
    doc.text(`Total Withdrawals: $${stats.totalWithdrawals.toLocaleString()}`, 140, 58)

    // Table
    const tableColumn = ["User ID", "Name", "Email", "Balance", "Deposits", "Withdrawals"]
    const tableRows = users.map((u: WalletUser) => [
       u.id.substring(0, 8),
       u.name,
       u.email,
       `$${u.currentBalance.toLocaleString()}`,
       `$${u.totalDeposits.toLocaleString()}`,
       `$${u.totalWithdrawals.toLocaleString()}`
    ])

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
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
            3: { halign: 'right' },
            4: { halign: 'right', textColor: [22, 163, 74] }, // Green
            5: { halign: 'right', textColor: [220, 38, 38] }  // Red
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

    doc.save(`${role.toLowerCase()}_wallets_report_${generatedAt.toISOString().split('T')[0]}.pdf`)
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-lg bg-white rounded-xl shadow-xl z-[110] outline-none animate-in zoom-in-95 duration-200 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-10">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                <Users className="w-5 h-5 text-[#f97316]" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Export Wallets</Dialog.Title>
                <p className="text-sm text-gray-500">Exporting report for {role}</p>
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
                      ? 'border-[#f97316] bg-orange-50 text-[#f97316] ring-1 ring-[#f97316]' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-[#f97316]' : 'text-gray-500'}`} />
                  <span className="font-medium">CSV / Excel</span>
                  {format === 'csv' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-[#f97316]" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('pdf')}
                  className={`relative flex items-center justify-center gap-3 p-4 border rounded-xl transition-all ${
                    format === 'pdf' 
                      ? 'border-[#f97316] bg-orange-50 text-[#f97316] ring-1 ring-[#f97316]' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <FileText className={`w-5 h-5 ${format === 'pdf' ? 'text-[#f97316]' : 'text-gray-500'}`} />
                  <span className="font-medium">PDF Document</span>
                  {format === 'pdf' && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-4 h-4 text-[#f97316]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
               This will export data for all <strong>{role}</strong> currently in the system, including their current balance and aggregated transaction statistics.
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
              {isExporting ? 'Generating...' : 'Download Report'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
