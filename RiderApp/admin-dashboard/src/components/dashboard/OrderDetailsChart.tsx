import Skeleton from '@/components/common/Skeleton'
import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface OrderDetailsChartProps {
  data: any[]
  month: number
  year: number
  onDateChange: (newDate: Date) => void
  isLoading?: boolean
}

export default function OrderDetailsChart({ data, month, year, onDateChange, isLoading }: OrderDetailsChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Order Details</h2>
        <div className="flex gap-2">
          <select 
            value={month}
            onChange={(e) => onDateChange(new Date(year, parseInt(e.target.value) - 1, 1))}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM')}</option>
            ))}
          </select>
          <select 
            value={year}
            onChange={(e) => onDateChange(new Date(parseInt(e.target.value), month - 1, 1))}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" stroke="#9ca3af" />
          <YAxis tickFormatter={(value) => `${value}%`} stroke="#9ca3af" />
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
  )
}
