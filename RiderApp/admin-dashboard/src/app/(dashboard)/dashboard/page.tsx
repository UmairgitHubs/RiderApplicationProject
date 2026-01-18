'use client'

import React, { useState } from 'react'
import { useDashboardStats, useOrderTrend, useCalendarData } from '@/hooks/useAnalytics'
import { Bike, Store, Warehouse } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, getYear, getMonth } from 'date-fns'

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const month = getMonth(currentDate) + 1
  const year = getYear(currentDate)

  const { data: statsData, isLoading: isLoadingStats } = useDashboardStats()
  const { data: trendData, isLoading: isLoadingTrend } = useOrderTrend({ month, year })
  const { data: calendarResponse, isLoading: isLoadingCalendar } = useCalendarData({ month, year })

  const stats = statsData?.data || {}
  const orderDetailsData = trendData?.data || []
  const busyDays = calendarResponse?.data?.busyDays || []

  // Derived calendar data
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startDay = getDay(monthStart) // 0 for Sun

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const hubPerformanceData = stats.hub_performance || []
  const shipmentStatusData = stats.shipment_status || []
  const recentActivities = stats.recent_activities || []

  const upcomingEvents = stats.upcoming_count > 0 ? [
    { 
      title: `${stats.upcoming_count} deliveries are coming`, 
      date: format(new Date(), 'd MMMM, yyyy'), 
      time: 'In transit / Scheduled', 
      icon: 'M' 
    },
  ] : []

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Riders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Riders</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active_riders || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bike className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Merchants */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Merchants</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active_merchants || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Store className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Hubs */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Hubs</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active_hubs || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Warehouse className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Details Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
              <div className="flex gap-2">
                <select 
                  value={month}
                  onChange={(e) => setCurrentDate(new Date(year, parseInt(e.target.value) - 1, 1))}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM')}</option>
                  ))}
                </select>
                <select 
                  value={year}
                  onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), month - 1, 1))}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {[2023, 2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={orderDetailsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  stroke="#9ca3af"
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  stroke="#9ca3af"
                />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke="#FF6B00" 
                  strokeWidth={2}
                  dot={{ fill: '#2196F3', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Hub Performance Comparison */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Hub Performance Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hubPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar dataKey="delivered" fill="#4CAF50" name="Delivered" />
                <Bar dataKey="pending" fill="#FF9800" name="Pending" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Shipment Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={shipmentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {shipmentStatusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Calendar */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Calendar</h2>
              <div className="flex items-center space-x-2">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium">{format(currentDate, 'MMMM yyyy')}</span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded">
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

          {/* Upcoming */}
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

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden flex flex-col h-[600px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex-shrink-0">Recent Activity</h2>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-6 relative">
                {/* Timeline vertical line */}
                {recentActivities.length > 0 && (
                  <div className="absolute left-[3px] top-2 bottom-2 w-[2px] bg-gray-100"></div>
                )}
                
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start space-x-4 relative">
                      {/* Timeline Dot */}
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
        </div>
      </div>
    </div>
  )
}
