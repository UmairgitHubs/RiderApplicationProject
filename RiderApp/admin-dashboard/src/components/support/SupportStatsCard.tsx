import { LucideIcon } from 'lucide-react'

interface SupportStatsCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: string
  iconBg: string
  iconColor: string
}

export default function SupportStatsCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  iconBg, 
  iconColor 
}: SupportStatsCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${color}`}>
        <div className={`w-10 h-10 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center mb-4`}>
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
    </div>
  )
}
