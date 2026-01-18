'use client'

import React, { useState } from 'react'
import { Plus, Download, Search, Loader2 } from 'lucide-react'
import HubStats from '@/components/hubs/HubStats'
import HubCard from '@/components/hubs/HubCard'
import { useQuery } from '@tanstack/react-query'
import { hubsApi } from '@/lib/api/hubs'
import AddHubModal from '@/components/hubs/AddHubModal'
import { toast } from 'sonner' 
import { useDebounce } from '@/hooks/use-debounce'
import ExportHubsModal from '@/components/hubs/ExportHubsModal'

export default function HubsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebounce(searchTerm, 500) // 500ms delay
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  const { data: hubsData, isLoading } = useQuery({
      queryKey: ['hubs', debouncedSearch], // Query depends on debounced value
      queryFn: () => hubsApi.getAll({ search: debouncedSearch }),
      // keepPreviousData: true
  })

  const hubs = hubsData?.data || [];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-orange-600">Hub Management</h1>
           <p className="text-gray-500 text-sm mt-1">
             Manage hub centers, riders, employees and distributions.
           </p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 font-medium transition-colors shadow-sm">
              <Download className="w-4 h-4" /> Export Report
           </button>
           <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors shadow-sm shadow-orange-200"
            >
              <Plus className="w-4 h-4" /> Add New Hub
           </button>
        </div>
      </div>

      {/* Stats */}
      <HubStats />

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 sm:text-sm shadow-sm"
          placeholder="Searching for hubs, city, etc..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Hubs List Grid */}
      {isLoading ? (
          <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>
      ) : hubs.length > 0 ? (
          <div className="space-y-4">
             {hubs.map((hub: any) => (
                 <HubCard key={hub.id} hub={hub} />
             ))}
          </div>
      ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
             <p className="text-gray-500">No hubs found matching your criteria.</p>
          </div>
      )}

      {/* Add Hub Modal */}
      <AddHubModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Export Hubs Modal */}
      <ExportHubsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        filters={{
            search: debouncedSearch
        }}
      />
    </div>
  )
}
