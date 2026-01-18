'use client'

import React, { useCallback, useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { 
  Download, 
  Search, 
  RefreshCw, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
} from 'lucide-react'
import WalletStatsCard from '@/components/wallets/WalletStatsCard'
import WalletTable from '@/components/wallets/WalletTable'
import WalletMobileCard from '@/components/wallets/WalletMobileCard'
import WalletDetailsModal from '@/components/wallets/WalletDetailsModal'
import ExportWalletsModal from '@/components/wallets/ExportWalletsModal'
import { UserType, WalletUser } from '@/types/wallet'
import { useWallets } from '@/hooks/useWallets'
import { format } from 'date-fns'
import { useDebouncedCallback } from 'use-debounce'

export default function WalletsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Modal State
  const [selectedUser, setSelectedUser] = useState<WalletUser | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Get state from URL or defaults
  const activeTab = (searchParams.get('tab') as UserType) || 'Merchants'
  const page = Number(searchParams.get('page')) || 1
  const searchTerm = searchParams.get('search') || ''
  const limit = 10

  // Pending state for transitions
  const [isPending, startTransition] = useTransition()

  const { data, isLoading, isError, refetch, isRefetching } = useWallets({
    role: activeTab,
    search: searchTerm,
    page,
    limit,
  })

  // URL State helpers
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleTabChange = (tab: UserType) => {
     startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', tab)
        params.set('page', '1') // Reset to page 1
        router.push(pathname + '?' + params.toString())
     })
  }

  const handleSearch = useDebouncedCallback((term: string) => {
     startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (term) {
            params.set('search', term)
        } else {
            params.delete('search')
        }
        params.set('page', '1') // Reset to page 1
        router.push(pathname + '?' + params.toString())
     })
  }, 500)

  const handlePageChange = (newPage: number) => {
     startTransition(() => {
        router.push(pathname + '?' + createQueryString('page', newPage.toString()))
     })
  }


  const users = data?.users.map(u => ({
    ...u,
    lastTransactionDate: u.lastTransactionDate ? format(new Date(u.lastTransactionDate), 'yyyy-MM-dd') : 'No transactions'
  })) || []

  const stats = data?.stats || {
    totalBalance: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingAmount: 0
  }

  const handleViewDetails = (user: WalletUser) => {
    setSelectedUser(user)
  }

  return (
    <div className="space-y-6">
      <WalletDetailsModal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        user={selectedUser} 
      />
      
      <ExportWalletsModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        role={activeTab}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#f97316]">Wallet Management</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor and manage wallet balances for merchants, riders, and agents</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => refetch()}
            disabled={isLoading || isRefetching}
            className="flex items-center px-4 py-2 bg-white border border-[#f97316] text-[#f97316] rounded-lg hover:bg-orange-50 font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(isLoading || isRefetching) ? 'animate-spin' : ''}`} />
            Sync Wallets
          </button>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white rounded-xl w-fit shadow-sm border border-gray-100">
        {(['Merchants', 'Riders', 'Agents'] as UserType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab 
                ? 'bg-[#f97316] text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Cards - Skeleton if loading initial data, or show existing stats with opacity if refreshing */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${isPending ? 'opacity-70' : ''}`}>
         {isLoading && !data ? (
            Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-5 h-24 animate-pulse"></div>
            ))
         ) : (
            <>
                <WalletStatsCard 
                label="Total Balance" 
                value={`$${stats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Wallet}
                iconColor="text-[#f97316]"
                iconBg="bg-orange-50"
                borderColor="border-[#f97316]"
                />
                <WalletStatsCard 
                label="Total Deposits" 
                value={`$${stats.totalDeposits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={TrendingUp}
                iconColor="text-green-600"
                iconBg="bg-green-50"
                borderColor="border-green-600"
                />
                <WalletStatsCard 
                label="Total Withdrawals" 
                value={`$${stats.totalWithdrawals.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={TrendingDown}
                iconColor="text-red-500"
                iconBg="bg-red-50"
                borderColor="border-red-500"
                />
                <WalletStatsCard 
                label="Pending Amount" 
                value={`$${stats.pendingAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={Clock}
                iconColor="text-yellow-600"
                iconBg="bg-yellow-50"
                borderColor="border-yellow-500"
                />
            </>
         )}
      </div>

      {/* Controls & Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[400px]">
        
        {/* Search */}
        <div className="p-4 border-b border-gray-100">
           <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name, ID, or email..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
              defaultValue={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content State */}
        {isLoading && !data ? (
             <div className="p-12 space-y-4">
                 {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse w-full"></div>
                 ))}
             </div>
        ) : isError ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="text-red-500 mb-2 font-medium">Failed to load wallet data</div>
                <button onClick={() => refetch()} className="text-sm text-[#f97316] hover:underline">Try Again</button>
            </div>
        ) : (
            <div className={`transition-opacity duration-200 ${isPending || isRefetching ? 'opacity-60' : ''}`}>
                {/* Desktop Table View */}
                <WalletTable 
                  users={users} 
                  onViewDetails={handleViewDetails}
                />

                {/* Mobile Grid View */}
                <div className="xl:hidden divide-y divide-gray-100">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <WalletMobileCard 
                        key={user.id} 
                        user={user} 
                        onViewDetails={handleViewDetails}
                      />
                    ))
                  ) : (
                     <div className="p-8 text-center text-gray-500">
                        No users found.
                     </div>
                  )}
                </div>
                
                {/* Pagination Controls */}
                {data && data.pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                         <button 
                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
                         >
                            Previous
                         </button>
                         <span className="text-sm text-gray-600">
                             Page {data.pagination.page} of {data.pagination.totalPages}
                         </span>
                         <button 
                            onClick={() => handlePageChange(Math.min(data.pagination.totalPages, page + 1))}
                            disabled={page === data.pagination.totalPages}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 text-sm font-medium transition-colors"
                         >
                            Next
                         </button>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  )
}
