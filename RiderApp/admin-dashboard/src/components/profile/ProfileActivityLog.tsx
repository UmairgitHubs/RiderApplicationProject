import { History, Calendar, MapPin } from 'lucide-react'
import { useProfile } from '@/hooks/useProfile'
import { format } from 'date-fns'

export default function ProfileActivityLog() {
  const { activityLogs, isLoadingActivityLogs } = useProfile()

  if (isLoadingActivityLogs) {
    return <div className="p-4 text-center text-gray-500">Loading activity logs...</div>
  }

  return (
    <div className="p-2">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>

      <div className="space-y-4">
        {activityLogs?.length === 0 ? (
          <div className="text-center text-gray-500 py-8">No recent activity found.</div>
        ) : (
          activityLogs?.map((activity: any) => (
            <div key={activity.id} className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-medium text-gray-900 mb-2">{activity.action}</h4>
              {activity.description && <p className="text-sm text-gray-600 mb-2">{activity.description}</p>}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{format(new Date(activity.created_at), 'MMM dd, yyyy hh:mm a')}</span>
                </div>
                {activity.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{activity.location}</span>
                  </div>
                )}
              </div>
               <div className="text-xs text-gray-400 mt-2 font-mono">
                  {activity.user_agent ? activity.user_agent.split(')')[0] + ')' : 'Unknown Device'} • {activity.ip_address}
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
