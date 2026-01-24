export interface Route {
  id: string
  name: string
  rider: {
    name: string
    id: string
    avatar?: string
  }
  vehicleId: string
  status: 'Active' | 'Pending' | 'Completed' | 'Draft' | 'Assigned' | 'In Progress'
  progress: number
  pickupCount: number
  deliveryCount: number
  distance: string
  estTime: string
  startPoint: string
  totalCod: number
}

export interface AvailableRider {
  id: string
  name: string
  rating: number
  status: 'In Hub' | 'On Break'
  vehicleType: string
  vehicleId: string
}
