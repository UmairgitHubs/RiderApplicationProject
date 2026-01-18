
export interface Profile {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  profileImageUrl: string | null
  isVerified: boolean
  languagePreference: string
  themePreference: string
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyReports: boolean
  twoFactorEnabled: boolean
  createdAt: string
  // Merchant specific
  businessName?: string
  businessType?: string
  walletBalance?: number
  totalSpent?: number
  // Rider specific
  cnic?: string
  licenseNumber?: string
  vehicleType?: string
  vehicleNumber?: string
  isOnline?: boolean
  totalEarnings?: number
  rating?: number
  totalDeliveries?: number
}

export interface UpdateProfileData {
  fullName?: string
  email?: string
  phone?: string
  profileImageUrl?: string
  languagePreference?: string
  themePreference?: string
  emailNotifications?: boolean
  pushNotifications?: boolean
  weeklyReports?: boolean
  // Merchant
  businessName?: string
  businessType?: string
  // Rider
  cnic?: string
  licenseNumber?: string
  vehicleType?: string
  vehicleNumber?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface Session {
  id: string
  device_name: string
  ip_address: string
  last_active: string
  created_at: string
  is_current?: boolean // Derived on frontend or backend
}

export interface ActivityLog {
  id: string
  action: string
  description?: string
  ip_address: string
  location?: string
  created_at: string
  user_agent?: string
}
