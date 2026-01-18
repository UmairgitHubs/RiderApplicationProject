export type UserType = 'Merchants' | 'Riders' | 'Agents'

export interface WalletUser {
  id: string
  name: string
  email: string
  role: string
  currentBalance: number
  pendingAmount: number
  totalDeposits: number
  totalWithdrawals: number
  lastTransactionDate: string | null
}

export interface WalletStats {
  totalBalance: number
  totalDeposits: number
  totalWithdrawals: number
  pendingAmount: number
}

export interface WalletResponse {
  users: WalletUser[]
  stats: WalletStats
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface WalletFilters {
  role: UserType
  search?: string
  page?: number
  limit?: number
}

// Transaction Types
export interface WalletTransaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  balanceAfter: number
  category: string | null
  description: string | null
  status: string
  createdAt: string
}

export interface WalletDetailsResponse {
  user: {
      id: string
      name: string
      email: string
      role: string
      currentBalance: number
  }
  transactions: WalletTransaction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
