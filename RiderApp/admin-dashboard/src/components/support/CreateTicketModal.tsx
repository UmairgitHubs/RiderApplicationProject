'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { 
  X, 
  User, 
  MessageSquare, 
  Search, 
  Tag, 
  Loader2,
  Check,
  ChevronDown,
  Plus
} from 'lucide-react'
import { useCreateTicket, useSearchSupportUsers } from '@/hooks/useSupport'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDebounce } from 'use-debounce'

interface CreateTicketModalProps {
  onClose: () => void
}

const CATEGORIES = [
  'General Inquiry',
  'Technical Issue',
  'Payment Issue',
  'Delivery Issue',
  'Pickup Request',
  'Billing Issue',
  'Account Issue',
  'Other'
] as const

const PRIORITIES = [
  { label: 'Low', value: 'Low', color: 'bg-slate-400' },
  { label: 'Medium', value: 'Medium', color: 'bg-orange-400' },
  { label: 'High', value: 'High', color: 'bg-red-500' }
] as const

const ticketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  category: z.enum(CATEGORIES),
  priority: z.enum(['Low', 'Medium', 'High']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  userId: z.string().min(1, 'Please select a user')
})

type TicketFormData = z.infer<typeof ticketSchema>

export default function CreateTicketModal({ onClose }: CreateTicketModalProps) {
  const [mounted, setMounted] = useState(false)
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [showUserResults, setShowUserResults] = useState(false)

  const { data: searchResults, isLoading: isSearching } = useSearchSupportUsers(debouncedSearchTerm)
  const createMutation = useCreateTicket()

  // Form Management
  const { 
    register, 
    handleSubmit, 
    control, 
    setValue, 
    watch,
    formState: { errors, isValid } 
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    mode: 'onChange', // Enable real-time validation
    defaultValues: {
      category: 'General Inquiry',
      priority: 'Medium',
      subject: '',
      message: ''
    }
  })

  // Watch priority for dynamic styling
  const currentPriority = watch('priority')

  useEffect(() => {
    setMounted(true)
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const onSubmit = async (data: TicketFormData) => {
    try {
      await createMutation.mutateAsync({
        user_id: data.userId,
        subject: data.subject,
        category: data.category,
        priority: data.priority,
        message: data.message
      })
      onClose()
    } catch (error) {
      console.error('Failed to create ticket:', error)
    }
  }

  const handleSelectUser = (user: any) => {
    setSelectedUser(user)
    setValue('userId', user.id, { shouldValidate: true }) // Trigger validation immediately
    setShowUserResults(false)
    setSearchTerm('')
  }

  const handleClearUser = () => {
    setSelectedUser(null)
    setValue('userId', '', { shouldValidate: true }) // Trigger validation immediately
  }

  if (!mounted) return null

  // Reusable sub-components for cleanliness
  const Label = ({ children, icon: Icon, error }: { children: React.ReactNode, icon?: any, error?: string }) => (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-3 h-3 text-[#f15a24]" />}
        <label className={`text-[10px] font-bold uppercase tracking-widest block ${error ? 'text-red-500' : 'text-gray-400'}`}>
          {children}
        </label>
      </div>
      {error && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wide animate-in slide-in-from-right-2 fade-in">{error}</span>}
    </div>
  )

  const getInputClass = (hasError?: boolean) => `
    w-full px-4 py-3 rounded-xl border transition-all bg-white text-sm font-bold text-slate-700 placeholder:text-slate-400
    focus:outline-none focus:ring-4
    ${hasError 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' 
      : 'border-slate-200 focus:border-[#f15a24] focus:ring-[#f15a24]/10'
    }
  `

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-[1px] animate-in fade-in duration-300">
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[92vh] sm:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-black/5">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 flex-shrink-0 bg-white">
          <div>
            <h3 className="text-[#f15a24] font-bold text-lg leading-tight uppercase tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Create New Ticket
            </h3>
            <p className="text-gray-500 text-sm mt-0.5 font-medium">
              Open a new support case for a user
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <div className="flex-1 overflow-y-auto bg-[#f8f9fb] custom-scrollbar">
          <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6">
            
            {/* User Selection Card */}
            <div className={`bg-white rounded-xl p-5 border shadow-sm transition-all hover:shadow-md ${errors.userId ? 'border-red-200 ring-4 ring-red-50' : 'border-white'}`}>
              <div className="flex items-center gap-2 mb-4 text-[#f15a24]">
                <User className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-widest">User Information</h4>
              </div>

              <div className="relative">
                {!selectedUser ? (
                  <div className="relative group">
                    <Label error={errors.userId?.message}>Search User</Label>
                    <div className="relative">
                      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-orange-500' : 'text-gray-400'}`} />
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          setShowUserResults(true)
                        }}
                        onFocus={() => setShowUserResults(true)}
                        placeholder="Search by name, email or phone..."
                        className={getInputClass(!!errors.userId) + " pl-10"}
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Results Dropdown */}
                    {showUserResults && debouncedSearchTerm.length >= 2 && searchResults?.data && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-10 animate-in slide-in-from-top-2 duration-200 custom-scrollbar">
                        {searchResults.data.length > 0 ? (
                          searchResults.data.map((user: any) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleSelectUser(user)}
                              className="w-full flex items-center justify-between p-3 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0 group"
                            >
                              <div className="text-left">
                                <p className="font-bold text-sm text-slate-800 group-hover:text-orange-900">{user.full_name}</p>
                                <p className="text-xs text-slate-500 font-medium">{user.email} • <span className="capitalize">{user.role}</span></p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">No users found</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-orange-50/50 border border-orange-100 rounded-xl animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-base">
                        {selectedUser.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900">{selectedUser.full_name}</p>
                        <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">{selectedUser.role} • {selectedUser.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={handleClearUser}
                      className="p-2 hover:bg-orange-100 rounded-lg text-orange-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {/* Hidden field for validation */}
                <input type="hidden" {...register('userId')} />
              </div>
            </div>

            {/* Ticket Details Card */}
            <div className={`bg-white rounded-xl p-5 border shadow-sm transition-all hover:shadow-md ${errors.subject || errors.message ? 'border-red-200 ring-4 ring-red-50' : 'border-white'}`}>
              <div className="flex items-center gap-2 mb-4 text-[#f15a24]">
                <Tag className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-widest">Ticket Details</h4>
              </div>

              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Category selection */}
                  <div>
                      <Label>Category</Label>
                      <div className="relative group">
                          <select 
                              {...register('category')}
                              className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-[#f15a24]/10 focus:border-[#f15a24] text-sm font-bold text-slate-700 appearance-none bg-white transition-all cursor-pointer hover:border-orange-300"
                          >
                              {CATEGORIES.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                              ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
                      </div>
                  </div>

                  {/* Priority selection */}
                  <div>
                      <Label>Priority</Label>
                      <div className="flex gap-2">
                          <Controller
                            name="priority"
                            control={control}
                            render={({ field }) => (
                              <>
                                {PRIORITIES.map(p => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => field.onChange(p.value)}
                                        className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-500/50 ${
                                            field.value === p.value 
                                            ? `${p.color} border-transparent text-white shadow-md transform scale-105` 
                                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                              </>
                            )}
                          />
                      </div>
                  </div>
                </div>

                {/* Subject section */}
                <div>
                  <Label error={errors.subject?.message}>Subject</Label>
                  <input 
                    type="text"
                    {...register('subject')}
                    placeholder="Brief summary of the issue..."
                    className={getInputClass(!!errors.subject)}
                  />
                </div>

                {/* Message section */}
                <div>
                  <Label error={errors.message?.message}>Initial Message</Label>
                  <textarea 
                    rows={4}
                    {...register('message')}
                    placeholder="Detailed description of the problem..."
                    className={getInputClass(!!errors.message) + " resize-none min-h-[100px]"}
                  />
                </div>
              </div>
            </div>
            
            {/* Hidden submit button to allow Enter key submission form-wide */}
             <button type="submit" className="hidden" />
          </form>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none sm:w-32 px-4 py-3 border border-gray-200 text-gray-500 rounded-xl font-bold text-xs hover:bg-gray-50 hover:text-gray-700 transition-all active:scale-95 uppercase tracking-wide"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || createMutation.isPending}
            className="flex-1 px-8 py-3 bg-[#f15a24] text-white rounded-xl font-bold text-sm hover:bg-[#d94e1f] transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-orange-100 flex items-center justify-center gap-2 uppercase tracking-wide disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MessageSquare className="w-5 h-5" />
            )}
            Create Support Ticket
          </button>
        </div>

      </div>
    </div>,
    document.body
  )
}
