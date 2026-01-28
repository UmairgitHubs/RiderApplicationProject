import { Eye, Edit2, Share2 } from 'lucide-react'
import { Shipment } from '@/types/shipment'

interface ShipmentTableProps {
  shipments: Shipment[]
  onViewClick: (shipment: Shipment) => void
  onEditClick?: (shipment: Shipment) => void
  onAssignClick?: (shipment: Shipment) => void
}

export default function ShipmentTable({ shipments, onViewClick, onEditClick, onAssignClick }: ShipmentTableProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Out for Delivery': 
      case 'in_transit': return 'bg-sky-400 text-white' 
      case 'At Hub': 
      case 'received_at_hub': return 'bg-purple-500 text-white' // Distinct color for At Hub
      case 'Delivered': 
      case 'delivered': return 'bg-green-500 text-white'
      case 'Created': 
      case 'pending': 
      case 'assigned': return 'bg-gray-500 text-white'
      case 'picked_up': return 'bg-orange-400 text-white' // Picked up usually means en route to hub or customer
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
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
        <tr>
          <th className="px-4 py-4">Tracking ID</th>
          <th className="px-4 py-4">Merchant</th>
          <th className="px-4 py-4">Customer</th>
          <th className="px-4 py-4">Rider</th>
          <th className="px-4 py-4">Hub</th>
          <th className="px-4 py-4">Status</th>
          <th className="px-4 py-4">COD Amount</th>
          <th className="px-4 py-4">Priority</th>
          <th className="px-4 py-4">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {shipments.map((shipment) => (
          <tr 
            key={shipment.id} 
            className="hover:bg-gray-50 transition-colors cursor-pointer group"
            onClick={() => onViewClick(shipment)}
          >
            <td className="px-4 py-4 align-top">
              <div className="font-bold text-primary w-24 leading-snug break-words group-hover:underline">
                {shipment.id.replace(/-/g, '-\u200B')}
              </div>
              <div className="text-xs text-gray-400 mt-1">{shipment.date}</div>
            </td>
            <td className="px-4 py-4 align-top">
              <div className="font-medium text-gray-900">{shipment.merchant.name}</div>
              <div className="text-xs text-gray-500">{shipment.merchant.code}</div>
            </td>
            <td className="px-4 py-4 align-top">
              <div className="font-medium text-gray-900">{shipment.customer.name}</div>
              <div className="text-xs text-gray-500">{shipment.customer.address}</div>
            </td>
            <td className="px-4 py-4 align-top">
              <div className="flex items-center">
                {shipment.rider === 'Unassigned' || !shipment.rider ? (
                  <span className="text-gray-400 italic">Unassigned</span>
                ) : (
                  <span className="text-gray-900">{shipment.rider}</span>
                )}
              </div>
            </td>
            <td className="px-4 py-4 align-top">
              <div className="text-gray-700">
                {shipment.hub}
              </div>
            </td>
            <td className="px-4 py-4 align-top">
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold text-center w-fit whitespace-nowrap ${getStatusColor(shipment.status)}`}>
                {shipment.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </td>
            <td className="px-4 py-4 align-top">
              <div className="font-bold text-gray-900">${shipment.codAmount?.toFixed(2) || '0.00'}</div>
              <div className="text-xs text-gray-500">{shipment.codStatus}</div>
            </td>
            <td className="px-4 py-4 align-top">
              <span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(shipment.priority)}`}>
                {shipment.priority}
              </span>
            </td>
            <td className="px-4 py-4 align-top" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewClick(shipment);
                  }}
                  className="p-1.5 text-primary hover:bg-primary-50 rounded-md transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {onEditClick && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditClick(shipment);
                    }}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {shipment.status === 'received_at_hub' && onAssignClick && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onAssignClick(shipment);
                        }}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors font-medium text-xs flex items-center gap-1"
                        title="Assign Rider"
                    >
                      <Share2 className="w-4 h-4" /> 
                      <span className="hidden xl:inline">Dispatch</span>
                    </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
