import { Camera, Mail, Phone } from 'lucide-react'
import { Profile } from '@/types/profile'
import { format } from 'date-fns'

interface ProfileHeaderProps {
  profile?: Profile
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  if (!profile) return null

  // Get initials from full name
  const initials = profile.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 flex flex-col md:flex-row items-center gap-6 border border-gray-100">
      {/* Avatar */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-[#0369a1] flex items-center justify-center text-white text-3xl font-medium overflow-hidden">
          {profile.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt={profile.fullName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <button className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full text-white hover:bg-orange-600 transition-colors shadow-sm border-2 border-white">
          <Camera className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-xl font-bold text-gray-900">{profile.fullName}</h2>
        <p className="text-gray-500 mb-2 capitalize">{profile.role.replace('_', ' ')}</p>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <Mail className="w-4 h-4" />
            <span>{profile.email}</span>
          </div>
          {profile.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span>{profile.phone}</span>
              </div>
          )}
        </div>
      </div>

      {/* Member Since */}
      <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 mt-4 md:mt-0 min-w-[200px]">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Member Since</p>
        <p className="text-gray-900 font-bold mt-1">
            {profile.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : 'N/A'}
        </p>
      </div>
    </div>
  )
}
