import { MessageSquare, Eye } from 'lucide-react'
import { SupportTicket } from '@/types/support'

interface SupportTableProps {
  tickets: SupportTicket[]
  onView: (ticket: SupportTicket) => void
}

export default function SupportTable({ tickets, onView }: SupportTableProps) {
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
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden md:block">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-100">
          <tr>
            <th className="px-6 py-4">Ticket ID</th>
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Subject</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Priority</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Created</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 align-top font-medium text-orange-500">
                {ticket.id}
              </td>
              <td className="px-6 py-4 align-top">
                <div className="font-medium text-gray-900">{ticket.user.name}</div>
                <div className="text-xs text-gray-500 font-medium">{ticket.user.role}</div>
              </td>
              <td className="px-6 py-4 align-top max-w-[200px]">
                 <div className="text-gray-900 line-clamp-2 leading-relaxed font-medium">
                    {ticket.subject.split(' ').map((word, i) => (
                        <span key={i} className="block">{word}</span>
                    ))}
                 </div>
              </td>
              <td className="px-6 py-4 align-top">
                <span className="inline-flex px-2 py-1 rounded bg-gray-100 text-gray-600 text-xs font-medium whitespace-nowrap">
                   {/* Split category into two lines if needed or keep as block */}
                    {ticket.category.split(' ').length > 1 ? (
                        <div className="flex flex-col items-center">
                            <span>{ticket.category.split(' ')[0]}</span>
                            <span>{ticket.category.split(' ')[1]}</span>
                        </div>
                    ) : ticket.category}
                </span>
              </td>
              <td className="px-6 py-4 align-top">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium w-20 justify-center ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </td>
              <td className="px-6 py-4 align-top">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium w-24 justify-center whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </td>
              <td className="px-6 py-4 align-top text-gray-500 text-xs">
                {ticket.created.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                ))}
              </td>
              <td className="px-6 py-4 align-top text-center">
                <button 
                  onClick={() => onView(ticket)}
                  className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition-colors border border-orange-200"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
