import Skeleton from '@/components/common/Skeleton'
import { format } from 'date-fns'

interface UpcomingEventsProps {
  upcomingCount: number
  isLoading?: boolean
}

export default function UpcomingEvents({ upcomingCount, isLoading }: UpcomingEventsProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const upcomingEvents = upcomingCount > 0 ? [
    { 
      title: `${upcomingCount} deliveries are coming`, 
      date: format(new Date(), 'd MMMM, yyyy'), 
      time: 'In transit / Scheduled', 
      icon: 'M' 
    },
  ] : []

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Upcoming</h2>
        <button className="text-sm text-primary hover:text-primary-600">View All</button>
      </div>
      <div className="space-y-4">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event: any, index: number) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">{event.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{event.title}</p>
                <p className="text-xs text-gray-500 mt-1">{event.date} | {event.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4 italic">No upcoming deliveries</p>
        )}
      </div>
    </div>
  )
}
