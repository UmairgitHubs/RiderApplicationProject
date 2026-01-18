import { LucideIcon } from 'lucide-react'

interface PaymentStatsCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: string
  bg: string
  border: string
}

export default function PaymentStatsCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  bg, 
  border 
}: PaymentStatsCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 ${border} relative overflow-hidden`}>
      <div className="flex flex-col h-full justify-between">
        <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center mb-3`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-xs font-medium text-gray-500 mt-1 leading-tight">{label}</p>
        </div>
      </div>
    </div>
  )
}
