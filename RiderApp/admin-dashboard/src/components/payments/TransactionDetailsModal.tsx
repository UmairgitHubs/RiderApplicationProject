'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  DollarSign, 
  User, 
  Store, 
  Clock, 
  CheckCircle2, 
  Download, 
  FileText, 
  CreditCard,
  Check
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/api/payments'
import { Transaction, TransactionDetails } from '@/types/payment'

interface TransactionDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
}

import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function TransactionDetailsModal({ isOpen, onClose, transaction }: TransactionDetailsModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: detailsResponse, isLoading } = useQuery<{ data: TransactionDetails }>({
    queryKey: ['payment-details', transaction?.id],
    queryFn: () => paymentsApi.getDetails(transaction!.id),
    enabled: !!transaction?.id && isOpen,
    staleTime: 0 // Always fetch fresh details
  })

  // Prevent background scrolling when modal is open
    useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!mounted || !isOpen || !transaction) return null

  const details = detailsResponse?.data
  
  // derived or fallback values
  const currentTransaction = details || transaction

  // Format helpers
  const formatCurrency = (amount: number, currency = 'PKR') => {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: currency }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Pending'
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Action Handlers
  const handleSubmitToHub = async () => {
      if (!currentTransaction.id) return;
      setIsSubmitting(true);
      try {
          await paymentsApi.submitToHub(currentTransaction.id);
          toast.success('Funds submitted to Hub successfully');
          queryClient.invalidateQueries({ queryKey: ['payment-details', currentTransaction.id] });
          queryClient.invalidateQueries({ queryKey: ['payments'] }); // Refresh list
      } catch (error) {
          console.error("Failed to submit to hub", error);
          toast.error('Failed to submit funds');
      } finally {
          setIsSubmitting(false);
      }
  }

  const handleReconcile = async () => {
      if (!currentTransaction.id) return;
      setIsSubmitting(true);
      try {
          await paymentsApi.reconcile(currentTransaction.id);
          toast.success('Transaction reconciled successfully');
          queryClient.invalidateQueries({ queryKey: ['payment-details', currentTransaction.id] });
          queryClient.invalidateQueries({ queryKey: ['payments'] });
      } catch (error) {
          console.error("Failed to reconcile", error);
          toast.error('Failed to reconcile transaction');
      } finally {
          setIsSubmitting(false);
      }
  }

  const generateReceipt = () => {
    const doc = new jsPDF();
    
    // Brand Colors
    const primaryColor = [249, 115, 22] // Orange
    const grayColor = [100, 116, 139]

    // --- Header ---
    doc.setFontSize(24);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("COD Express", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setFont("helvetica", "normal");
    doc.text("Official Payment Receipt", 14, 25);

    // Right aligned Info
    const rightMargin = 196;
    doc.setFontSize(10);
    doc.text(`Receipt #: ${currentTransaction.id.substring(0, 8).toUpperCase()}`, rightMargin, 20, { align: 'right' });
    doc.text(`Date: ${new Date(currentTransaction.date).toLocaleDateString()}`, rightMargin, 25, { align: 'right' });

    doc.setDrawColor(220);
    doc.line(14, 30, 196, 30);

    // --- Info Section ---
    const startY = 40;
    
    // Merchant Info (Left)
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Merchant Details", 14, startY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    const merchantName = details?.merchant?.name || 'N/A';
    const merchantId = details?.merchant?.id || 'N/A';
    doc.text(`Name: ${merchantName}`, 14, startY + 6);
    doc.text(`ID: ${merchantId}`, 14, startY + 12);

    // Rider/Logistics Info (Right)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text("Logistics / Rider", 110, startY);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    const riderName = details?.rider?.name || 'N/A';
    const riderId = details?.rider?.id || 'N/A';
    doc.text(`Rider: ${riderName}`, 110, startY + 6);
    doc.text(`Rider ID: ${riderId}`, 110, startY + 12);
    doc.text(`Type: ${currentTransaction.type}`, 110, startY + 18);

    // --- Financial Breakdwon Table ---
    const breakdown = details?.amountBreakdown;
    // Fallback logic if breakdown is missing (e.g. simple list view data)
    const baseAmount = Number(breakdown?.baseAmount || currentTransaction.amount || 0);
    const deliveryFee = Number(breakdown?.deliveryFee || 0);
    const commission = Number(breakdown?.commission || 0);
    const netAmount = Number(breakdown?.netAmount || (baseAmount - deliveryFee - commission));

    // Helper for safe currency string
    const formatSafe = (val: number) => formatCurrency(val, details?.currency || 'PKR');

    autoTable(doc, {
        startY: startY + 30,
        head: [['Description', 'Amount']],
        body: [
            ['Total Collected Amount (Base)', formatSafe(baseAmount)],
            ['Delivery Fee Deduction', `-${formatSafe(deliveryFee)}`],
            ['Platform Commission (5%)', `-${formatSafe(commission)}`],
            [{ content: 'Net Payable Amount', styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } }, { content: formatSafe(netAmount), styles: { fontStyle: 'bold', fillColor: [240, 253, 244] } }]
        ],
        theme: 'grid',
        headStyles: { fillColor: primaryColor as any, textColor: 255 },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 1: { halign: 'right' } }
    });

    // --- Footer ---
    const finalY = (doc as any).lastAutoTable?.finalY + 20 || 150;
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("This is a computer enabled receipt and does not require a physical signature.", 105, finalY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleString()}`, 105, finalY + 5, { align: 'center' });
    doc.text(`Status: ${currentTransaction.status.toUpperCase()}`, 105, finalY + 10, { align: 'center' });

    doc.save(`receipt_${currentTransaction.id}.pdf`);
  }

  const exportDetails = () => {
    // Breakdown values
    const breakdown = details?.amountBreakdown;
    const baseAmount = Number(breakdown?.baseAmount || currentTransaction.amount || 0);
    const deliveryFee = Number(breakdown?.deliveryFee || 0);
    const commission = Number(breakdown?.commission || 0);
    const netAmount = Number(breakdown?.netAmount || (baseAmount - deliveryFee - commission));

    // Generate CSV
    const headers = [
        'Transaction ID', 
        'Date', 
        'Type', 
        'Status', 
        'Rider Name', 
        'Rider ID',
        'Merchant Name', 
        'Merchant ID',
        'Payment Method', 
        'Reconciled',
        'Total Collected (Base)', 
        'Delivery Fee', 
        'Commission', 
        'Net Payable'
    ];
    
    const row = [
        currentTransaction.id,
        new Date(currentTransaction.date).toLocaleString(),
        currentTransaction.type,
        currentTransaction.status,
        `"${details?.rider?.name || 'N/A'}"`,
        `"${details?.rider?.id || 'N/A'}"`,
        `"${details?.merchant?.name || 'N/A'}"`,
        `"${details?.merchant?.id || 'N/A'}"`,
        details?.paymentMethod || (currentTransaction as any).method || 'N/A',
        details?.reconciled ? 'Yes' : 'No',
        baseAmount.toFixed(2),
        deliveryFee.toFixed(2),
        commission.toFixed(2),
        netAmount.toFixed(2)
    ];

    const csvContent = [headers.join(','), row.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transaction_details_${currentTransaction.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-[#f97316]">Transaction Details</h2>
            <p className="text-sm text-gray-500 mt-1">{currentTransaction.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          {isLoading ? (
             <div className="space-y-6 animate-pulse">
                <div className="h-20 bg-gray-100 rounded-xl"></div>
                <div className="h-40 bg-gray-100 rounded-xl"></div>
                <div className="grid grid-cols-2 gap-4">
                     <div className="h-24 bg-gray-100 rounded-xl"></div>
                     <div className="h-24 bg-gray-100 rounded-xl"></div>
                </div>
                <div className="h-32 bg-gray-100 rounded-xl"></div>
             </div>
          ) : (
            <>
            {/* Top Status Card */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                <div>
                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Transaction Type</p>
                <p className="text-lg font-bold text-gray-900">{currentTransaction.type}</p>
                </div>
                <div className="text-right">
                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Status</p>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                    currentTransaction.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                }`}>
                    {currentTransaction.status}
                </span>
                </div>
            </div>

            {/* Amount Breakdown */}
            {details?.amountBreakdown && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-[#f97316]" />
                    <h3 className="font-semibold text-gray-800">Amount Breakdown</h3>
                    </div>
                    <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Amount:</span>
                        <div className="text-right">
                           <span className="font-bold text-gray-900 block">{formatCurrency(details.amountBreakdown.baseAmount, details.currency)}</span>
                           {details.currency !== 'PKR' && <span className="text-xs text-gray-500 block">≈ {formatCurrency(details.amountBreakdown.baseAmountPKR, 'PKR')}</span>}
                        </div>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery Fee:</span>
                        <div className="text-right">
                           <span className="font-bold text-gray-900 block">{formatCurrency(details.amountBreakdown.deliveryFee, details.currency)}</span>
                           {details.currency !== 'PKR' && <span className="text-xs text-gray-500 block">≈ {formatCurrency(details.amountBreakdown.deliveryFeePKR, 'PKR')}</span>}
                        </div>
                    </div>
                    <div className="flex justify-between text-sm text-red-500">
                        <span className="font-medium">Commission (5%):</span>
                        <div className="text-right">
                            <span className="font-bold block">-{formatCurrency(details.amountBreakdown.commission, details.currency)}</span>
                            {details.currency !== 'PKR' && <span className="text-xs text-red-400 block">≈ -{formatCurrency(details.amountBreakdown.commissionPKR, 'PKR')}</span>}
                        </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200 flex justify-between text-lg">
                        <span className="font-bold text-gray-800">Net Amount:</span>
                        <div className="text-right">
                            <span className="font-bold text-[#f97316] block">{formatCurrency(details.amountBreakdown.netAmount, details.currency)}</span>
                             {details.currency !== 'PKR' && <span className="text-sm font-semibold text-orange-400 block">≈ {formatCurrency(details.amountBreakdown.netAmountPKR, 'PKR')}</span>}
                        </div>
                    </div>
                    </div>
                </div>
            )}

            {/* Info Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rider Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-[#f97316]" />
                    <h3 className="font-semibold text-gray-800 text-sm">Rider Information</h3>
                </div>
                <div className="space-y-1">
                    <p className="font-medium text-gray-900">{details?.rider?.name || transaction.rider}</p>
                    <p className="text-xs text-gray-500">{details?.rider?.id || 'N/A'}</p>
                </div>
                </div>
                {/* Merchant Info */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                    <Store className="w-4 h-4 text-[#f97316]" />
                    <h3 className="font-semibold text-gray-800 text-sm">Merchant Information</h3>
                </div>
                <div className="space-y-1">
                    <p className="font-medium text-gray-900">{details?.merchant?.name || transaction.merchant}</p>
                    <p className="text-xs text-gray-500">{details?.merchant?.id || 'N/A'}</p>
                </div>
                </div>
            </div>

            {/* Transaction Timeline */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-[#f97316]" />
                <h3 className="font-semibold text-gray-800">Transaction Timeline</h3>
                </div>
                <div className="relative pl-4 border-l-2 border-gray-200 space-y-8">
                {details?.timeline?.map((event, index) => (
                    <div key={index} className="relative">
                    {/* Dot */}
                    <div className={`absolute -left-[21px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        event.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                    }`}></div>
                    
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900">{event.label}</h4>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(event.time)}</p>
                    </div>
                    </div>
                )) || (
                    <p className="text-sm text-gray-500">Loading timeline...</p>
                )}
                </div>
            </div>

            {/* Payment Method */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                <div>
                <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4 text-[#f97316]" />
                    <h3 className="font-semibold text-gray-800 text-sm">Payment Method</h3>
                </div>
                <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded font-medium border border-green-200">
                    {details ? details.paymentMethod : transaction.method}
                </span>
                </div>
                {(details?.reconciled || transaction.reconciled) && (
                <div className="flex items-center gap-2 text-green-600 bg-white px-3 py-1.5 rounded-lg border border-green-100 shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-sm">Reconciled</span>
                </div>
                )}
            </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row gap-4">
          <button 
            onClick={generateReceipt}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </button>
          
          {/* Conditional Actions based on Status */}
          {details?.timeline.find(t => t.label === 'Submitted to Hub')?.status === 'pending' && details?.timeline.find(t => t.label === 'Amount Collected')?.status === 'completed' ? (
             <button 
                onClick={handleSubmitToHub}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm disabled:opacity-70"
             >
                {isSubmitting ? <span className="animate-spin mr-2">...</span> : <Check className="w-4 h-4 mr-2" />}
                Mark as Received at Hub
             </button>
          ) : (
             <button 
                onClick={handleReconcile}
                disabled={details?.reconciled || isSubmitting}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-white rounded-lg transition-colors font-medium text-sm shadow-sm disabled:opacity-50 ${details?.reconciled ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#22c55e] hover:bg-[#16a34a]'}`}
             >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {details?.reconciled ? 'Reconciled' : 'Mark as Reconciled'}
             </button>
          )}

          <button 
            onClick={exportDetails}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            Export Details
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
