import { User, Shield, Bell, Clock } from 'lucide-react'

interface ProfileTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'activity', label: 'Activity Log', icon: Clock },
  ]

  return (
    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
              ${isActive 
                ? 'border-orange-500 text-orange-500' 
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
