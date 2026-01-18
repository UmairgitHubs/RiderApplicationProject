'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  User,
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Package, 
  TrendingUp, 
  Clock, 
  Wallet, 
  Bike, 
  Edit, 
  Ban, 
  Star,
  Award,
  Loader2
} from 'lucide-react'
import { useRiderDetails, useSuspendRider } from '@/hooks/useRiders'
import { format } from 'date-fns'
import ConfirmationModal from '@/components/common/ConfirmationModal'

interface RiderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  rider: any // Initial rider object from list
  onEdit?: (rider: any) => void
  onAssign?: (rider: any) => void
}

export default function RiderDetailsModal({ isOpen, onClose, rider, onEdit, onAssign }: RiderDetailsModalProps) {
  const [isSuspendConfirmOpen, setIsSuspendConfirmOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: detailsData, isLoading } = useRiderDetails(rider?.id || '')
  const { mutate: suspendRider, isPending: isSuspending } = useSuspendRider()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen || !rider) return null

  // Use fetched details if available, otherwise fallback to rider prop (partial data)
  const profile = detailsData?.data?.profile || rider
  const stats = detailsData?.data?.stats || {
    activeOrders: rider.activeOrders || 0,
    completedOrders: rider.totalDeliveries || 0,
    totalEarnings: rider.earnings || 0,
    walletBalance: 0,
    rating: rider.rating || 0
  }
  const recentOrders = detailsData?.data?.recentOrders || []

  // Derived Values
  const joinedDate = profile.created_at ? format(new Date(profile.created_at), 'yyyy-MM-dd') : 'N/A'
  
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-[#f97316]">Rider Details</h2>
            <p className="text-sm text-gray-500 mt-1">{profile.id} - {profile.full_name || profile.name}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 relative min-h-[400px]">
          
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Top Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-gray-700" />
                    <h3 className="font-semibold text-gray-800">Personal Information</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{profile.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{profile.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{profile.location || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">Joined: </span>
                      <span className="font-medium text-gray-900">{joinedDate}</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Bike className="w-5 h-5 text-gray-700" />
                    <h3 className="font-semibold text-gray-800">Vehicle Information</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                     <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium text-gray-900">{profile.vehicle?.type || profile.rider?.vehicle_type || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">License Plate:</span>
                      <span className="font-medium text-gray-900">{profile.vehicle?.plate || profile.vehicle?.number || profile.rider?.vehicle_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hub:</span>
                      <span className="font-medium text-gray-900">{profile.hub || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-gray-500">Status:</span>
                       <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (profile.status === 'Active' || profile.is_active) ? 'bg-green-100 text-green-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {profile.status || (profile.is_active ? 'Active' : 'Inactive')}
                        </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div>
                 <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-[#f97316]" />
                  <h3 className="font-semibold text-gray-800">Performance Metrics</h3>
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    // Mocking metrics that are not yet in backend
                    { label: 'On-Time Delivery', value: '95%', color: 'text-green-600' },
                    { label: 'Success Rate', value: '98%', color: 'text-blue-600' },
                    { label: 'Avg Delivery Time', value: '28 min', color: 'text-orange-600' },
                    { label: 'Customer Rating', value: stats.rating?.toFixed(1) || '0.0', color: 'text-purple-600', icon: Star },
                  ].map((metric, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-gray-500 text-xs mb-1">{metric.label}</p>
                      <div className="flex items-center gap-1">
                        {metric.icon && <metric.icon className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                        <p className={`text-xl font-bold text-gray-900`}>{metric.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#0284c7] text-white rounded-xl p-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 opacity-10 transform translate-x-3 -translate-y-3">
                    <Package className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <Package className="w-8 h-8 mb-3 opacity-90" />
                    <p className="text-3xl font-bold">{stats.completedOrders}</p>
                    <p className="text-sm opacity-90 mt-1">Total Deliveries</p>
                  </div>
                </div>
                
                <div className="bg-[#22c55e] text-white rounded-xl p-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 opacity-10 transform translate-x-3 -translate-y-3">
                    <TrendingUp className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <TrendingUp className="w-8 h-8 mb-3 opacity-90" />
                    <p className="text-3xl font-bold">--</p>
                    <p className="text-sm opacity-90 mt-1">Today's Completed</p>
                  </div>
                </div>

                <div className="bg-[#f59e0b] text-white rounded-xl p-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 opacity-10 transform translate-x-3 -translate-y-3">
                    <Clock className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <Clock className="w-8 h-8 mb-3 opacity-90" />
                    <p className="text-3xl font-bold">{stats.activeOrders}</p>
                    <p className="text-sm opacity-90 mt-1">Active Deliveries</p>
                  </div>
                </div>

                <div className="bg-[#a855f7] text-white rounded-xl p-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 opacity-10 transform translate-x-3 -translate-y-3">
                    <Wallet className="w-24 h-24" />
                  </div>
                  <div className="relative z-10">
                    <Wallet className="w-8 h-8 mb-3 opacity-90" />
                    <p className="text-2xl font-bold">${stats.totalEarnings?.toLocaleString()}</p>
                    <p className="text-sm opacity-90 mt-1">Total Earnings</p>
                  </div>
                </div>
              </div>

              {/* Service Areas (Mocked for now as backend doesn't support it) */}
               <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-[#f97316]" />
                  <h3 className="font-semibold text-gray-800">Service Areas</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Manhattan', 'Brooklyn', 'Queens'].map((area) => (
                    <span key={area} className="px-4 py-1.5 bg-[#38bdf8] text-white rounded-full text-sm font-medium">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Recent Deliveries */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-[#f97316]" />
                  <h3 className="font-semibold text-gray-800">Recent Deliveries</h3>
                </div>
                {recentOrders.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                    {recentOrders.map((order: any, i: number) => (
                        <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                            <p className="font-medium text-gray-900 text-sm">#{order.tracking_number}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{order.pickup_address} → {order.delivery_address}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-[#f97316] text-sm">${order.cod_amount}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {format(new Date(order.created_at), 'MMM d, p')}
                            </p>
                        </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm italic">No recent deliveries found.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => onEdit?.(rider)}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors font-medium text-sm shadow-sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Rider
          </button>
          <button 
            onClick={() => onAssign?.(rider)}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-[#22c55e] text-white rounded-lg hover:bg-[#16a34a] transition-colors font-medium text-sm shadow-sm"
          >
            <Package className="w-4 h-4 mr-2" />
            Assign Orders
          </button>
          <button 
            onClick={() => setIsSuspendConfirmOpen(true)}
            disabled={isSuspending}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-white border border-[#ef4444] text-[#ef4444] rounded-lg hover:bg-red-50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSuspending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Ban className="w-4 h-4 mr-2" />}
            Suspend Rider
          </button>
        </div>

      </div>

      <ConfirmationModal
        isOpen={isSuspendConfirmOpen}
        onClose={() => setIsSuspendConfirmOpen(false)}
        onConfirm={() => {
            suspendRider(rider.id || profile.id, {
                onSuccess: () => {
                    setIsSuspendConfirmOpen(false)
                    onClose()
                }
            })
        }}
        title="Suspend Rider"
        description={`Are you sure you want to suspend ${profile.full_name || profile.name || 'this rider'}? They will not be able to accept any new orders.`}
        isLoading={isSuspending}
        confirmText="Suspend Rider"
        variant="danger"
      />
    </div>,
    document.body
  )
}
