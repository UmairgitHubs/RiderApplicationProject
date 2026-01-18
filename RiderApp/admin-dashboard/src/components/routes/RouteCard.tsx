'use client'

import React, { useState } from 'react'
import { MoreVertical, Package, Truck, Navigation, Edit, Trash2 } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Route } from '@/types/route'
import DeleteRouteModal from './DeleteRouteModal'
import CreateRouteModal from './CreateRouteModal'

interface RouteCardProps {
  route: Route
}

export default function RouteCard({ route }: RouteCardProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
             <div className="flex items-center gap-3 mb-1.5">
               <h3 className="text-lg font-bold text-gray-900 leading-tight">{route.name}</h3>
               <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest ${
                 route.status === 'Active' ? 'bg-green-50 text-green-600' : 
                 route.status === 'Completed' ? 'bg-blue-50 text-blue-600' : 
                 'bg-orange-50 text-[#ED7D31]'
               }`}>
                 {route.status}
               </span>
             </div>
             <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
               <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {route.rider?.name || 'Unassigned'}</span>
               <span className="text-gray-200">|</span>
               <span className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> On Route</span>
             </div>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="w-10 h-10  rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-all">
                 <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content 
                className="min-w-[160px] bg-white rounded-2xl p-2 shadow-2xl border border-gray-100 z-[1000] animate-in fade-in zoom-in-95 duration-150 origin-top-right"
                sideOffset={5}
                align="end"
              >
                <DropdownMenu.Item 
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-600 outline-none cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <Edit className="w-4 h-4 text-blue-500" />
                  EDIT ROUTE
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="h-px bg-gray-50 my-1" />
                <DropdownMenu.Item 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-red-500 outline-none cursor-pointer hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  DELETE ROUTE
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Order Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-purple-50/50 rounded-2xl p-4 border border-purple-100/50">
             <div className="text-[10px] text-purple-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-purple-600" /> Pickup Orders
             </div>
             <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">{route.pickupCount || 0}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Stops</span>
             </div>
          </div>
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
             <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-blue-600" /> Delivery Orders
             </div>
             <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">{route.deliveryCount || 0}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Stops</span>
             </div>
          </div>
        </div>

        {/* Route Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-t border-gray-50">
           <div className="space-y-1">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest block">Distance</span>
              <span className="text-sm font-black text-slate-900">{route.distance}</span>
           </div>
           <div className="space-y-1">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest block">Est. Time</span>
              <span className="text-sm font-black text-slate-900">{route.estTime}</span>
           </div>
           <div className="space-y-1">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest block">Start</span>
              <span className="text-sm font-black text-slate-900 truncate block">{route.startPoint}</span>
           </div>
           <div className="space-y-1">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest block">Total COD</span>
              <span className="text-sm font-black text-[#ED7D31]">
                 ${typeof route.totalCod === 'number' ? route.totalCod.toLocaleString() : '0.00'}
              </span>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-2 pt-2">
           <div className="flex justify-between text-[10px] mb-2">
             <span className="text-gray-400 font-black uppercase tracking-widest">Route Progress</span>
             <span className="text-slate-900 font-black">{route.progress}%</span>
           </div>
           <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  route.status === 'Active' ? 'bg-green-500' : 
                  route.status === 'Completed' ? 'bg-blue-500' :
                  'bg-orange-500'
                }`} 
                style={{ width: `${route.progress}%` }}
              />
           </div>
        </div>
      </div>

      {/* Modals */}
      <DeleteRouteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        routeId={route.id} 
        routeName={route.name} 
      />
      
      {/* For now we reuse CreateRouteModal, we'll need to update it to handle routeId for editing */}
      <CreateRouteModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        routeId={route.id}
      />
    </>
  )
}
