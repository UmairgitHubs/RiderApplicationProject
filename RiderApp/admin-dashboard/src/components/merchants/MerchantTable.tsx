import { Eye, Edit2, Star } from 'lucide-react'
import { Merchant } from '@/types/merchant'

interface MerchantTableProps {
  merchants: Merchant[]
  onViewDetails: (merchant: Merchant) => void
}

export default function MerchantTable({ merchants, onViewDetails }: MerchantTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden md:block">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
          <tr>
            <th className="px-4 py-4">Merchant ID</th>
            <th className="px-4 py-4">Business Name</th>
            <th className="px-4 py-4">Owner</th>
            <th className="px-4 py-4">Category</th>
            <th className="px-4 py-4">Active Orders</th>
            <th className="px-4 py-4">Total Orders</th>
            <th className="px-4 py-4">Rating</th>
            <th className="px-4 py-4">Wallet</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {merchants.map((merchant) => (
            <tr 
              key={merchant.id} 
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewDetails(merchant)}
            >
              <td className="px-4 py-4 font-semibold text-primary">
                {merchant.id}
              </td>
              <td className="px-4 py-4 align-top">
                <div className="font-medium text-gray-900">{merchant.name}</div>
                <div className="text-xs text-gray-500">{merchant.location}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="font-medium text-gray-900 text-sm mt-1">{merchant.owner.name}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-medium mt-1">
                  {merchant.category}
                </span>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="text-gray-900 mt-1">{merchant.activeOrders}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="text-gray-900 mt-1">{merchant.totalOrders}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex items-center mt-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                  <span className="text-gray-900 font-medium">{merchant.rating}</span>
                </div>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="font-medium text-gray-900 mt-1">${merchant.wallet.toFixed(2)}</div>
              </td>
              <td className="px-4 py-4 align-top">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                  merchant.status === 'Active' ? 'bg-green-100 text-green-600' : 
                  merchant.status === 'Suspended' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {merchant.status}
                </span>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex items-center gap-2 mt-0.5">
                  <button 
                    className="p-1.5 text-primary hover:bg-primary-50 rounded-md transition-colors"
                    onClick={(e) => { e.stopPropagation(); onViewDetails(merchant); }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit2 className="w-4 h-4" />
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
