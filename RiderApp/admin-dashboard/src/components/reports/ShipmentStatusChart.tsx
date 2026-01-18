'use client'

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts'
import { StatusData } from '@/types/report'

interface ShipmentStatusChartProps {
  data: StatusData[]
}

export default function ShipmentStatusChart({ data }: ShipmentStatusChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900">Shipment Status</h3>
        <p className="text-sm text-gray-500">Distribution of current shipments</p>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: '#1e293b', fontSize: '12px', fontWeight: 600 }}
            />
            <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                    <span className="text-xs text-gray-600 font-medium ml-1">{value}</span>
                )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
