'use client'

import React from 'react'
import { Plus, Download, Zap, SlidersHorizontal, Loader2} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import RouteStats from '@/components/routes/RouteStats'
import HubOverview from '@/components/routes/HubOverview'
import RouteCard from '@/components/routes/RouteCard'
import AvailableRiders from '@/components/routes/AvailableRiders'
import DailySummary from '@/components/routes/DailySummary'
import CreateRouteModal from '@/components/routes/CreateRouteModal'
import ExportRoutesModal from '@/components/routes/ExportRoutesModal'
import { routesApi } from '@/lib/api/routes'
import { Route } from '@/types/route'
import { AnimatePresence } from 'framer-motion'


export default function RouteManagementPage() {
  const queryClient = useQueryClient()

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false)
  
  // Fetch Routes
  const { data: routesData, isLoading: isLoadingRoutes } = useQuery({
    queryKey: ['routes'],
    queryFn: () => routesApi.getAll(),
  })
  const routes = (routesData?.data || []) as Route[]

  // Fetch Stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['route-stats'],
    queryFn: () => routesApi.getStats(),
  })
  const stats = statsData?.data

  // Optimize Mutation
  const optimizeMutation = useMutation({
    mutationFn: () => routesApi.optimize(),
    onSuccess: (data: any) => {
      toast.success(data.message || 'Optimization completed successfully')
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['route-stats'] })
    },
    onError: () => {
      toast.error('Failed to start optimization')
    }
  })

  // Mock Export - now using modal
  const handleExport = () => {
    setIsExportModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        <div>
           <h1 className="text-2xl font-bold text-orange-500">Route Planning &</h1>
           <h1 className="text-2xl font-bold text-orange-500 mb-2">Management</h1>
           <p className="text-gray-500 text-sm max-w-lg">
             Optimize delivery routes with pickup and delivery orders from hub centers
           </p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleExport}
             className="h-[110px] w-[110px] flex flex-col items-center justify-center bg-white border-2 border-orange-500 text-orange-500 rounded-2xl hover:bg-orange-50 font-bold text-sm leading-tight shadow-sm transition-transform active:scale-95 gap-2"
           >
              <Download className="w-6 h-6" />
              <span className="text-center">Export<br/>Routes</span>
           </button>
           <button 
             onClick={() => optimizeMutation.mutate()}
             disabled={optimizeMutation.isPending}
             className="h-[110px] w-[110px] flex flex-col items-center justify-center bg-green-500 text-white rounded-2xl hover:bg-green-600 font-bold text-sm leading-tight shadow-sm shadow-green-200 transition-transform active:scale-95 gap-2 disabled:opacity-50"
           >
              {optimizeMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
              <span className="text-center">Auto-<br/>Optimize All</span>
           </button>
           <button 
             onClick={() => setIsCreateModalOpen(true)}
             className="h-[110px] w-[110px] flex flex-col items-center justify-center bg-orange-500 text-white rounded-2xl hover:bg-orange-600 font-bold text-sm leading-tight shadow-sm shadow-orange-200 transition-transform active:scale-95 gap-2"
           >
              <Plus className="w-6 h-6" />
              <span className="text-center">Create<br/>New<br/>Route</span>
           </button>
        </div>
      </div>

      {/* Top Stats */}
      <RouteStats stats={stats} />

      {/* Hub Overview Section */}
      <HubOverview />

      {/* All Routes Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[300px]">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="font-bold text-gray-900 text-lg">All Routes</h3>
                <span className="text-gray-400 text-sm">({routes.length})</span>
            </div>
            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
                <SlidersHorizontal className="w-4 h-4" /> Filter by Hub
            </button>
        </div>
        
        {isLoadingRoutes ? (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        ) : (
            <div className="space-y-4">
                {routes.length > 0 ? (
                    routes.map(route => (
                        <RouteCard key={route.id} route={route} />
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        No active routes found. Create a new route to get started.
                    </div>
                )}
            </div>
        )}
      </div>

      <AvailableRiders />
      <DailySummary stats={stats} />

      {/* Modals */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateRouteModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)} 
          />
        )}
        {isExportModalOpen && (
          <ExportRoutesModal 
            isOpen={isExportModalOpen} 
            onClose={() => setIsExportModalOpen(false)} 
            filters={{
              hubId: '', // Future: allow filtering by hub in UI first
              status: ''
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

