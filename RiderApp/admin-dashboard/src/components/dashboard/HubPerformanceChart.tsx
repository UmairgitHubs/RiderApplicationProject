import Skeleton from '@/components/common/Skeleton'
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface HubPerformanceChartProps {
  data: any[]
  isLoading?: boolean
}

export default function HubPerformanceChart({ data, isLoading }: HubPerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <Skeleton className="h-6 w-48 mb-6" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Hub Performance Comparison</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
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
  )
}
