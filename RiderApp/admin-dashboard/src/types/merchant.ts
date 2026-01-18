export type MerchantStatus = 'Active' | 'Suspended' | 'Inactive'

export interface Merchant {
  id: string
  name: string
  location: string
  owner: { name: string }
  category: string
  activeOrders: number
  totalOrders: number
  rating: number
  wallet: number
  status: string // or MerchantStatus
}
