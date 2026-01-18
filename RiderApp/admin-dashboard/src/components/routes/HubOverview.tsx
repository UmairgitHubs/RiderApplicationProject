'use client'

import { Warehouse, Building2, Loader2, RefreshCw } from 'lucide-react'
import { useHubs } from '@/hooks/useHubs'
import { motion } from 'framer-motion'

export default function HubOverview() {
  const { data: hubsData, isLoading, isRefetching, refetch } = useHubs()
  const hubs = hubsData?.data || []

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col justify-center items-center min-h-[300px] gap-4">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Hub Centers...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-[#ED7D31]" />
          <h2 className="text-lg font-semibold text-gray-800">Hub Centers Overview</h2>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all active:scale-95 text-gray-400"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {hubs.map((hub: any, index: number) => {
          // Split the name if it's long to match the image style (Cent ral)
          const nameWords = hub.name.split(' ')
          const firstName = nameWords[0]
          const restName = nameWords.slice(1).join(' ')

          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              key={hub.id || index} 
              className="relative bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 leading-tight">
                    <span className="block">{firstName}</span>
                    <span className="text-sm font-medium text-gray-500">{restName}</span>
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">{hub.city || 'District'}</p>
                </div>
                <div className="w-10 h-10 bg-[#ED7D31] rounded-xl flex items-center justify-center text-white shadow-sm shadow-orange-200">
                  <Warehouse className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Riders:</span>
                  <span className="text-gray-900 font-bold">{hub.stats?.totalRiders || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Active Routes:</span>
                  <span className="text-gray-900 font-bold">{hub.stats?.activeRoutes || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Capacity:</span>
                  <span className="text-[#ED7D31] font-bold">{hub.details?.capacity || '0%'}</span>
                </div>
              </div>
            </motion.div>
          )
        })}

        {hubs.length === 0 && (
          <div className="col-span-full border-2 border-dashed border-gray-100 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
            <Warehouse className="w-12 h-12 text-gray-200 mb-4" />
            <h3 className="font-bold text-gray-500 text-sm">No hubs centers available</h3>
          </div>
        )}
      </div>
    </div>
  )
}
