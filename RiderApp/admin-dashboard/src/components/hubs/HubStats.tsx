import { Warehouse, Users, UserCheck, Package } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { hubsApi } from '@/lib/api/hubs'

export default function HubStats() {
  const { data: statsData } = useQuery({
    queryKey: ['hubs-stats'],
    queryFn: () => hubsApi.getStats(),
  })

  const stats = statsData?.data || {
      totalHubs: 0,
      totalRiders: 0,
      totalEmployees: 0,
      totalParcels: 0
  }

  const statCards = [
    { label: 'Total\nHubs', value: stats.totalHubs, icon: Warehouse, color: 'text-orange-500', bg: 'bg-orange-100' },
    { label: 'Total\nRiders', value: stats.totalRiders, icon: Users, color: 'text-green-500', bg: 'bg-green-100' },
    { label: 'Total\nEmployees', value: stats.totalEmployees, icon: UserCheck, color: 'text-orange-400', bg: 'bg-orange-50' },
    { label: 'Total\nParcels', value: stats.totalParcels, icon: Package, color: 'text-sky-500', bg: 'bg-sky-100' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
             <div className="flex flex-col gap-1">
                <span className="text-gray-500 text-xs font-medium whitespace-pre-line leading-tight">{stat.label}</span>
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
             </div>
             <div className={`w-10 h-10 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
             </div>
          </div>
        )
      })}
    </div>
  )
}
