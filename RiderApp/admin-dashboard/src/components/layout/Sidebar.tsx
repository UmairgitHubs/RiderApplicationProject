'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Package,
  Building2,
  Bike,
  Route,
  Warehouse,
  Users,
  FileText,
  Wallet,
  BarChart3,
  MessageCircle,
  FileEdit,
  Settings,
  User,
  LogOut,
  Grid3x3,
  X
} from 'lucide-react'
import { auth } from '@/lib/auth'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Grid3x3 },
  { name: 'Shipments', href: '/shipments', icon: Package },
  { name: 'Merchants', href: '/merchants', icon: Building2 },
  { name: 'Riders', href: '/riders', icon: Bike },
  { name: 'Route Planning', href: '/routes', icon: Route },
  { name: 'Hubs', href: '/hubs', icon: Warehouse },
  { name: 'Agents', href: '/agents', icon: Users },
  { name: 'Payments & COD', href: '/payments', icon: FileText },
  { name: 'Wallets', href: '/wallets', icon: Wallet },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Support & Chat', href: '/support', icon: MessageCircle },
  { name: 'CMS / Content', href: '/cms', icon: FileEdit },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  
  const handleLogout = async () => {
    await auth.logout()
  }

  // Simple cookie parser to get user role
  // In a real app, use a proper hook or context
  function getCookie(name: string) {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  }

  // Note: This run on client side only
  const userRole = typeof window !== 'undefined' ? getCookie('user_role') : null;
  const isHubManager = userRole === 'hub_manager';

  const filteredNavigation = navigation.filter(item => {
    if (isHubManager) {
        // Restricted items for Hub Manager
        const restricted = ['Settings', 'Reports', 'CMS / Content', 'Agents', 'Merchants'];
        return !restricted.includes(item.name);
    }
    return true; // Admin sees all
  });

  return (
    <div className="flex flex-col flex-grow bg-gray-100 pt-5 pb-4 overflow-y-auto h-full">
      <div className="flex items-center flex-shrink-0 px-4 mb-6 justify-between">
        <h1 className="text-xl font-bold text-gray-800">CODExpress</h1>
        {onClose && (
           <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
             <X className="h-6 w-6" />
           </button>
        )}
      </div>
      <div className="mt-5 flex-grow flex flex-col">
        <nav className="flex-1 px-2 space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                  ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? 'text-white' : 'text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-300 p-4">
        <button
          onClick={handleLogout}
          className="flex-shrink-0 w-full group block"
        >
          <div className="flex items-center text-gray-700 hover:text-gray-900">
            <LogOut className="h-5 w-5 text-gray-500" />
            <span className="ml-3 text-sm font-medium">
              Logout
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="relative z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-900/80 transition-opacity" 
            onClick={onClose}
          />
          
          {/* Sidebar Panel */}
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white transition-transform">
            <SidebarContent onClose={onClose} />
          </div>
        </div>
      )}
    </>
  )
}
