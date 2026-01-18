'use client'

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

const data = [
  { name: 'Jul', trend: 4000 },
  { name: 'Aug', trend: 3000 },
  { name: 'Sep', trend: 2000 },
  { name: 'Oct', trend: 2780 },
  { name: 'Nov', trend: 1890 },
  { name: 'Dec', trend: 2390 },
]

export default function SixMonthDeliveryTrend() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xs font-bold text-gray-700 mb-4">6 Month Delivery Trend</h3>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontSize: '10px' }}
            />
             <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="trend" stroke="#22c55e" strokeWidth={2} dot={false} name="Trend" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
