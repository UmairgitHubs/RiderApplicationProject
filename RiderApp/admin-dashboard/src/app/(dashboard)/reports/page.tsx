'use client'

import { useState } from 'react'
import { 
  Download, 
  Calendar, 
  Package, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2,
  RefreshCw,
  Loader2
} from 'lucide-react'
import ReportStatsCard from '@/components/reports/ReportStatsCard'
import ReportTabs from '@/components/reports/ReportTabs'
import RevenueCodTrends from '@/components/reports/RevenueCodTrends'
import WeeklyDeliveryTrends from '@/components/reports/WeeklyDeliveryTrends'
import DeliveryStatusDistribution from '@/components/reports/DeliveryStatusDistribution'
import PaymentMethodDistribution from '@/components/reports/PaymentMethodDistribution'
import RiderPerformanceChart from '@/components/reports/RiderPerformanceChart'
import HubPerformanceChart from '@/components/reports/HubPerformanceChart'
import MerchantPerformanceChart from '@/components/reports/MerchantPerformanceChart'
import { useQuery } from '@tanstack/react-query'
import { reportsApi, ReportsResponse } from '@/lib/api/reports'
import { format, subDays } from 'date-fns'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('Deliveries')
  const [range, setRange] = useState('last_30_days')

  const { data, isLoading, refetch, isRefetching } = useQuery<ReportsResponse>({
    queryKey: ['reports', range],
    queryFn: async () => {
       const now = new Date();
       let startDate = subDays(now, 30);
       
       if (range === 'last_7_days') startDate = subDays(now, 7);
       if (range === 'last_90_days') startDate = subDays(now, 90);
       
       return reportsApi.getReports({
           startDate: startDate.toISOString(),
           endDate: now.toISOString()
       })
    }
  })

  // Helper for KPI conditional values
  const getSuccessRate = () => {
      if (activeTab === 'Merchants') return `${data?.merchants.length || 0} Partners`;
      if (activeTab === 'Hubs') return `${data?.hubs.length || 0} Centers`;
      if (activeTab === 'Riders') return `${data?.riders.length || 0} Members`;
      return `${data?.kpi.success_rate || 0}%`;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orange-500">Reports & Analytics</h1> 
          <p className="text-gray-500 text-sm mt-1">
            Comprehensive reports and performance analytics
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
             value={range}
             onChange={(e) => setRange(e.target.value)}
             className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
             <option value="last_7_days">Last 7 Days</option>
             <option value="last_30_days">Last 30 Days</option>
             <option value="last_90_days">Last 90 Days</option>
          </select>
          
          <button 
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="flex items-center px-4 py-2 bg-white border border-orange-200 text-orange-500 rounded-lg hover:bg-orange-50 font-medium transition-colors shadow-sm disabled:opacity-50"
          >
             <RefreshCw className={`w-4 h-4 mr-2 ${isLoading || isRefetching ? 'animate-spin' : ''}`} />
             Sync
          </button>

          <button className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <ReportTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {isLoading ? (
          <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
      ) : (
        <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ReportStatsCard 
                label={activeTab === 'Merchants' ? 'Active Merchants' : activeTab === 'Hubs' ? 'Operational Hubs' : activeTab === 'Riders' ? 'Active Riders' : 'Total Deliveries'}
                value={activeTab === 'Deliveries' ? (data?.kpi.total_deliveries.toLocaleString() || '0') : (activeTab === 'Riders' ? data?.riders.length : activeTab === 'Hubs' ? data?.hubs.length : data?.merchants.length)?.toString() || '0'}
                icon={Package}
                colorClassName="border-orange-500"
                iconBgClassName="bg-orange-50"
                iconColorClassName="text-orange-500"
                />
                <ReportStatsCard 
                label="Total Revenue"
                value={`$${data?.kpi.total_revenue.toLocaleString() || '0'}`}
                icon={DollarSign}
                colorClassName="border-green-500"
                iconBgClassName="bg-green-50"
                iconColorClassName="text-green-500"
                />
                <ReportStatsCard 
                label="COD Collections"
                value={`$${data?.kpi.total_cod.toLocaleString() || '0'}`}
                icon={TrendingUp}
                colorClassName="border-yellow-500"
                iconBgClassName="bg-yellow-50"
                iconColorClassName="text-yellow-500"
                />
                <ReportStatsCard 
                label={activeTab === 'Deliveries' ? 'Success Rate' : 'Total Reach'}
                value={getSuccessRate()}
                icon={CheckCircle2}
                colorClassName="border-purple-500"
                iconBgClassName="bg-purple-50"
                iconColorClassName="text-purple-500"
                />
            </div>

            {activeTab === 'Deliveries' && (
                <>
                    {/* Analytics Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RevenueCodTrends data={data?.trends} />
                        <WeeklyDeliveryTrends data={data?.trends} />
                    </div>

                    {/* Analytics Charts Row 2 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DeliveryStatusDistribution data={data?.distribution.status} />
                        <PaymentMethodDistribution data={data?.distribution.payment} />
                    </div>
                </>
            )}

            {activeTab === 'Riders' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RiderPerformanceChart data={data?.riders} />
                    <RevenueCodTrends data={data?.trends} />
                </div>
            )}

            {activeTab === 'Hubs' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <HubPerformanceChart data={data?.hubs} />
                    <WeeklyDeliveryTrends data={data?.trends} />
                </div>
            )}

            {activeTab === 'Merchants' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <MerchantPerformanceChart data={data?.merchants} />
                    <RevenueCodTrends data={data?.trends} />
                </div>
            )}
        </>
      )}
    </div>
  )
}
