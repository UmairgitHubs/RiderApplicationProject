import { Eye, Edit2, Share2 } from 'lucide-react'
import { Shipment } from '@/types/shipment'

interface ShipmentMobileCardProps {
  shipment: Shipment
  onViewClick: (shipment: Shipment) => void
  onEditClick: (shipment: Shipment) => void
}

export default function ShipmentMobileCard({ shipment, onViewClick, onEditClick }: ShipmentMobileCardProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Out for Delivery': return 'bg-sky-400 text-white' 
      case 'At Hub': return 'bg-orange-400 text-white'
      case 'Delivered': return 'bg-green-500 text-white'
      case 'Created': return 'bg-gray-500 text-white'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-600'
      case 'Normal': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-4 space-y-4 cursor-pointer group"
      onClick={() => onViewClick(shipment)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-primary group-hover:underline">{shipment.id.slice(0, 15)}...</div>
          <div className="text-xs text-primary-400 mt-1">{shipment.id.slice(-4)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{shipment.date}</div>
        </div>
        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
          {shipment.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500 text-xs text-bold">Merchant</p>
          <div className="font-medium text-gray-900">{shipment.merchant.name}</div>
          <div className="text-xs text-gray-500">{shipment.merchant.code}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Customer</p>
          <div className="font-medium text-gray-900">{shipment.customer.name}</div>
          <div className="text-xs text-gray-500">{shipment.customer.address}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Rider</p>
          <div className={shipment.rider === 'Unassigned' ? 'text-gray-400 italic' : 'text-gray-900'}>
            {shipment.rider}
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Hub</p>
          <div className="text-gray-900">{shipment.hub}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">COD Amount</p>
          <div className="font-bold text-gray-900">${shipment.codAmount.toFixed(2)}</div>
          <div className="text-xs text-gray-500">{shipment.codStatus}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Priority</p>
          <span className={`inline-flex mt-1 px-2.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(shipment.priority)}`}>
            {shipment.priority}
          </span>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onViewClick(shipment);
          }}
          className="p-2 text-primary hover:bg-primary-50 rounded-md transition-colors"
        >
          <Eye className="w-5 h-5" />
        </button>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onEditClick(shipment);
          }}
          className="p-2 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        {shipment.status === 'Created' && (
            <button className="p-2 text-green-500 hover:bg-green-50 rounded-md transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
        )}
      </div>
    </div>
  )
}
