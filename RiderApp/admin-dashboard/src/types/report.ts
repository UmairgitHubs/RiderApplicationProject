export interface ReportStat {
  label: string
  value: string
  change: number
  trend: 'up' | 'down' | 'neutral'
  period: string
}

export interface RevenueData {
  date: string
  revenue: number
  orders: number
}

export interface StatusData {
  name: string
  value: number
  color: string
}

export interface PerformerData {
  name: string
  value: number
  image?: string
}

export interface ReportFile {
  id: string
  name: string
  type: 'PDF' | 'CSV' | 'XLSX'
  generatedBy: string
  date: string
  status: 'Ready' | 'Processing' | 'Failed'
  size: string
}
