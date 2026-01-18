export type RiderStatus = 'Active' | 'On Break' | 'Inactive'

export interface Rider {
  id: string
  name: string
  phone: string
  email?: string
  hub: string
  hubId?: string
  location: string
  vehicle: {
    type: string
    plate: string
  }
  status: string 
  onlineStatus?: string
  activeOrders: number
  totalDeliveries?: number
  rating: number
  earnings: number
}
