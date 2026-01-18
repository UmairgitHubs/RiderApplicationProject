import { Eye, Edit2, Trash2, Star } from 'lucide-react'
import { Rider } from '@/types/rider'

interface RiderMobileCardProps {
  rider: Rider
  onViewDetails: (rider: Rider) => void
  onEdit?: (rider: Rider) => void
}

export default function RiderMobileCard({ rider, onViewDetails, onEdit }: RiderMobileCardProps) {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-4 space-y-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onViewDetails(rider)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-primary">{rider.id}</div>
          <div className="font-medium text-gray-900 mt-1">{rider.name}</div>
          <div className="text-xs text-gray-500">{rider.vehicle.type} • {rider.vehicle.plate}</div>
        </div>
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          rider.status === 'Active' ? 'bg-green-100 text-green-600' : 
          rider.status === 'On Break' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {rider.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-3">
        <div>
          <p className="text-gray-500 text-xs">Hub</p>
          <div className="font-medium text-gray-900">{rider.hub}</div>
        </div>
         <div>
          <p className="text-gray-500 text-xs">Active Orders</p>
          <div className="font-medium text-gray-900">{rider.activeOrders}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Earnings</p>
          <div className="font-medium text-gray-900">${rider.earnings.toFixed(2)}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Rating</p>
          <div className="flex items-center font-medium text-gray-900">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
            {rider.rating}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
        <button 
          className="p-2 text-primary hover:bg-primary-50 rounded-md transition-colors"
          onClick={(e) => { e.stopPropagation(); onViewDetails(rider); }}
        >
          <Eye className="w-5 h-5" />
        </button>
        <button 
          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
          onClick={(e) => { e.stopPropagation(); onEdit?.(rider); }}
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button 
          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
