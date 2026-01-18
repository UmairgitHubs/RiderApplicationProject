import { LucideIcon } from 'lucide-react'

interface ShipmentStatsCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: string
  bg: string
  border: string
}

export default function ShipmentStatsCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  bg, 
  border 
}: ShipmentStatsCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 ${border}`}>
      <div className={`w-8 h-8 rounded-full ${bg} ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
