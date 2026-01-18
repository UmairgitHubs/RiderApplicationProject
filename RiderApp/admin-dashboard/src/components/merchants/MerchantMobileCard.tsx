import { Eye, Edit2, Star } from 'lucide-react'
import { Merchant } from '@/types/merchant'

interface MerchantMobileCardProps {
  merchant: Merchant
  onViewDetails: (merchant: Merchant) => void
}

export default function MerchantMobileCard({ merchant, onViewDetails }: MerchantMobileCardProps) {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-4 space-y-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onViewDetails(merchant)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-primary">{merchant.id}</div>
          <div className="font-medium text-gray-900 mt-1">{merchant.name}</div>
          <div className="text-xs text-gray-500">{merchant.location}</div>
        </div>
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          merchant.status === 'Active' ? 'bg-green-100 text-green-600' : 
          merchant.status === 'Suspended' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {merchant.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-3">
        <div>
          <p className="text-gray-500 text-xs">Owner</p>
          <div className="font-medium text-gray-900">{merchant.owner.name}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Wallet</p>
          <div className="font-medium text-gray-900">${merchant.wallet.toFixed(2)}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Orders (Active/Total)</p>
          <div className="font-medium text-gray-900">{merchant.activeOrders} / {merchant.totalOrders}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Rating</p>
          <div className="flex items-center font-medium text-gray-900">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
            {merchant.rating}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
        <button 
          className="p-2 text-primary hover:bg-primary-50 rounded-md transition-colors"
          onClick={(e) => { e.stopPropagation(); onViewDetails(merchant); }}
        >
          <Eye className="w-5 h-5" />
        </button>
        <button 
          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Edit2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
