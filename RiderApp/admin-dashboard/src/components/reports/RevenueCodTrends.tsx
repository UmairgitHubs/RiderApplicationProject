'use client'

import { format } from 'date-fns'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'

interface RevenueCodTrendsProps {
  data?: any[]
}

export default function RevenueCodTrends({ data = [] }: RevenueCodTrendsProps) {
  
  // Format date for display
  const chartData = data.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), 'MMM d')
  }))

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold text-gray-700 mb-4">Revenue & COD Trends</h3>
      <div className="h-[200px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false} 
                minTickGap={30}
              />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '10px' }}
                labelStyle={{ color: '#64748b', fontSize: '10px' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="cod" stroke="#f59e0b" strokeWidth={2} dot={false} name="COD" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No data available
          </div>
        )}
      </div>
    </div>
  )
}
