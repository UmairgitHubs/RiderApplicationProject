import Skeleton from '@/components/common/Skeleton'

interface RecentActivityProps {
  activities: any[]
  isLoading?: boolean
}

export default function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden flex flex-col h-[600px]">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex-shrink-0">Recent Activity</h2>
        <div className="flex-1 space-y-8 pr-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <Skeleton className="h-2 w-2 rounded-full mt-1.5" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden flex flex-col h-[600px]">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex-shrink-0">Recent Activity</h2>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="space-y-6 relative">
          {activities.length > 0 && (
            <div className="absolute left-[3px] top-2 bottom-2 w-[2px] bg-gray-100"></div>
          )}
          
          {activities.length > 0 ? (
            activities.map((activity: any, index: number) => (
              <div key={index} className="flex items-start space-x-4 relative">
                <div className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 z-10 ${
                  activity.color === 'blue' ? 'bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' :
                  activity.color === 'green' ? 'bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.1)]' :
                  'bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.1)]'
                }`}></div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate" title={activity.type}>
                    {activity.type}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {activity.merchant && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <span className="font-semibold mr-1">Merchant:</span> 
                        <span className="truncate">{activity.merchant}</span>
                      </p>
                    )}
                    {activity.rider && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <span className="font-semibold mr-1">Rider:</span> 
                        <span className="truncate">{activity.rider}</span>
                      </p>
                    )}
                    {activity.hub && (
                      <p className="text-xs text-gray-500 flex items-center">
                        <span className="font-semibold mr-1">Hub:</span> 
                        <span className="truncate">{activity.hub}</span>
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mt-2 italic">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="bg-gray-50 p-3 rounded-full mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400 font-medium italic">No recent activity detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
