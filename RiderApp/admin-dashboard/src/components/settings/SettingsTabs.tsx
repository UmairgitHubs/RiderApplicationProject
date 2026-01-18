import { LucideIcon } from 'lucide-react'

export interface SettingsTabItem {
  id: string
  label: string
  icon: LucideIcon
}

interface SettingsTabsProps {
  tabs: SettingsTabItem[]
  activeTab: string
  onTabChange: (id: string) => void
}

export default function SettingsTabs({ tabs, activeTab, onTabChange }: SettingsTabsProps) {
  return (
    <div className="flex bg-white rounded-t-xl border-b border-gray-200 px-4 md:px-6 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center px-4 md:px-6 py-4 text-sm font-medium border-b-2 transition-colors relative top-[1px] whitespace-nowrap
              ${isActive 
                ? 'border-orange-500 text-orange-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
