// User Types
export interface User {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: 'merchant' | 'rider' | 'admin' | 'hub_manager'
  is_active: boolean
  is_verified: boolean
  created_at: string
  merchant?: Merchant
  rider?: Rider
}

export interface Merchant {
  id: string
  business_name: string | null
  business_type: string | null
  wallet_balance: number
  total_spent: number
}

export interface Rider {
  id: string
  cnic: string | null
  license_number: string | null
  vehicle_type: string | null
  vehicle_number: string | null
  is_online: boolean
  wallet_balance: number
  total_earnings: number
  rating: number
  total_deliveries: number
  hub_id: string | null
}

// Shipment Types
export interface Shipment {
  id: string
  tracking_number: string
  merchant_id: string
  rider_id: string | null
  recipient_name: string
  recipient_phone: string
  recipient_email: string | null
  pickup_address: string
  pickup_latitude: number | null
  pickup_longitude: number | null
  delivery_address: string
  delivery_latitude: number | null
  delivery_longitude: number | null
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'returned'
  delivery_fee: number
  cod_amount: number
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  created_at: string
  updated_at: string
  merchant?: User
  rider?: User
}

// Hub Types
export interface Hub {
  id: string
  name: string
  address: string
  city: string
  latitude: number | null
  longitude: number | null
  manager_id: string | null
  is_active: boolean
  created_at: string
}

// Analytics Types
export interface DashboardStats {
  total_users: number
  total_merchants: number
  total_riders: number
  active_shipments: number
  completed_shipments_today: number
  revenue_today: number
  revenue_this_month: number
  online_riders: number
  pending_shipments: number
}

export interface RevenueData {
  date: string
  revenue: number
  transactions: number
}

export interface UserGrowthData {
  date: string
  merchants: number
  riders: number
  total: number
}

// Wallet Types
export interface WalletTransaction {
  id: string
  user_id: string
  transaction_type: 'credit' | 'debit'
  amount: number
  balance_after: number
  transaction_category: string | null
  description: string | null
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  user?: User
}

export interface Payment {
  id: string
  user_id: string
  shipment_id: string | null
  amount: number
  currency: string
  payment_method: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  created_at: string
  user?: User
  shipment?: Shipment
}

// Settings Types
export interface SystemSettings {
  delivery_fee_base: number
  delivery_fee_per_km: number
  min_delivery_fee: number
  max_delivery_fee: number
  cod_fee_percentage: number
  payment_gateways: {
    stripe: { enabled: boolean; public_key: string }
    jazzcash: { enabled: boolean; merchant_id: string }
    easypaisa: { enabled: boolean; merchant_id: string }
  }
  notifications: {
    email_enabled: boolean
    sms_enabled: boolean
    push_enabled: boolean
  }
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: {
    code: string
    message: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}



