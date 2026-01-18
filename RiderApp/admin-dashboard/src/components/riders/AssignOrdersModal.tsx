'use client'

import { useEffect, useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  Search, 
  Package, 
  MapPin, 
  Calendar,
  CheckCircle2,
  Loader2,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { Rider } from '@/types/rider'
import { Shipment } from '@/types/shipment'
import { useUnassignedShipments } from '@/hooks/useShipments'
import { useAssignShipments } from '@/hooks/useRiders'

interface AssignOrdersModalProps {
  isOpen: boolean
  onClose: () => void
  rider: Rider | null
  onAssignSuccess?: () => void
}

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function AssignOrdersModal({ isOpen, onClose, rider, onAssignSuccess }: AssignOrdersModalProps) {
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)
  
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [selectedShipments, setSelectedShipments] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch Shipments
  const { data, isLoading, error } = useUnassignedShipments({
    status: statusFilter,
    search: debouncedSearch,
    limit: 100
  })

  // Assign Mutation
  const assignMutation = useAssignShipments()

  const shipments: Shipment[] = data?.data?.shipments || []
  
  const filteredShipments = useMemo(() => {
    return shipments
  }, [shipments])

  const toggleShipment = (id: string) => {
    setSelectedShipments(prev => 
      prev.includes(id) 
        ? prev.filter(sid => sid !== id)
        : [...prev, id]
    )
  }

  const handleAssign = () => {
    if (selectedShipments.length === 0 || !rider) return
    
    assignMutation.mutate({ 
      riderId: rider.id, 
      shipmentIds: selectedShipments 
    }, {
      onSuccess: () => {
        toast.success(`Successfully assigned ${selectedShipments.length} shipments to ${rider?.name}`)
        setSelectedShipments([])
        onAssignSuccess?.()
        onClose()
      }
    })
  }

  if (!mounted || !isOpen || !rider) return null

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assign Shipments</h2>
            <p className="text-sm text-gray-500 mt-1">Select shipments to assign to <span className="font-semibold text-[#f97316]">{rider.name}</span></p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Shipment ID, Customer..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none whitespace-nowrap">
              <input 
                type="checkbox"
                checked={statusFilter === 'pending'}
                onChange={(e) => setStatusFilter(e.target.checked ? 'pending' : '')}
                className="rounded border-gray-300 text-[#f97316] focus:ring-[#f97316]"
              />
              Pending Orders
            </label>
            <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>
            <div className="flex items-center gap-2">
               <Filter className="w-4 h-4 text-gray-500" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#f97316] min-w-[140px]"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 text-[#f97316] animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
               <Package className="w-12 h-12 mb-3 opacity-50" />
               <p>Failed to load shipments.</p>
               <p className="text-xs mt-1">{(error as any).message}</p>
            </div>
          ) : filteredShipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package className="w-12 h-12 mb-3 text-gray-300" />
              <p>No shipments found</p>
              <p className="text-xs mt-1 text-gray-400">Try changing the filters</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100 sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <div className="w-4 h-4 border border-gray-300 rounded"></div>
                  </th>
                  <th className="px-6 py-3">Shipment Ref</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">COD Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Current Rider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredShipments.map((shipment) => (
                  <ShipmentRow
                    key={shipment.id}
                    shipment={shipment}
                    isSelected={selectedShipments.includes(shipment.id)}
                    riderId={rider.id}
                    onToggle={() => toggleShipment(shipment.id)}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Selected: <span className="font-bold text-gray-900">{selectedShipments.length}</span> shipments
          </div>
          <div className="flex gap-3">
             <button 
              onClick={onClose}
              disabled={assignMutation.isPending}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button 
              onClick={handleAssign}
              disabled={selectedShipments.length === 0 || assignMutation.isPending}
              className="px-6 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors font-medium text-sm shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4 mr-2" />
                  Assign Shipments
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  )
}

// ... imports

// ... AssignOrdersModal component ...

function ShipmentRow({ 
  shipment, 
  isSelected, 
  riderId, 
  onToggle 
}: { 
  shipment: Shipment
  isSelected: boolean
  riderId: string
  onToggle: () => void 
}) {
  // Handle both string ID and populated object for rider
  const currentRiderId = typeof shipment.rider === 'object' ? (shipment.rider as any)?.id : shipment.rider
  const isAlreadyAssigned = !!currentRiderId
  // We allow re-assignment, so we don't disable the row anymore
  const isAssignedToCurrentRider = isAlreadyAssigned && currentRiderId === riderId

  return (
    <tr 
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isSelected ? 'bg-orange-50/50' : ''}`}
      onClick={onToggle}
    >
      <td className="px-6 py-4">
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
          isSelected ? 'bg-[#f97316] border-[#f97316]' : 'border-gray-300 bg-white'
        }`}>
          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="font-semibold text-gray-900">{shipment.id}</div>
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <Calendar className="w-3 h-3 mr-1" />
          {new Date(shipment.date).toLocaleDateString()}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="font-medium text-gray-900">{shipment.customer?.name || 'Unknown'}</div>
        <div className="flex items-center text-xs text-gray-500 mt-1">
          <MapPin className="w-3 h-3 mr-1" />
          <span className="truncate max-w-[200px]">{shipment.customer?.address || 'No address'}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="font-semibold text-[#f97316]">${shipment.codAmount}</div>
        <div className="text-xs text-gray-500">{shipment.codStatus}</div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 capitalize">
          {shipment.status}
        </span>
      </td>
       <td className="px-6 py-4">
        {isAlreadyAssigned ? (
           <span className={`text-xs font-medium px-2 py-1 rounded ${
             isAssignedToCurrentRider 
               ? 'bg-orange-100 text-orange-700' 
               : 'bg-gray-100 text-gray-600'
           }`}>
              {isAssignedToCurrentRider ? 'Current Rider' : 'Assigned (Edit)'}
           </span>
        ) : (
           <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
            Unassigned
           </span>
        )}
      </td>
    </tr>
  )
}
