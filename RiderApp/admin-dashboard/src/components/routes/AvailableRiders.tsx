import { Bike, Star, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { routesApi } from '@/lib/api/routes'

export default function AvailableRiders() {
  const { data: ridersData, isLoading } = useQuery({
    queryKey: ['available-riders', 'all'],
    queryFn: () => routesApi.getAvailableRiders()
  })
  
  const riders = ridersData?.data || []

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Bike className="w-5 h-5 text-orange-500" />
        <h3 className="font-bold">Available Riders</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {riders.length > 0 ? (
            riders.map((rider: any) => (
                <div key={rider.id} className="flex justify-between items-start border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                     <div className="flex gap-3">
                         {/* Avatar */}
                         <div className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
                             {rider.name.match(/\b\w/g)?.join('')}
                         </div>
                         
                         {/* Info */}
                         <div>
                             <h4 className="font-bold text-gray-900 text-sm">{rider.name}</h4>
                             <div className="text-xs text-gray-400 font-mono mb-2 uppercase">{rider.id.split('-')[0]}</div>
                             
                             <div className="space-y-1">
                                 <div className="">
                                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                                      <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                      Available
                                    </span>
                                 </div>
                                 <div className="text-xs text-gray-500">{rider.vehicleType} • {rider.hubId ? 'Stationed' : 'Roaming'}</div>
                             </div>
                         </div>
                     </div>
    
                     {/* Stats */}
                     <div className="text-right">
                         <div className="flex items-center justify-end gap-1 text-gray-500 text-xs font-bold mb-1">
                             <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {rider.rating}
                         </div>
                         <div className="text-xs text-gray-400">
                             <span className="block text-gray-900 font-bold">0</span>
                             active
                         </div>
                     </div>
                </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              No available riders found
            </div>
          )}
        </div>
      )}
    </div>
  )
}

