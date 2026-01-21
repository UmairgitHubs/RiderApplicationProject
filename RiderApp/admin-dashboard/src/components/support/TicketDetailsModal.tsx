'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Tag, 
  Clock, 
  Calendar, 
  Send, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  MessageSquare,
  Loader2
} from 'lucide-react'
import { useTicketDetails, useReplyTicket, useUpdateTicket } from '@/hooks/useSupport'
import { SupportTicket } from '@/types/support'
import { format } from 'date-fns'

interface TicketDetailsModalProps {
  ticket: SupportTicket
  onClose: () => void
}

/**
 * TicketDetailsModal - A premium, fully responsive modal for managing support tickets.
 * Designed to match the high-fidelity UI requirements with clean, optimized code.
 */
import { useSocket } from '@/lib/socket-context'
import { useQueryClient } from '@tanstack/react-query'

export function TicketDetailsModal({ ticket: initialTicket, onClose }: TicketDetailsModalProps) {
  const [mounted, setMounted] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: ticketDetails, isLoading } = useTicketDetails(initialTicket.id)
  const replyMutation = useReplyTicket()
  const updateTicketMutation = useUpdateTicket()
  
  const { socket } = useSocket()
  const queryClient = useQueryClient()

  // Real-time message listener
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (data: any) => {
      // Check if message belongs to current ticket
      if (data.ticketId === initialTicket.id || (data.message && data.message.ticket_id === initialTicket.id)) {
        console.log('New message received:', data)
        
        const newMessage = data.message
        
        // Normalize message structure
        const normalizedMsg = {
          id: newMessage.id,
          message: newMessage.message || newMessage.text,
          created_at: newMessage.created_at || newMessage.createdAt || new Date().toISOString(),
          sender: {
            id: newMessage.senderId || newMessage.sender_id,
            full_name: newMessage.senderName || newMessage.sender?.full_name || 'User',
            role: newMessage.senderRole || newMessage.sender?.role || 'user'
          }
        }

        // Update React Query cache
        queryClient.setQueryData(['ticket-details', initialTicket.id], (oldData: any) => {
          if (!oldData || !oldData.data) return oldData
          
          // Check if message already exists to prevent duplicates
          const exists = oldData.data.messages.some((m: any) => m.id === normalizedMsg.id)
          if (exists) return oldData

          return {
            ...oldData,
            data: {
              ...oldData.data,
              messages: [...oldData.data.messages, normalizedMsg]
            }
          }
        })
      }
    }

    socket.on('support:new-message', handleNewMessage)

    return () => {
      socket.off('support:new-message', handleNewMessage)
    }
  }, [socket, initialTicket.id, queryClient])

  // Handle body scroll lock and mounting
  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [ticketDetails?.data?.messages])

  if (!mounted) return null

  const ticket = ticketDetails?.data || initialTicket
  const messages = ticket.messages || []
  const user = ticket.user || initialTicket.user || { full_name: 'User', email: 'N/A', phone: 'N/A', role: 'User' }

  const handleSendReply = async () => {
    if (!replyMessage.trim() || replyMutation.isPending) return
    try {
      await replyMutation.mutateAsync({
        id: ticket.id,
        message: replyMessage,
        status: 'In Progress'
      })
      setReplyMessage('')
    } catch (error) {
      console.error('Failed to send reply:', error)
    }
  }

  const handleUpdate = async (updates: { status?: string; priority?: string }) => {
    if (updateTicketMutation.isPending) return
    try {
      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        ...updates
      })
    } catch (error) {
      console.error('Failed to update ticket:', error)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-[1px] animate-in fade-in duration-300">
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-4xl sm:max-h-[92vh] sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-[#f15a24] font-bold text-lg leading-tight uppercase tracking-tight">
              {ticket.ticket_number || `TKT-${ticket.id?.slice(0, 4).toUpperCase()}`}
            </h3>
            <p className="text-gray-500 text-sm mt-0.5 font-medium">
              {ticket.subject}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div 
          className="flex-1 overflow-y-auto bg-[#f8f9fb] custom-scrollbar" 
          ref={scrollRef}
        >
          <div className="p-4 sm:p-6 space-y-6">
            
            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* User Information Card */}
              <div className="bg-white rounded-xl p-5 border border-white shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-4 text-[#f15a24]">
                  <User className="w-4 h-4" />
                  <h4 className="text-[11px] font-black uppercase tracking-widest">User Information</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Name</label>
                    <p className="text-sm font-bold text-slate-800">{user.full_name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Type</label>
                    <p className="text-sm font-bold text-slate-800 capitalize">{user.role}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">User ID</label>
                    <p className="text-sm font-bold text-slate-800">{user.id?.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="pt-2 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
                      <Mail className="w-4 h-4 text-slate-300" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2.5 text-xs font-bold text-slate-600">
                      <Phone className="w-4 h-4 text-slate-300" />
                      {user.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ticket Details Card */}
              <div className="bg-white rounded-xl p-5 border border-white shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-4 text-[#f15a24]">
                  <Tag className="w-4 h-4" />
                  <h4 className="text-[11px] font-black uppercase tracking-widest">Ticket Details</h4>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Category</label>
                    <p className="text-sm font-bold text-slate-800">{ticket.category}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Priority</label>
                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${
                      ticket.priority === 'High' ? 'bg-red-500' : ticket.priority === 'Medium' ? 'bg-orange-400' : 'bg-slate-400'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Status</label>
                    <span className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-sm ${
                      ticket.status === 'Open' ? 'bg-orange-500' : 
                      ticket.status === 'In Progress' ? 'bg-sky-500' : 
                      ticket.status === 'Resolved' ? 'bg-emerald-500' : 'bg-slate-500'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Assigned To</label>
                    <p className="text-sm font-bold text-slate-800">{ticket.assignee?.full_name || 'Support Agent 1'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Related Order</label>
                    <p className="text-sm font-bold text-[#f15a24]">COD-{ticket.id?.slice(0, 6).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Row */}
            <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 border border-transparent">
              <div className="flex items-center gap-2 text-[#f15a24]">
                <Calendar className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-widest">Timeline</h4>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-[11px] text-slate-500 font-bold">
                <p>Created: <span className="text-slate-900 ml-1">{format(new Date(ticket.created_at || new Date()), 'yyyy-MM-dd HH:mm a')}</span></p>
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full hidden sm:block"></div>
                <p>Last Update: <span className="text-slate-900 ml-1">{format(new Date(ticket.updated_at || new Date()), 'yyyy-MM-dd HH:mm a')}</span></p>
              </div>
            </div>

            {/* Conversation Log */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2 text-[#f15a24] px-1">
                <MessageSquare className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-widest">Conversation</h4>
              </div>
              
              <div className="space-y-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-8 h-8 text-[#f15a24] animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Conversation...</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg: any) => {
                      const isAdmin = msg.sender.role?.toLowerCase().includes('admin') || 
                                     msg.sender.role?.toLowerCase().includes('manager') || 
                                     msg.sender.role?.toLowerCase().includes('hub');
                      
                      return (
                        <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[92%] sm:max-w-[80%] rounded-xl shadow-sm border overflow-hidden ${
                            isAdmin ? 'bg-[#f15a24] text-white border-transparent' : 'bg-white text-slate-800 border-slate-100'
                          }`}>
                            <div className={`flex items-center justify-between gap-6 px-4 py-2 border-b text-[9px] font-black uppercase tracking-widest ${
                              isAdmin ? 'bg-black/5 border-white/10' : 'bg-slate-50 border-slate-100'
                            }`}>
                              <span>{isAdmin ? (msg.sender.full_name || 'Admin Support') : (msg.sender.full_name || 'User')}</span>
                              <span className={isAdmin ? 'text-white/70' : 'text-slate-400'}>
                                {format(new Date(msg.created_at), 'hh:mm a')}
                              </span>
                            </div>
                            <div className="p-4 leading-relaxed font-bold text-sm">
                              <p className="whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {messages.length === 0 && (
                      <div className="text-center py-12 bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
                        <MessageSquare className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No conversation logs yet</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Interaction Area */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 sm:p-6 space-y-4">
          {/* Reply Row */}
          <div className="flex flex-col sm:flex-row gap-4">
             <div className="flex-1 relative">
                <textarea 
                  rows={2}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendReply()
                    }
                  }}
                  placeholder="Type your reply..."
                  className="w-full px-5 py-3 rounded-xl border border-orange-500 focus:outline-none focus:ring-4 focus:ring-[#f15a24]/10 text-sm font-bold text-slate-700 placeholder:text-slate-400 transition-all bg-white resize-none"
                />
             </div>
             <button 
                disabled={!replyMessage.trim() || replyMutation.isPending}
                onClick={handleSendReply}
                className="self-end sm:self-center h-[52px] px-8 bg-[#f15a24] text-white rounded-xl font-bold text-sm hover:bg-[#d94e1f] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange-100 whitespace-nowrap"
              >
                {replyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </>
                )}
              </button>
          </div>

          {/* Buttons Row */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <button 
                disabled={ticket.status === 'In Progress' || updateTicketMutation.isPending}
                onClick={() => handleUpdate({ status: 'In Progress' })}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#4fc3f7] text-white rounded-xl font-bold text-xs transition-all hover:bg-[#29b6f6] active:scale-95 disabled:opacity-40 shadow-sm"
              >
                <Clock className="w-4 h-4 shrink-0" />
                <span>Mark In Progress</span>
              </button>
              <button 
                disabled={ticket.status === 'Resolved' || updateTicketMutation.isPending}
                onClick={() => handleUpdate({ status: 'Resolved' })}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#66bb6a] text-white rounded-xl font-bold text-xs transition-all hover:bg-[#4caf50] active:scale-95 disabled:opacity-40 shadow-sm"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Mark Resolved</span>
              </button>
              <button 
                disabled={ticket.status === 'Closed' || updateTicketMutation.isPending}
                onClick={() => handleUpdate({ status: 'Closed' })}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#9e9e9e] text-white rounded-xl font-bold text-xs transition-all hover:bg-[#757575] active:scale-95 disabled:opacity-40 shadow-sm"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>Close Ticket</span>
              </button>
            </div>
            <button 
              disabled={ticket.priority === 'High' || updateTicketMutation.isPending}
              onClick={() => handleUpdate({ priority: 'High' })}
              className="flex items-center justify-center gap-2 px-8 py-3 border border-[#ef5350] text-[#ef5350] rounded-xl font-bold text-xs transition-all hover:bg-red-50 active:scale-95 sm:min-w-[150px] disabled:opacity-40"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Escalate</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
