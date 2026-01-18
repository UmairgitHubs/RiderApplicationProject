import { MessageSquare } from 'lucide-react'
import { SupportTicket } from '@/types/support'

interface SupportMobileCardProps {
  ticket: SupportTicket
  onView: (ticket: SupportTicket) => void
}

export default function SupportMobileCard({ ticket, onView }: SupportMobileCardProps) {
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500 text-white'
      case 'Medium': return 'bg-orange-400 text-white'
      case 'Low': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-orange-500 text-white' 
      case 'In Progress': return 'bg-sky-400 text-white'
      case 'Resolved': return 'bg-green-500 text-white'
      case 'Closed': return 'bg-gray-400 text-white'
      default: return 'bg-gray-400 text-white'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
           <div className="text-orange-500 font-medium">{ticket.id}</div>
           <h4 className="font-semibold text-gray-900 mt-1 line-clamp-1">{ticket.subject}</h4>
           <div className="text-xs text-gray-500 mt-1">{ticket.user.name} • {ticket.user.role}</div>
        </div>
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(ticket.status)}`}>
          {ticket.status}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 border-t border-gray-100 pt-3">
         <div className="flex-1">
            <p className="text-xs text-gray-400 mb-1">Priority</p>
            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
            </span>
         </div>
         <div className="flex-1 text-right">
             <p className="text-xs text-gray-400 mb-1">Date</p>
             <span className="text-xs">{ticket.created.split('\n')[0]}</span>
         </div>
      </div>

      <div className="flex justify-end pt-2">
        <button 
            onClick={() => onView(ticket)}
            className="flex items-center px-3 py-2 text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-sm font-medium"
        >
            <MessageSquare className="w-4 h-4 mr-2" />
            View Details
        </button>
      </div>
    </div>
  )
}
