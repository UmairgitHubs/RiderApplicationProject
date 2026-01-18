import { Package, Bike, Warehouse, DollarSign } from 'lucide-react'

interface ReportTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function ReportTabs({ activeTab, onTabChange }: ReportTabsProps) {
  const tabs = [
    { id: 'Deliveries', icon: Package },
    { id: 'Riders', icon: Bike },
    { id: 'Hubs', icon: Warehouse },
    { id: 'Merchants', icon: DollarSign },
  ]

  return (
    <div className="flex flex-wrap gap-4">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center px-6 py-3 rounded-xl font-medium transition-all shadow-sm
              ${isActive 
                ? 'bg-orange-500 text-white shadow-orange-200' 
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
              }
            `}
          >
            <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-white' : 'text-gray-400'}`} />
            {tab.id}
          </button>
        )
      })}
    </div>
  )
}
