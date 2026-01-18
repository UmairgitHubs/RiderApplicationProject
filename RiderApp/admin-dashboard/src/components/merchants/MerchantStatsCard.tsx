import { LucideIcon } from 'lucide-react'

interface MerchantStatsCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: string
  bg: string
  border: string
}

export default function MerchantStatsCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  bg, 
  border 
}: MerchantStatsCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 ${border}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
