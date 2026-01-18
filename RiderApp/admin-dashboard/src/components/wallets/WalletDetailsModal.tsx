'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet,
  Calendar,
  Search,
  Download,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { walletApi } from '@/lib/api/wallet'
import { WalletUser, WalletDetailsResponse } from '@/types/wallet'
import { format } from 'date-fns'
import { toast } from 'sonner'
import ExportTransactionHistoryModal from '@/components/wallets/ExportTransactionHistoryModal'

interface WalletDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: WalletUser | null
}

export default function WalletDetailsModal({ isOpen, onClose, user }: WalletDetailsModalProps) {
  const [mounted, setMounted] = useState(false)
  const [page, setPage] = useState(1)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [isExportOpen, setIsExportOpen] = useState(false)
  
  const queryClient = useQueryClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll
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

  const { data: details, isLoading } = useQuery<WalletDetailsResponse>({
    queryKey: ['wallet-details', user?.id, page],
    queryFn: () => walletApi.getWalletDetails(user!.id, { page, limit: 10 }),
    enabled: !!user?.id && isOpen,
  })

  const updateStatusMutation = useMutation({
      mutationFn: ({ id, status }: { id: string, status: 'completed' | 'rejected' }) => 
          walletApi.updateTransactionStatus(id, status),
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['wallet-details', user?.id] })
          queryClient.invalidateQueries({ queryKey: ['wallets'] }) // Refresh lists too
          toast.success('Transaction updated successfully')
          setIsUpdating(null)
      },
      onError: () => {
          toast.error('Failed to update transaction')
          setIsUpdating(null)
      }
  })

  const handleUpdateStatus = (id: string, status: 'completed' | 'rejected') => {
      setIsUpdating(id)
      updateStatusMutation.mutate({ id, status })
  }

  if (!mounted || !isOpen || !user) return null

  // Helper to fallback to user data while loading details
  const currentBalance = details?.user.currentBalance ?? user.currentBalance
  
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header - Matches MerchantDetailsModal */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-[#f97316]">Wallet Details</h2>
            <p className="text-sm text-gray-500 mt-1">{user.id} - {user.name}</p>
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
            
            {/* Top Cards Section - Matches Merchant Style */}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Balance Card - Styled like Merchant Revenue Cards */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-[#f97316]">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-500 text-xs font-medium uppercase">Current Balance</p>
                        <Wallet className="w-4 h-4 text-[#f97316]" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>

                {/* Deposits Card */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between mb-2">
                         <p className="text-gray-500 text-xs font-medium uppercase">Total Deposits</p>
                         <div className="p-1 bg-green-50 rounded text-green-600">
                             <TrendingUp className="w-4 h-4" />
                         </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${user.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                </div>

                {/* Withdrawals Card */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-l-4 border-l-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-500 text-xs font-medium uppercase">Total Withdrawals</p>
                        <div className="p-1 bg-red-50 rounded text-red-500">
                             <ArrowDownLeft className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${user.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                </div>
            </div>

            {/* Transactions Section */}
            <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                   <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-[#f97316]" />
                        <h3 className="font-semibold text-gray-800">Transaction History</h3>
                   </div>
                   <div className="flex gap-2">
                         <button 
                            onClick={() => setIsExportOpen(true)}
                            className="px-4 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 flex items-center gap-2 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export
                         </button>
                   </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-3 whitespace-nowrap">ID & Type</th>
                                    <th className="px-6 py-3 whitespace-nowrap text-right">Amount</th>
                                    <th className="px-6 py-3 whitespace-nowrap text-center">Status</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Date</th>
                                    <th className="px-6 py-3 whitespace-nowrap">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20 ml-auto"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16 mx-auto"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-40"></div></td>
                                        </tr>
                                    ))
                                ) : details?.transactions && details.transactions.length > 0 ? (
                                    details.transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs text-gray-500 mb-0.5">#{tx.id.substring(0, 8)}</span>
                                                    <div className="flex items-center gap-1.5 font-medium text-gray-900">
                                                        {tx.type === 'credit' ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-red-500" />}
                                                        <span className="capitalize">{tx.category?.replace('_', ' ') || tx.type}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 font-bold text-right ${tx.type === 'credit' ? 'text-green-600' : 'text-gray-900'}`}>
                                                {tx.type === 'credit' ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {tx.status === 'pending' ? (
                                                     <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleUpdateStatus(tx.id, 'completed')}
                                                            disabled={isUpdating === tx.id}
                                                            className="p-1 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                                                            title="Approve Withdrawal"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleUpdateStatus(tx.id, 'rejected')}
                                                            disabled={isUpdating === tx.id}
                                                            className="p-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                                                            title="Reject Withdrawal"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                     </div>
                                                ) : (
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                        tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {tx.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap text-xs">
                                                <div className="font-medium text-gray-900">{format(new Date(tx.createdAt), 'MMM d, yyyy')}</div>
                                                <div className="text-gray-400">{format(new Date(tx.createdAt), 'h:mm a')}</div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate text-sm" title={tx.description || ''}>
                                                {tx.description || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                     {/* Pagination - Matching Footer Style */}
                    {details && details.pagination.totalPages > 1 && (
                        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50">
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors bg-white shadow-sm"
                            >
                                Previous
                            </button>
                            <span className="text-xs text-gray-600 font-medium">
                                Page {page} of {details.pagination.totalPages}
                            </span>
                            <button 
                                onClick={() => setPage(p => Math.min(details.pagination.totalPages, p + 1))}
                                disabled={page === details.pagination.totalPages}
                                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors bg-white shadow-sm"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>

        </div>

         {/* Optional Footer Action - Like Merchant Modal */}
         <div className="p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row gap-4">
             <button 
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
             >
                Close
             </button>
         </div>

      </div>
      
      {/* Export Modal */}
      <ExportTransactionHistoryModal 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        user={user}
      />
    </div>,
    document.body
  )
}
