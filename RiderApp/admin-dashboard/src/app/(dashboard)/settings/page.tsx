'use client'

import { useState } from 'react'
import { 
  Save, 
  Smartphone, 
  CreditCard, 
  Globe, 
  Bell, 
  ShieldCheck 
} from 'lucide-react'
import SettingsTabs, { SettingsTabItem } from '@/components/settings/SettingsTabs'
import SecuritySettings from '@/components/settings/SecuritySettings'
import GeneralSettings from '@/components/settings/GeneralSettings'
import PaymentFeesSettings from '@/components/settings/PaymentFeesSettings'
import SystemSettings from '@/components/settings/SystemSettings'
import NotificationSettings from '@/components/settings/NotificationSettings'

const tabs: SettingsTabItem[] = [
  { id: 'general', label: 'General', icon: Smartphone },
  { id: 'payment', label: 'Payment & Fees', icon: CreditCard },
  { id: 'system', label: 'System', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">System Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Configure system-wide settings and preferences</p>
        </div>
        <button 
          onClick={() => console.log('Save button clicked for tab:', activeTab)}
          form={
            activeTab === 'general' ? 'general-settings-form' : 
            activeTab === 'payment' ? 'payment-fees-settings-form' :
            activeTab === 'system' ? 'system-settings-form' :
            activeTab === 'notifications' ? 'notification-settings-form' :
            activeTab === 'security' ? 'security-settings-form' : undefined
          }
          type="submit"
          className="flex items-center px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors shadow-sm"
        >
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </button>
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px]">
        <SettingsTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        
        {/* Render content based on active tab */}
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'payment' && <PaymentFeesSettings />}
        {activeTab === 'system' && <SystemSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab !== 'general' && activeTab !== 'payment' && activeTab !== 'system' && activeTab !== 'notifications' && activeTab !== 'security' && (
            <div className="p-12 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 mb-4">
                    <Smartphone className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Work in Progress</h3>
                <p className="mt-2 text-sm text-gray-500">
                    The {tabs.find(t => t.id === activeTab)?.label} settings panel is currently under development.
                </p>
            </div>
        )}
      </div>
    </div>
  )
}
