'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, MapPin, Truck, Package, Search, Loader2, Save, AlertCircle, Building2, User } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { routesApi } from '@/lib/api/routes'
import { hubsApi } from '@/lib/api/hubs'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Modern Validation Schema using Zod
const routeSchema = z.object({
  name: z.string().min(3, 'Route name must be at least 3 characters'),
  hubId: z.string().uuid('Please select a valid hub'),
  riderId: z.string().uuid('').optional().nullable(),
  stops: z.array(z.object({
    shipmentId: z.string().uuid(),
    type: z.enum(['pickup', 'delivery', 'waypoint']),
    location: z.string().min(1, 'Location is required'),
    latitude: z.any().optional(),
    longitude: z.any().optional(),
    order: z.number()
  })).min(1, 'At least one stop is required')
})

type RouteFormValues = z.infer<typeof routeSchema>

interface CreateRouteModalProps {
  isOpen: boolean
  onClose: () => void
  routeId?: string // Optional for editing
}

/**
 * CreateRouteModal - A premium, high-fidelity route planning interface.
 * Supports both creating and editing routes with pixel-perfect responsiveness.
 */
export default function CreateRouteModal({ isOpen, onClose, routeId }: CreateRouteModalProps) {
  const [mounted, setMounted] = useState(false)
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setMounted(true)
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // React Hook Form with Zod
  const { 
    register, 
    handleSubmit, 
    watch, 
    control, 
    reset,
    getValues,
    formState: { errors, isSubmitting } 
  } = useForm<RouteFormValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: '',
      hubId: '',
      riderId: null,
      stops: []
    }
  })

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'stops'
  })

  const selectedHubId = watch('hubId')
  const selectedStops = watch('stops')

  // Data Fetching
  const { data: routeData, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['route', routeId],
    queryFn: () => routesApi.getById(routeId!),
    enabled: !!routeId && isOpen
  })

  const { data: hubsData } = useQuery({
    queryKey: ['hubs-list'],
    queryFn: () => hubsApi.getAll(),
    enabled: isOpen
  })
  const hubs = hubsData?.data || []

  const { data: ridersData } = useQuery({
    queryKey: ['available-riders', selectedHubId],
    queryFn: () => routesApi.getAvailableRiders({ hubId: selectedHubId }),
    enabled: !!selectedHubId && isOpen
  })
  const riders = ridersData?.data || []

  const { data: shipmentsData, isLoading: isLoadingShipments } = useQuery({
    queryKey: ['unassigned-shipments', selectedHubId],
    queryFn: () => routesApi.getUnassignedShipments({ hubId: selectedHubId }),
    enabled: isOpen
  })
  const rawShipments = (shipmentsData?.data || []) as any[]
  
  // Deduplicate shipments to prevent key errors
  const shipments = React.useMemo(() => {
    const seen = new Set();
    return rawShipments.filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [rawShipments]);

  // Populate form for editing
  useEffect(() => {
    if (routeData?.data && routeId && isOpen) {
      const data = routeData.data
      reset({
        name: data.name,
        hubId: data.hub_id || '',
        riderId: data.rider_id || null,
        stops: data.stops?.map((stop: any) => ({
          shipmentId: stop.shipment_id,
          type: stop.type,
          location: stop.location || '',
          order: stop.stop_order
        })) || []
      })
    } else if (!routeId && isOpen) {
       reset({
          name: '',
          hubId: '',
          riderId: null,
          stops: []
       })
    }
  }, [routeData, routeId, reset, isOpen])

  // Mutation
  const saveRouteMutation = useMutation({
    mutationFn: (data: RouteFormValues) => {
      if (routeId) {
        return routesApi.update(routeId, data)
      }
      return routesApi.create(data)
    },
    onSuccess: () => {
      toast.success(routeId ? 'Route updated successfully' : 'Route created successfully')
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['route-stats'] })
      onClose()
      reset()
    },
    onError: (error: any) => {
      toast.error(routeId ? 'Failed to update route' : 'Failed to create route', {
        description: error.response?.data?.message || 'Check your inputs.'
      })
    }
  })

  const onFormSubmit = (data: RouteFormValues) => {
    saveRouteMutation.mutate(data)
  }

  const handleToggleShipment = (shipment: any) => {
    // strict check using getValues to avoid closure staleness
    const currentStops = getValues('stops');
    const existingIndex = currentStops.findIndex(s => s.shipmentId === shipment.id)
    
    if (existingIndex > -1) {
      // Remove all stops for this shipment
      // We need to re-find indices based on the field array state if mapped, 
      // but here we can just find them in currentStops and map to indices.
      // However, 'remove' takes an index relative to the field array.
      
      const indicesToRemove = currentStops
        .map((s, i) => s.shipmentId === shipment.id ? i : -1)
        .filter(i => i !== -1)
        .sort((a, b) => b - a)

      indicesToRemove.forEach(i => remove(i))
    } else {
      const currentHub = hubs.find((h: any) => h.id === selectedHubId);
      const isFirstLeg = (shipment.status === 'pending' || shipment.status === 'assigned');
      
      const nextOrderIndex = currentStops.length + 1;

      if (isFirstLeg) {
        // Merchant -> Hub
        append({
          shipmentId: shipment.id,
          type: 'pickup',
          location: shipment.pickup_address || '',
          latitude: shipment.pickup_latitude,
          longitude: shipment.pickup_longitude,
          order: nextOrderIndex
        });
        append({
          shipmentId: shipment.id,
          type: 'delivery',
          location: currentHub?.address || currentHub?.name || 'Hub Location',
          latitude: currentHub?.latitude,
          longitude: currentHub?.longitude,
          order: nextOrderIndex + 1
        });
      } else if (shipment.status === 'received_at_hub') {
        // Hub -> Customer
        append({
          shipmentId: shipment.id,
          type: 'pickup',
          location: currentHub?.address || currentHub?.name || 'Hub Location',
          latitude: currentHub?.latitude,
          longitude: currentHub?.longitude,
          order: nextOrderIndex
        });
        append({
          shipmentId: shipment.id,
          type: 'delivery',
          location: shipment.delivery_address || '',
          latitude: shipment.delivery_latitude,
          longitude: shipment.delivery_longitude,
          order: nextOrderIndex + 1
        });
      }
    }
  }

  const filteredShipments = shipments.filter(s => 
    s.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.delivery_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!mounted || !isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-0 xs:p-2 sm:p-4 md:p-6 backdrop-blur-sm transition-all overflow-hidden">
      <div className="absolute inset-0 hidden sm:block" onClick={onClose} />

      <motion.div 
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white w-full h-full sm:h-auto sm:max-w-6xl sm:max-h-[92vh] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header - Fixed Height */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 flex justify-between items-center border-b border-gray-100 flex-shrink-0 bg-white z-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#ED7D31] rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100 shrink-0">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl lg:text-2xl font-black text-gray-900 leading-none truncate">
                {routeId ? 'Edit Distribution Route' : 'Plan New Route'}
              </h2>
              <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm font-medium mt-1 truncate">
                {routeId ? `Adjusting parameters for existing route sequence.` : 'Configure, assign, and optimize delivery sequence.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400 shrink-0"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {isLoadingRoute ? (
           <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-300">
             <Loader2 className="w-12 h-12 animate-spin text-orange-500" />
             <p className="text-xs font-black uppercase tracking-[0.2em]">Retrieving Route Intel...</p>
           </div>
        ) : (
          /* Scrollable Container */
          <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-[#F8F9FB] custom-scrollbar">
            {/* Section 1: Route Configuration */}
            <div className="w-full lg:w-[40%] xl:w-[35%] bg-white p-4 sm:p-6 lg:p-8 flex flex-col flex-shrink-0 lg:overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Configuration</h3>
              
              <form id="route-form" onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-6">
                  {/* Route Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-black text-slate-800 uppercase tracking-widest block">
                      Route Name <span className="text-orange-500">*</span>
                    </label>
                    <input 
                      {...register('name')}
                      placeholder="e.g. South Downtown Morning"
                      className={`w-full px-4 py-3 rounded-xl bg-gray-50 border transition-all text-sm font-bold placeholder:text-gray-300 outline-none ${
                        errors.name ? 'border-red-500' : 'border-transparent focus:border-orange-500/30'
                      }`}
                    />
                    {errors.name && <p className="text-[9px] text-red-500 font-bold">{errors.name.message}</p>}
                  </div>

                  {/* Hub Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-black text-slate-800 uppercase tracking-widest block">
                      Source Hub <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select 
                        {...register('hubId')}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border transition-all text-sm font-bold appearance-none outline-none ${
                          errors.hubId ? 'border-red-500' : 'border-transparent focus:border-orange-500/30'
                        }`}
                      >
                        <option value="">Select a hub</option>
                        {hubs.map((hub: any) => (
                          <option key={hub.id} value={hub.id}>{hub.name} ({hub.city})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Rider Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] sm:text-[11px] font-black text-slate-800 uppercase tracking-widest block">
                      Assigned Rider
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select 
                        {...register('riderId')}
                        disabled={!selectedHubId}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-transparent transition-all text-sm font-bold appearance-none outline-none focus:border-orange-500/30 disabled:opacity-50"
                      >
                        <option value="">Draft (Unassigned)</option>
                        {riders.map((rider: any) => (
                          <option key={rider.id} value={rider.id}>{rider.name} • {rider.vehicleType}</option>
                        ))}
                      </select>
                    </div>
                  </div>
              </form>

              {/* Stops Recap */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stops Sequence</h3>
                    <div className="px-2 py-0.5 bg-orange-500 text-white rounded-md text-[9px] font-black uppercase">{fields.length} STOPS</div>
                 </div>
                 
                 <div className="space-y-2">
                    {fields.map((field, index) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={field.id} 
                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-black text-slate-900 uppercase leading-none">{field.type}</p>
                          <p className="text-[8px] text-gray-400 truncate mt-1">{field.location}</p>
                        </div>
                        <button type="button" onClick={() => remove(index)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                    {fields.length === 0 && (
                      <div className="text-center py-10 rounded-2xl bg-gray-50/50 border border-dashed border-gray-200">
                        <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Build your route below</p>
                      </div>
                    )}
                 </div>
                 {errors.stops && <p className="text-[10px] text-red-500 font-black mt-2 text-center">{errors.stops.message}</p>}
              </div>
            </div>

            {/* Section 2: Shipment Selection */}
            <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col lg:overflow-hidden min-h-[400px] lg:min-h-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 uppercase tracking-tight">Available Shipments</h3>
                      <p className="text-[10px] text-gray-400 font-medium">Add packages to your current route sequence.</p>
                  </div>
                  <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-white rounded-lg text-[10px] font-black text-gray-400 border border-gray-100 shadow-sm leading-none">
                          {filteredShipments.length} FOUND
                      </span>
                  </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Filter by tracking #, name or destination..."
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border-none shadow-sm shadow-gray-200/50 focus:ring-4 focus:ring-orange-500/10 transition-all text-sm font-bold outline-none placeholder:text-gray-300"
                  />
              </div>

              {/* Shipments Grid/List */}
              <div className="flex-1 lg:overflow-y-auto pr-1 custom-scrollbar space-y-3 pb-8 lg:pb-0">
                 {isLoadingShipments ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-300 py-10">
                       <Loader2 className="w-10 h-10 animate-spin text-orange-400" />
                       <p className="text-[10px] font-black uppercase tracking-[0.2em]">Synchronizing Inventory</p>
                    </div>
                 ) : filteredShipments.length > 0 ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                      {filteredShipments.map((s: any) => {
                        const isSelected = selectedStops.some(stop => stop.shipmentId === s.id)
                        return (
                          <motion.div 
                            layout
                            key={s.id}
                            onClick={() => handleToggleShipment(s)}
                            className={`group p-4 rounded-[1.5rem] cursor-pointer transition-all border-2 flex items-center gap-4 relative overflow-hidden ${
                              isSelected 
                              ? 'bg-[#ED7D31] border-[#ED7D31] text-white shadow-xl shadow-orange-500/20' 
                              : 'bg-white border-transparent hover:border-orange-200 shadow-sm'
                            }`}
                          >
                            <div className={`p-3 rounded-2xl shrink-0 transition-colors ${isSelected ? 'bg-white/20' : 'bg-orange-50 text-orange-500'}`}>
                              <Package className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-3">
                                <h4 className="font-black text-sm uppercase tracking-tight truncate">#{s.tracking_number}</h4>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded flex-shrink-0 uppercase ${isSelected ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  {s.status}
                                </span>
                              </div>
                              <p className={`text-[12px] font-bold mt-1 transition-colors ${isSelected ? 'text-white' : 'text-slate-800'}`}>{s.recipient_name}</p>
                              <div className={`flex items-center gap-1.5 mt-1.5 transition-colors ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                                <MapPin className="w-3 h-3 shrink-0" />
                                <p className="text-[10px] truncate font-medium">
                                  {
                                    (s.status === 'pending' || s.status === 'assigned') ? s.pickup_address : 
                                    s.status === 'received_at_hub' ? 'At Hub (Ready for Dispatch)' :
                                    s.delivery_address
                                  }
                                </p>
                              </div>
                            </div>
                            {/* Selected Checkmark */}
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="absolute top-2 right-2 bg-white text-orange-500 rounded-full p-0.5 shadow-sm"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        )
                      })}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full opacity-40 grayscale py-12">
                      <Truck className="w-16 h-16 text-gray-300 mb-4" />
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500">No Inventory Available</p>
                   </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions - Sticky Bottom */}
        {!isLoadingRoute && (
          <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0 z-20">
            {/* Legend for Legend UX */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ED7D31] shadow-sm shadow-orange-300" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Pickup</span>
              </div>
              <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shadow-sm shadow-blue-300" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Delivery</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none py-3 px-6 text-[10px] sm:text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-[0.2em] transition-all"
              >
                Discard
              </button>
              <button 
                form="route-form"
                type="submit"
                disabled={isSubmitting || saveRouteMutation.isPending}
                className="flex-1 sm:flex-none bg-[#ED7D31] text-white py-3.5 sm:py-4 px-8 sm:px-12 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 shadow-sm shadow-orange-200 hover:bg-[#d86a24] transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting || saveRouteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{routeId ? 'UPDATE ROUTE' : 'DEPLOY ROUTE'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  )
}
