import { Navigation, Clock, MapPin, ArrowUp, ArrowDown } from 'lucide-react'

interface RouteStatsProps {
  stats?: {
    activeRoutes: number;
    pendingRoutes: number;
    totalStops: number;
    pickupOrders: number;
    deliveryOrders: number;
  }
}

export default function RouteStats({ stats }: RouteStatsProps) {
  const data = [
    { 
      value: stats?.activeRoutes || 0, 
      label: 'Active Routes', 
      sub: 'In Progress', 
      icon: Navigation, 
      color: 'text-green-600', 
      bg: 'bg-green-50', 
      border: 'border-green-500' // Left border color
    },
    { 
      value: stats?.pendingRoutes || 0, 
      label: 'Pending Routes', 
      sub: 'Unassigned', 
      icon: Clock, 
      color: 'text-orange-500', 
      bg: 'bg-orange-50', 
      border: 'border-orange-400' 
    },
    { 
      value: stats?.totalStops || 0, 
      label: 'Total Stops', 
      sub: 'All Stops', 
      icon: MapPin, 
      color: 'text-sky-500', 
      bg: 'bg-sky-50', 
      border: 'border-sky-400' 
    },
    { 
      value: stats?.pickupOrders || 0, 
      label: 'Pickup Orders', 
      sub: 'To Collect', 
      icon: ArrowUp, 
      color: 'text-purple-600', 
      bg: 'bg-purple-50', 
      border: 'border-purple-500' 
    },
    { 
      value: stats?.deliveryOrders || 0, 
      label: 'Delivery Orders', 
      sub: 'To Deliver', 
      icon: ArrowDown, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50', 
      border: 'border-orange-500' 
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {data.map((stat, index) => {
        const Icon = stat.icon
        return (
          <div key={index} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${stat.border}`}>
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-700 leading-tight">{stat.label}</p>
              <p className="text-xs text-gray-400">{stat.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
