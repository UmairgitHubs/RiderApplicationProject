'use client'

import { useState } from 'react'
import { 
  Download, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  TrendingUp,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '@/lib/api/payments'
import TransactionDetailsModal from '@/components/payments/TransactionDetailsModal'
import PaymentStatsCard from '@/components/payments/PaymentStatsCard'
import PaymentTable from '@/components/payments/PaymentTable'
import PaymentMobileCard from '@/components/payments/PaymentMobileCard'
import ExportPaymentsModal from '@/components/payments/ExportPaymentsModal'
import { Transaction } from '@/types/payment'
import { useDebounce } from '@/hooks/use-debounce'

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [exportType, setExportType] = useState<'transactions' | 'reconciliation' | null>(null)

  // Fetch Stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['payments-stats'],
    queryFn: () => paymentsApi.getStats()
  })

  // Fetch Payments
  const { data: paymentsData, isLoading: isLoadingPayments } = useQuery({
    queryKey: ['payments-list', debouncedSearch],
    queryFn: () => paymentsApi.getAll({ search: debouncedSearch })
  })

  const stats = statsData?.data ? [
    { 
      label: 'Total Transactions', 
      value: statsData.data.totalTransactions.toString(), 
      icon: FileText, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      border: 'border-l-4 border-blue-600'
    },
    { 
      label: 'Completed', 
      value: statsData.data.completed.toString(), 
      icon: CheckCircle2, 
      color: 'text-green-600', 
      bg: 'bg-green-50',
      border: 'border-l-4 border-green-600'
    },
    { 
      label: 'Pending', 
      value: statsData.data.pending.toString(), 
      icon: Clock, 
      color: 'text-orange-500', 
      bg: 'bg-orange-50',
      border: 'border-l-4 border-orange-500' 
    },
    { 
      label: 'COD Collections', 
      value: statsData.data.codCollections.toString(), 
      icon: DollarSign, 
      color: 'text-cyan-600', 
      bg: 'bg-cyan-50',
      border: 'border-l-4 border-cyan-600' 
    },
    { 
      label: 'Reconciled', 
      value: statsData.data.reconciled.toString(), 
      icon: CheckCircle2, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50',
      border: 'border-l-4 border-purple-600' 
    },
    { 
      label: 'Total Amount', 
      value: `PKR ${statsData.data.totalAmount.toLocaleString()}`, 
      icon: TrendingUp, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      border: 'border-l-4 border-indigo-600' 
    },
  ] : []

  const transactions = paymentsData?.data || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Payments & COD Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track all payment transactions, COD collections, and reconciliation</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setExportType('reconciliation')}
            className="flex items-center px-4 py-2 bg-white border border-primary text-primary rounded-lg hover:bg-primary-50 font-medium transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Reconciliation Report
          </button>
          <button 
            onClick={() => setExportType('transactions')}
            className="flex items-center px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Transactions
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {isLoadingStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
              ))}
          </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map((stat, index) => (
            <PaymentStatsCard 
                key={index}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                bg={stat.bg}
                border={stat.border}
            />
            ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by transaction ID, tracking ID, rider, merchant..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoadingPayments ? (
           <div className="flex justify-center py-12">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
           </div>
      ) : (
        <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {transactions.map((txn: Transaction) => (
                <PaymentMobileCard 
                    key={txn.id} 
                    transaction={txn} 
                    onViewDetails={setSelectedTransaction} 
                />
                ))}
            </div>

            {/* Desktop Table */}
            <PaymentTable 
                transactions={transactions} 
                onViewDetails={setSelectedTransaction} 
            />
        </>
      )}

      <TransactionDetailsModal 
        isOpen={!!selectedTransaction} 
        onClose={() => setSelectedTransaction(null)} 
        transaction={selectedTransaction} 
      />

      <ExportPaymentsModal 
        isOpen={!!exportType}
        onClose={() => setExportType(null)}
        filters={{ search: searchTerm }}
        type={exportType || 'transactions'}
      />
    </div>
  )
}
