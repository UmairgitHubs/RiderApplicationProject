'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { 
  MessageSquare, 
  Search, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Loader2
} from 'lucide-react'
// import SupportStatsCard from '@/components/support/SupportStatsCard'
// import SupportTable from '@/components/support/SupportTable'
// import SupportMobileCard from '@/components/support/SupportMobileCard'
import { TicketDetailsModal } from '@/components/support/TicketDetailsModal'
import CreateTicketModal from '@/components/support/CreateTicketModal'
import { SupportTicket } from '@/types/support'
import { useSupport, useSupportStats } from '@/hooks/useSupport'

const  SupportStatsCard= dynamic(()=> import("@/components/support/SupportStatsCard"),{ssr:false})
const SupportTable = dynamic(()=> import("@/components/support/SupportTable"),{ssr:false})
const SupportMobileCard = dynamic(()=> import("@/components/support/SupportMobileCard"),{ssr:false})


export default function SupportPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: supportData, isLoading } = useSupport({ 
    search: searchTerm,
    page 
  })

  const { data: statsData } = useSupportStats()

  const tickets = supportData?.data?.tickets || []
  
  const stats = [
    { label: 'Total Tickets', value: statsData?.data?.total?.toString() || '0', icon: MessageSquare, color: 'border-orange-500', iconBg: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Open', value: statsData?.data?.open?.toString() || '0', icon: AlertCircle, color: 'border-yellow-500', iconBg: 'bg-yellow-50', iconColor: 'text-yellow-500' },
    { label: 'In Progress', value: statsData?.data?.inProgress?.toString() || '0', icon: Clock, color: 'border-sky-500', iconBg: 'bg-sky-50', iconColor: 'text-sky-500' },
    { label: 'Resolved', value: statsData?.data?.resolved?.toString() || '0', icon: CheckCircle2, color: 'border-green-500', iconBg: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Closed', value: statsData?.data?.closed?.toString() || '0', icon: XCircle, color: 'border-gray-500', iconBg: 'bg-gray-50', iconColor: 'text-gray-500' },
  ]

  // Transform backend data to frontend format
  const formattedTickets: SupportTicket[] = tickets.map((t: any) => ({
    id: t.id,
    ticket_number: t.ticket_number,
    user: { 
      name: t.user?.full_name || 'Unknown', 
      role: t.user?.role?.charAt(0).toUpperCase() + t.user?.role?.slice(1) || 'User' 
    },
    subject: t.subject,
    category: t.category,
    priority: t.priority as any,
    status: t.status as any,
    created: new Date(t.created_at).toLocaleDateString() + '\n' + new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }))

  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  const handleView = (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
  }

  const handleCloseModal = () => {
    setSelectedTicket(null)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  return (
    <div className="space-y-6 px-4 py-6 sm:px-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orange-500 font-black">Support & Help Desk</h1>
          <p className="text-gray-500 text-sm mt-1">Manage support tickets and customer inquiries from riders and merchants</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center justify-center px-6 py-3.5 bg-orange-500 text-white rounded-2xl hover:bg-orange-600 font-bold transition-all shadow-lg shadow-orange-500/25 active:scale-95 whitespace-nowrap"
        >
          <MessageSquare className="w-5 h-5 mr-3" />
          Create New Ticket
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <SupportStatsCard 
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            iconBg={stat.iconBg}
            iconColor={stat.iconColor}
          />
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
        <input 
            type="text"
            placeholder="Search by ticket ID, user, or subject..." 
            className="w-full pl-12 pr-4 py-4 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all bg-white shadow-sm hover:shadow-md font-bold text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
           <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
           <p className="text-gray-500 font-medium tracking-widest text-[10px] uppercase font-black">Loading support tickets...</p>
        </div>
      ) : formattedTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm text-center px-4">
           <div className="bg-orange-50 p-6 rounded-3xl mb-6">
              <MessageSquare className="w-12 h-12 text-orange-500" />
           </div>
           <h3 className="text-xl font-bold text-gray-900 mb-2">No tickets found</h3>
           <p className="text-gray-500 max-w-sm text-sm">
              We couldn't find any support tickets matching your search or criteria.
           </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {formattedTickets.map((ticket) => (
              <SupportMobileCard 
                key={ticket.id} 
                ticket={ticket} 
                onView={handleView}
              />
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <SupportTable 
              tickets={formattedTickets} 
              onView={handleView} 
            />
          </div>
        </>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketDetailsModal 
          ticket={selectedTicket} 
          onClose={handleCloseModal} 
        />
      )}

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <CreateTicketModal 
          onClose={handleCloseCreateModal} 
        />
      )}
    </div>
  )
}
