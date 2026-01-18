'use client'

import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api'
import { Bell, Search, MessageCircle, Menu } from 'lucide-react'

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { data: user } = useQuery({
    queryKey: ['admin-user'],
    queryFn: () => authApi.getMe(),
  })

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
      <div className="flex-1 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            onClick={onMenuClick}
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo - visible on mobile, hidden on desktop since sidebar has it */}
          <div className="flex-shrink-0 lg:hidden">
            <h1 className="text-xl font-bold text-gray-800">CODExpress</h1>
          </div>
        </div>

        {/* Search Bar - Hidden on mobile */}
        <div className="flex-1 max-w-lg mx-4 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Search"
            />
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Chat Icon - Hidden on very small screens if needed, but keeping for now */}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <MessageCircle className="h-6 w-6" />
          </button>

          {/* Bell Icon */}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none relative"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs sm:text-sm font-medium">
                {user?.data?.full_name?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-700">
                {user?.data?.full_name || 'Admin User'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
