import { Eye, Edit2, Trash2, Star } from 'lucide-react'
import { Rider } from '@/types/rider'

interface RiderTableProps {
  riders: Rider[]
  onViewDetails: (rider: Rider) => void
  onEdit?: (rider: Rider) => void
  onDelete?: (rider: Rider) => void
}

export default function RiderTable({ riders, onViewDetails, onEdit, onDelete }: RiderTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden md:block">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
          <tr>
            <th className="px-4 py-4">Rider ID</th>
            <th className="px-4 py-4">Name</th>
            <th className="px-4 py-4">Hub</th>
            <th className="px-4 py-4">Vehicle</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4">Active Orders</th>
            <th className="px-4 py-4">Rating</th>
            <th className="px-4 py-4">Earnings</th>
            <th className="px-4 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {riders.map((rider) => (
            <tr 
              key={rider.id} 
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewDetails(rider)}
            >
              <td className="px-4 py-4 font-semibold text-primary">
                {rider.id}
              </td>
              <td className="px-4 py-4 align-top">
                <div className="font-medium text-gray-900">{rider.name}</div>
                <div className="text-xs text-gray-500">{rider.phone}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="font-medium text-gray-900 text-sm mt-1">{rider.hub}</div>
                <div className="text-xs text-gray-500">{rider.location}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="font-medium text-gray-900 text-sm mt-1">{rider.vehicle.type}</div>
                <div className="text-xs text-gray-500">{rider.vehicle.plate}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                  rider.status === 'Active' ? 'bg-green-100 text-green-600' : 
                  'bg-red-100 text-red-600'
                }`}>
                  {rider.status}
                </span>
                {rider.onlineStatus === 'Online' && (
                  <span className="ml-2 inline-flex items-center text-xs text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                    Online
                  </span>
                )}
              </td>
              <td className="px-4 py-4 align-top">
                <div className="text-gray-900 mt-1">
                    {rider.activeOrders}
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="text-gray-900 font-medium">{rider.rating.toFixed(1)}</span>
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="font-medium text-gray-900 mt-1">${rider.earnings.toLocaleString()}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex items-center gap-2 mt-0.5">
                  <button 
                    className="p-1.5 text-primary hover:bg-primary-50 rounded-md transition-colors"
                    onClick={(e) => { e.stopPropagation(); onViewDetails(rider); }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    onClick={(e) => { e.stopPropagation(); onEdit?.(rider); }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                   <button 
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    onClick={(e) => { e.stopPropagation(); onDelete?.(rider); }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
