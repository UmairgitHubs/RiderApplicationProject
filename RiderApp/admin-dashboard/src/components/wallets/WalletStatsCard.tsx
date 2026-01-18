import { LucideIcon } from 'lucide-react'

interface WalletStatsCardProps {
  label: string
  value: string
  icon: LucideIcon
  iconColor: string
  iconBg: string
  borderColor: string
}

export default function WalletStatsCard({ 
  label, 
  value, 
  icon: Icon, 
  iconColor, 
  iconBg, 
  borderColor 
}: WalletStatsCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}
