import Skeleton from '@/components/common/Skeleton'
import React from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'

interface DashboardCalendarProps {
  currentDate: Date
  busyDays: any[]
  onPrevMonth: () => void
  onNextMonth: () => void
  isLoading?: boolean
}

export default function DashboardCalendar({ currentDate, busyDays, onPrevMonth, onNextMonth, isLoading }: DashboardCalendarProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    )
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = getDay(monthStart)

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
        <div className="flex items-center space-x-2">
          <button onClick={onPrevMonth} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={onNextMonth} className="p-1 hover:bg-gray-100 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div key={day} className="text-xs font-medium text-gray-500 text-center py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="py-2" />
        ))}
        {daysInMonth.map((day) => {
          const dayNum = day.getDate()
          const isBusy = busyDays.some((d: any) => d.day === dayNum)
          return (
            <div
              key={dayNum}
              className={`text-sm text-center py-2 rounded ${
                isBusy
                  ? 'bg-primary text-white font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {dayNum}
            </div>
          )
        })}
      </div>
    </div>
  )
}
