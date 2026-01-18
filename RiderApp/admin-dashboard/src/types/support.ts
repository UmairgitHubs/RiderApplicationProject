export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'
export type TicketPriority = 'High' | 'Medium' | 'Low'

export interface SupportTicket {
  id: string
  ticket_number: string
  subject: string
  category: string
  priority: TicketPriority
  status: TicketStatus
  user_id: string
  assigned_to?: string
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string
    email: string
    phone?: string
    role: string
  }
  assignee?: {
    id: string
    full_name: string
  }
  messages?: SupportMessage[]
}

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  is_read: boolean
  created_at: string
  sender: {
    id: string
    full_name: string
    role: string
  }
}

export interface SupportStat {
  label: string
  value: string
  icon: any
  color: string // border color
  iconBg: string
  iconColor: string
}
