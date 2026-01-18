export type ShipmentStatus = 'Out for Delivery' | 'At Hub' | 'Delivered' | 'Created'
export type ShipmentPriority = 'High' | 'Normal'

export interface Shipment {
  id: string
  date: string
  merchant: {
    name: string
    code: string
  }
  customer: {
    name: string
    address: string
  }
  rider: string
  hub: string
  status: string // or ShipmentStatus
  codAmount: number
  codStatus: string
  priority: string // or ShipmentPriority
}
