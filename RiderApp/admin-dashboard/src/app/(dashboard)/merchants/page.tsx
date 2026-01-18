'use client'

import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { 
  Download, 
  Search, 
  Plus, 
  Store, 
  CheckCircle2, 
  Ban, 
  Box, 
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import MerchantDetailsModal from '@/components/merchants/MerchantDetailsModal'
import MerchantStatsCard from '@/components/merchants/MerchantStatsCard'
import MerchantTable from '@/components/merchants/MerchantTable'
import MerchantMobileCard from '@/components/merchants/MerchantMobileCard'
import ExportMerchantsModal from '@/components/merchants/ExportMerchantsModal'
import AddMerchantModal from '@/components/merchants/AddMerchantModal'
import { Merchant } from '@/types/merchant'
import { useMerchants, useMerchantStats } from '@/hooks/useMerchants'

export default function MerchantsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [isAddMerchantOpen, setIsAddMerchantOpen] = useState(false)

  // URL Params
  const page = Number(searchParams.get('page')) || 1
  const search = searchParams.get('search') || ''

  // Local state for input
  const [searchVal, setSearchVal] = useState(search)

  // Sync valid search param to local state
  useEffect(() => {
    setSearchVal(search)
  }, [search])

  const debouncedSearch = useDebouncedCallback((value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('search', value)
    else params.delete('search')
    params.set('page', '1')
    router.replace(`${pathname}?${params.toString()}`)
  }, 500)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchVal(value)
    debouncedSearch(value)
  }

  // Fetch Merchants List
  const { data, isLoading, isFetching } = useMerchants({
    page,
    search,
    limit: 100
  })

  // Fetch Stats
  const { data: statsData } = useMerchantStats()

  const rawMerchants = data?.data?.merchants || []
  const merchants: Merchant[] = rawMerchants.map((m: any) => ({
    id: m.id,
    name: m.name,
    location: m.location,
    owner: { name: m.owner.name || 'Unknown' },
    category: m.category || 'Retail',
    activeOrders: m.activeOrders,
    totalOrders: m.totalOrders,
    rating: m.rating,
    wallet: m.wallet,
    status: m.status,
  }))

  const stats = [
    { label: 'Total Merchants', value: statsData?.data?.totalMerchants?.toString() || '0', icon: Store, color: 'text-primary', bg: 'bg-primary-50', border: 'border-l-4 border-primary' },
    { label: 'Active Merchants', value: statsData?.data?.activeMerchants?.toString() || '0', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', border: 'border-l-4 border-green-500' },
    { label: 'Suspended', value: statsData?.data?.suspendedMerchants?.toString() || '0', icon: Ban, color: 'text-red-500', bg: 'bg-red-50', border: 'border-l-4 border-red-500' },
    { label: 'Total Shipments', value: statsData?.data?.totalShipments?.toString() || '0', icon: Box, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-l-4 border-yellow-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Merchant Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and monitor all merchants and their shipments</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsExportOpen(true)}
            className="flex items-center px-4 py-2 bg-white border border-primary/20 text-primary rounded-lg hover:bg-primary-50 font-medium transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button 
             onClick={() => setIsAddMerchantOpen(true)}
             className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Merchant
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <MerchantStatsCard 
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 md:space-y-0 md:flex md:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by business name, merchant ID, owner..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            value={searchVal}
            onChange={handleSearchChange}
          />
        </div>
        <div className="grid grid-cols-1 md:w-[200px]">
          <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:border-primary">
            <option>All Categories</option>
          </select>
        </div>
      </div>

      <div className={isFetching ? 'opacity-70 transition-opacity duration-200' : 'opacity-100 transition-opacity duration-200'}>
        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {isLoading && merchants.length === 0 ? (
             <div className="text-center py-10">Loading...</div>
          ) : (
            merchants.map((merchant) => (
              <MerchantMobileCard 
                key={merchant.id} 
                merchant={merchant} 
                onViewDetails={setSelectedMerchant} 
              />
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block">
            <MerchantTable 
                merchants={merchants} 
                onViewDetails={setSelectedMerchant} 
            />
        </div>
        
        {!isLoading && merchants.length === 0 && (
            <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm">
            No merchants found matching your criteria.
            </div>
        )}
      </div>

      <MerchantDetailsModal 
        isOpen={!!selectedMerchant} 
        onClose={() => setSelectedMerchant(null)} 
        merchant={selectedMerchant} 
      />

      <ExportMerchantsModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        filters={{ search }}
      />
      
      <AddMerchantModal
        isOpen={isAddMerchantOpen}
        onClose={() => setIsAddMerchantOpen(false)}
      />
    </div>
  )
}
