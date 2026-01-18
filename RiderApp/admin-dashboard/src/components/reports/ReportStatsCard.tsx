import { LucideIcon } from 'lucide-react'

interface ReportStatsCardProps {
  label: string
  value: string
  icon: LucideIcon
  colorClassName: string // e.g., "border-orange-500"
  iconBgClassName: string // e.g., "bg-orange-50"
  iconColorClassName: string // e.g., "text-orange-500"
}

export default function ReportStatsCard({ 
  label, 
  value, 
  icon: Icon, 
  colorClassName,
  iconBgClassName,
  iconColorClassName
}: ReportStatsCardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${colorClassName}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-xl ${iconBgClassName} ${iconColorClassName} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}
