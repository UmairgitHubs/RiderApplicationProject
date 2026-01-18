import Skeleton from '@/components/common/Skeleton'
import { Bike, Store, Warehouse } from 'lucide-react'

interface SummaryCardsProps {
  stats: {
    active_riders?: number
    active_merchants?: number
    active_hubs?: number
  }
  isLoading?: boolean
}

export default function SummaryCards({ stats, isLoading }: SummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 h-[104px] flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Riders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active_riders || 0}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Bike className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Merchants</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active_merchants || 0}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
            <Store className="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Hubs</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active_hubs || 0}</p>
          </div>
          <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
            <Warehouse className="h-6 w-6 text-yellow-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
