export type TransactionStatus = 'Completed' | 'Pending Submission' | 'Pending'
export type TransactionType = 'COD Collection' | 'Payment' | 'Reconciliation'

export interface Transaction {
  id: string
  type: string
  trackingId: string
  rider: string
  merchant: string
  amount: number
  reconciled: boolean
  method: string
  date: string
  time?: string
  status: string
}

export interface TransactionDetails {
    id: string
    type: string
    status: string
    date: string
    currency: string
    amount: number
    amountBreakdown: {
        baseAmount: number
        deliveryFee: number
        commission: number
        netAmount: number
        baseAmountPKR: number
        deliveryFeePKR: number
        commissionPKR: number
        netAmountPKR: number
    }
    rider: {
        name: string
        id: string
    }
    merchant: {
        name: string
        id: string
    }
    paymentMethod: string
    reconciled: boolean
    timeline: {
        label: string
        time: string | null
        status: 'completed' | 'pending'
    }[]
}
