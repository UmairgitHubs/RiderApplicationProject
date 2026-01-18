interface CMSTabsProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function CMSTabs({ activeTab, onTabChange }: CMSTabsProps) {
  const tabs = ['Faqs', 'Announcements', 'Banners', 'Legal Pages']

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`
            px-6 py-2 rounded-lg text-sm font-medium transition-all
            ${activeTab === tab 
              ? 'bg-orange-500 text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
