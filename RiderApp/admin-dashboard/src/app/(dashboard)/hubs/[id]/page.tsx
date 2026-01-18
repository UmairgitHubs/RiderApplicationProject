'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { hubsApi } from '@/lib/api/hubs'
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Box, Users, Truck, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import EditHubModal from '@/components/hubs/EditHubModal'
import DeleteHubModal from '@/components/hubs/DeleteHubModal'

export default function HubDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const hubId = params.id as string
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const { data: hubData, isLoading, error } = useQuery({
    queryKey: ['hub', hubId],
    queryFn: () => hubsApi.getById(hubId),
    enabled: !!hubId
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (error || !hubData?.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Hub Not Found</h2>
        <p className="text-gray-500 mb-4">The hub you are looking for does not exist or has been removed.</p>
        <Link 
          href="/hubs"
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Back to Hubs
        </Link>
      </div>
    )
  }

  const hub = hubData.data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-2 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Hubs
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{hub.name}</h1>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
              hub.status === 'Operational' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {hub.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
            <MapPin className="w-4 h-4" />
            {hub.address}, {hub.city}
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <Edit className="w-4 h-4" />
            Edit Hub
          </button>
          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-xs font-medium mb-1">Total Riders</div>
                <div className="text-2xl font-bold text-gray-900">{hub.stats.totalRiders}</div>
                <div className="text-green-600 text-[10px] font-medium mt-1 flex items-center gap-1">
                    <Truck className="w-3 h-3" /> {hub.details.activeTrucks} Active
                </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-xs font-medium mb-1">In Transit</div>
                <div className="text-2xl font-bold text-orange-600">{hub.stats.failedParcels}</div> {/* Logic mapped to transit in controller */}
                <div className="text-gray-400 text-[10px] mt-1">Active Deliveries</div>
            </div>
             <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-xs font-medium mb-1">Exceptions</div>
                <div className="text-2xl font-bold text-purple-600">{hub.stats.activeParcels}</div>
                <div className="text-gray-400 text-[10px] mt-1">Needs Attention</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-xs font-medium mb-1">Delivered</div>
                <div className="text-2xl font-bold text-green-600">{hub.stats.deliveredParcels}</div>
                <div className="text-gray-400 text-[10px] mt-1">Completed</div>
            </div>
          </div>

          {/* Riders List Preview */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Assigned Riders</h3>
                <span className="text-xs text-gray-500">{hub.stats.totalRiders} Total</span>
            </div>
            <div className="divide-y divide-gray-100">
                {hub.ridersList && hub.ridersList.length > 0 ? (
                    hub.ridersList.map((rider: any) => (
                        <div key={rider.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    rider.is_online ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {rider.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">{rider.name}</h4>
                                    <p className="text-xs text-gray-500">{rider.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                                    rider.is_online ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {rider.is_online ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No riders assigned to this hub yet.
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* Info Right Column */}
        <div className="space-y-6">
          {/* Manager Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Hub Manager</h3>
            {hub.manager ? (
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {hub.manager.name.charAt(0)}
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">{hub.manager.name}</div>
                        <div className="text-xs text-gray-500 mb-3">{hub.manager.role}</div>
                        
                        <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-3.5 h-3.5" />
                                {hub.manager.phone || 'No phone'}
                             </div>
                             {/* Email if available later */}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No Manager Assigned
                    <button 
                        onClick={() => setIsEditModalOpen(true)}
                        className="block w-full mt-3 text-orange-600 text-xs font-medium hover:underline"
                    >
                        Assign Manager
                    </button>
                </div>
            )}
          </div>

          {/* Capacity Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Capacity & Storage</h3>
            <div className="space-y-4">
                <div>
                   <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Utilization</span>
                      <span className="font-medium text-gray-900">{hub.details.capacity}</span>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: hub.details.capacity }}
                      ></div>
                   </div>
                </div>
                
                <div className="flex justify-between items-center py-3 border-t border-gray-50">
                    <span className="text-gray-500 text-xs">Total Space</span>
                    <span className="text-gray-900 font-medium text-sm">{hub.details.sqft}</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      <EditHubModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        hub={hub} 
      />
      <DeleteHubModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        hubId={hub.id}
        hubName={hub.name}
      />
    </div>
  )
}
