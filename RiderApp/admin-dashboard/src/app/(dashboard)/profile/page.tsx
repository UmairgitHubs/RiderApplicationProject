'use client'

import { useState } from 'react'
import { LogOut, User } from 'lucide-react'
import ProfileHeader from '@/components/profile/ProfileHeader'
import ProfileTabs from '@/components/profile/ProfileTabs'
import PersonalInfoForm from '@/components/profile/PersonalInfoForm'
import ProfileSecurity from '@/components/profile/ProfileSecurity'
import ProfilePreferences from '@/components/profile/ProfilePreferences'
import ProfileActivityLog from '@/components/profile/ProfileActivityLog'
import { auth } from '@/lib/auth'
import { useProfile } from '@/hooks/useProfile'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal')
  const { profile, isLoadingProfile } = useProfile()

  const handleLogout = async () => {
    await auth.logout()
  }

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">Admin Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account settings and preferences</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>

      <ProfileHeader profile={profile} />

      {/* Content Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[500px] p-6">
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Render Tab Content */}
        {activeTab === 'personal' && <PersonalInfoForm profile={profile} />}
        {activeTab === 'security' && <ProfileSecurity profile={profile} />}
        {activeTab === 'preferences' && <ProfilePreferences profile={profile} />}
        {activeTab === 'activity' && <ProfileActivityLog />}
        {activeTab !== 'personal' && activeTab !== 'security' && activeTab !== 'preferences' && activeTab !== 'activity' && (
             <div className="p-12 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 mb-4">
                    <User className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Work in Progress</h3>
                <p className="mt-2 text-sm text-gray-500">
                    The {activeTab} information panel is currently under development.
                </p>
            </div>
        )}
      </div>
    </div>
  )
}
