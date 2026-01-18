'use client'

import { format } from 'date-fns'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'

interface WeeklyDeliveryTrendsProps {
  data?: any[]
}

export default function WeeklyDeliveryTrends({ data = [] }: WeeklyDeliveryTrendsProps) {

  const chartData = data.map(item => ({
    ...item,
    formattedDate: format(new Date(item.date), 'MMM d')
  }))

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold text-gray-700 mb-4">Daily Delivery Trends</h3>
      <div className="h-[200px] w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '10px', color: '#0f172a' }}
              />
              <Bar dataKey="deliveries" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} name="Deliveries" />
            </BarChart>
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
