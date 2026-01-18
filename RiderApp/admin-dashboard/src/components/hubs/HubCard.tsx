import { Hub } from '@/types/hub'
import { Building2, Bike, Users, Eye } from 'lucide-react'
import Link from 'next/link'

interface HubCardProps {
  hub: Hub
}

export default function HubCard({ hub }: HubCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
         <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-orange-200">
               <Building2 className="w-6 h-6" />
            </div>
            <div>
               <h3 className="font-bold text-gray-900 text-lg leading-tight">{hub.name}</h3>
               <p className="text-gray-500 text-xs font-medium mt-0.5">{hub.address}</p>
            </div>
         </div>
         <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full tracking-wide shadow-sm shadow-green-200/50">
            {hub.status}
         </span>
      </div>

      {/* Main Stats Blocks */}
      <div className="grid grid-cols-2 gap-4 mb-6">
         {/* Riders Block */}
         <div className="bg-green-500 rounded-xl p-4 text-white shadow-sm shadow-green-200">
            <div className="flex items-center gap-2 mb-2 opacity-90">
               <Bike className="w-4 h-4" />
               <span className="text-xs font-medium">Total Riders</span>
            </div>
            <div className="text-3xl font-bold mb-3">{hub.stats.totalRiders}</div>
            <div className="flex gap-4 text-[10px] opacity-90 font-medium">
               <div className="flex flex-col">
                  <span className="opacity-90 text-sm">Active:</span>
                  <span className="text-sm">{hub.details.activeTrucks || 0}</span>
               </div>
               <div className="flex flex-col">
                  <span className="opacity-90 text-sm">• Inactive:</span>
                  <span className="text-sm">{Number(hub.stats.totalRiders) - Number(hub.details.activeTrucks || 0)}</span>
               </div>
            </div>
         </div>

         {/* Employees Block */}
         <div className="bg-orange-400 rounded-xl p-4 text-white shadow-sm shadow-orange-200">
            <div className="flex items-center gap-2 mb-2 opacity-90">
               <Users className="w-4 h-4" />
               <span className="text-xs font-medium">Total Employees</span>
            </div>
            <div className="text-3xl font-bold mb-3">{hub.stats.totalEmployees}</div>
             <div className="flex gap-4 text-[10px] opacity-90 font-medium">
               <div className="flex flex-col">
                  <span className="opacity-90 text-sm">Staff:</span>
                  <span className="text-sm">{hub.stats.totalRiders}</span>
               </div>
               <div className="flex flex-col">
                  <span className="opacity-90 text-sm">• Admin:</span>
                  <span className="text-sm">{hub.manager ? 1 : 0}</span>
               </div>
            </div>
         </div>
      </div>

      {/* Parcel Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
         <div className="bg-blue-50 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
            <div className="text-blue-600 font-bold text-lg">{hub.stats.pendingParcels}</div>
            <div className="text-blue-900/60 text-[10px] font-medium">Pending</div>
         </div>
         <div className="bg-purple-50 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
            <div className="text-purple-600 font-bold text-lg">{hub.stats.activeParcels}</div>
            <div className="text-purple-900/60 text-[10px] font-medium">Exceptions</div>
         </div>
         <div className="bg-green-50 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
            <div className="text-green-600 font-bold text-lg">{hub.stats.deliveredParcels}</div>
            <div className="text-green-900/60 text-[10px] font-medium">Delivered</div>
         </div>
         <div className="bg-orange-50 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
            <div className="text-orange-600 font-bold text-lg">{hub.stats.failedParcels}</div>
            <div className="text-orange-900/60 text-[10px] font-medium">In Transit</div>
         </div>
      </div>

      {/* Manager Info */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
         <p className="text-gray-400 text-[10px] font-medium mb-1">Hub Manager</p>
         <div className="font-bold text-gray-900 text-sm mb-0.5">{hub.manager?.name || 'Unassigned'}</div>
         <div className="text-gray-500 text-xs">{hub.manager?.role || '-'}</div>
      </div>

      {/* Bottom Detail Grid */}
      <div className="flex justify-between items-end text-xs mb-6 px-1">
         <div>
            <span className="text-gray-500 block mb-1">Capacity</span>
            <span className="text-orange-500 font-bold text-sm block">{hub.details.capacity}</span>
         </div>
         <div className="text-center">
            <span className="text-gray-500 block mb-1">Active Routes</span>
            <span className="text-gray-900 font-bold text-sm block">{hub.details.activeTrucks}</span>
         </div>
         <div className="text-right">
            <span className="text-gray-500 block mb-1">Storage</span>
            <span className="text-gray-900 font-bold text-sm block">{hub.details.sqft}</span>
         </div>
      </div>

      {/* Action Button */}
      <Link href={`/hubs/${hub.id}`} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-xl text-sm transition-colors shadow-sm shadow-orange-200 flex items-center justify-center gap-2">
         <Eye className="w-4 h-4" />
         <span>View Full Details</span>
      </Link>
    </div>
  )
}
