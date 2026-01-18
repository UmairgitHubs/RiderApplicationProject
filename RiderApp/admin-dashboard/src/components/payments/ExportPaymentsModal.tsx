'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, FileSpreadsheet, FileText, Calendar, Filter, Loader2, Download, Check } from 'lucide-react'
import { toast } from 'sonner'
import { paymentsApi } from '@/lib/api/payments'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportPaymentsModalProps {
  isOpen: boolean
  onClose: () => void
  filters?: {
    search?: string
  }
  type?: 'transactions' | 'reconciliation'
}

export default function ExportPaymentsModal({ isOpen, onClose, filters, type = 'transactions' }: ExportPaymentsModalProps) {
  const [format, setFormat] = useState('csv')
  const [range, setRange] = useState('all_time')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsExporting(true)

    try {
      // Fetch data
      const response = await paymentsApi.getAll({
        search: filters?.search,
        limit: 1000 // Reasonable limit for now
      })

      let transactions = response.data || []

      // Filter for Reconciliation Report
      if (type === 'reconciliation') {
          transactions = transactions.filter((t: any) => t.status.toLowerCase() === 'completed');
      }

      if (transactions.length === 0) {
        toast.error(`No ${type} data found to export`)
        setIsExporting(false)
        return
      }

      if (format === 'csv') {
        generateCSV(transactions)
      } else {
        generatePDF(transactions)
      }

      toast.success(`${type === 'reconciliation' ? 'Reconciliation' : 'Transactions'} report exported successfully`)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

  /* New Logic for Reconciliation vs Transactional Reports based on user definition */

  const generateCSV = (transactions: any[]) => {
    if (type === 'reconciliation') {
        // Reconciliation Summary CSV
        const totalTxns = transactions.length;
        const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const reconciledTxns = transactions.filter(t => t.status.toLowerCase() === 'completed');
        const pendingTxns = transactions.filter(t => t.status.toLowerCase() !== 'completed');
        
        const headers = ['Category', 'Count', 'Total Amount', 'Status'];
        const rows = [
            ['Total System Records', totalTxns, totalAmount.toFixed(2), ''],
            ['Fully Reconciled', reconciledTxns.length, reconciledTxns.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2), 'Verified'],
            ['Pending Reconciliation', pendingTxns.length, pendingTxns.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2), 'Action Required'],
            ['COD Collections', transactions.filter(t => t.method === 'COD').length, transactions.filter(t => t.method === 'COD').reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2), ''],
            ['Online Payments', transactions.filter(t => t.method !== 'COD').length, transactions.filter(t => t.method !== 'COD').reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2), '']
        ];

        const csvContent = [
             headers.join(','),
             ...rows.map(row => row.join(','))
        ].join('\n');
        
        saveFile(csvContent, 'csv');
        return;
    }

    // Transactional Report (Detailed)
    const headers = ['ID', 'Date', 'Tracking ID', 'Type', 'Amount', 'Status', 'Rider', 'Merchant', 'Payment Method', 'Reconciled'];
    const csvContent = [
      headers.join(','),
      ...transactions.map((t: any) => [
        t.id,
        new Date(t.date).toLocaleDateString(),
        t.trackingId,
        t.type,
        t.amount,
        t.status,
        `"${t.rider}"`,
        `"${t.merchant}"`,
        t.method,
        t.reconciled ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    saveFile(csvContent, 'csv');
  }

  const generatePDF = (transactions: any[]) => {
    const doc = new jsPDF();
    const now = new Date();

    // -- Header --
    doc.setFontSize(22);
    doc.setTextColor(249, 115, 22);
    doc.setFont("helvetica", "bold");
    doc.text(type === 'reconciliation' ? 'Reconciliation Summary Report' : 'Transactional Audit Report', 14, 20);

    // -- Meta Info --
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${now.toLocaleString()}`, 14, 28);
    
    doc.setDrawColor(220);
    doc.line(14, 34, 196, 34);

    if (type === 'reconciliation') {
        // -- Reconciliation Logic --
        const totalAmount = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const reconciled = transactions.filter(t => t.status.toLowerCase() === 'completed');
        const pending = transactions.filter(t => t.status.toLowerCase() !== 'completed');
        
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Internal Reconciliation Summary", 14, 45);

        const summaryData = [
            ['Total Transactions Recorded', transactions.length, `Rs. ${totalAmount.toLocaleString()}`],
            ['Fully Reconciled (Completed)', reconciled.length, `Rs. ${reconciled.reduce((s,t) => s + Number(t.amount), 0).toLocaleString()}`],
            ['Pending / Unreconciled', pending.length, `Rs. ${pending.reduce((s,t) => s + Number(t.amount), 0).toLocaleString()}`],
            ['Mismatch / Discrepancies', '0', 'Rs. 0'] // Placeholder for future logic
        ];

        autoTable(doc, {
            startY: 50,
            head: [['Metric', 'Count', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [100, 116, 139], textColor: 255 }, // Slate gray for finance
            styles: { fontSize: 11, cellPadding: 6 },
            columnStyles: { 2: { halign: 'right' } }
        });

        // Add note
        const finalY = (doc as any).lastAutoTable?.finalY + 15;
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Note: This report compares internal system states. Discrepancies with bank statements must be verified manually.", 14, finalY);

    } else {
        // -- Transactional Logic (Detailed List) --
        doc.text(`Total Records: ${transactions.length}`, 14, 40);
        
        const tableColumn = ["ID", "Date", "Tracking", "Amount", "Status", "Merchant"];
        const tableRows = transactions.map(t => [
           t.id.substring(0, 8),
           new Date(t.date).toLocaleDateString(),
           t.trackingId,
           `Rs. ${t.amount.toLocaleString()}`,
           t.status,
           t.merchant
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 3 },
            alternateRowStyles: { fillColor: [255, 247, 237] }
        });
    }

    doc.save(`${type}_report_${now.toISOString().split('T')[0]}.pdf`);
  }

  const saveFile = (content: string, extension: string) => {
      const blob = new Blob([content], { type: `text/${extension};charset=utf-8;` });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
        <Dialog.Content 
          className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[95%] max-w-lg bg-white rounded-xl shadow-xl z-[100] outline-none animate-in zoom-in-95 duration-200 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-xl z-10">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Download className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900">Export Payments</Dialog.Title>
                <p className="text-sm text-gray-500">Download payment transaction reports.</p>
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
                <option value="this_month">This Month</option>
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
