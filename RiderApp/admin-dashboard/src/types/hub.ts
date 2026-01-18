export interface Hub {
  id: string
  name: string
  address: string
  capacity?: number // Raw capacity
  size_sqft?: number // Raw sqft
  status: 'Operational' | 'Maintenance' | 'Closed'
  stats: {
    totalRiders: number
    totalEmployees: number
    pendingParcels: number
    activeParcels: number
    deliveredParcels: number
    failedParcels: number
  }
  city?: string
  manager: {
    id?: string
    name: string
    role: string
    phone?: string
  }
  details: {
    capacity: string
    activeTrucks: number
    sqft: string
  }
  ridersList?: {
      id: string
      name: string
      phone: string
      is_online: boolean
      vehicle_type: string
  }[]
}
