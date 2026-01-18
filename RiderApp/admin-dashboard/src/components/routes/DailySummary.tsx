interface DailySummaryProps {
  stats?: {
    activeRoutes: number;
    pendingRoutes: number;
    deliveryOrders: number;
    totalCodValue: number;
    activeRidersCount: number;
  }
}

export default function DailySummary({ stats }: DailySummaryProps) {
  const totalRoutes = (stats?.activeRoutes || 0) + (stats?.pendingRoutes || 0)
  
  return (
    <div className="bg-[#ED7D31] rounded-[2rem] p-8 shadow-xl shadow-orange-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
      {/* Abstract Background Element */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
      
      <div className="relative z-10">
        <h3 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8 opacity-80">Operational Intelligence</h3>
        
        <div className="space-y-6">
           <div className="flex justify-between items-end border-b border-white/10 pb-4">
              <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">Aggregate Routes</span>
              <span className="text-2xl font-black text-white leading-none">{totalRoutes}</span>
           </div>
           <div className="flex justify-between items-end border-b border-white/10 pb-4">
              <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">Active Fleet</span>
              <span className="text-2xl font-black text-white leading-none">{stats?.activeRidersCount || 0}</span>
           </div>
           <div className="flex justify-between items-end border-b border-white/10 pb-4">
              <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">Pending Shipments</span>
              <span className="text-2xl font-black text-white leading-none">{stats?.deliveryOrders || 0}</span>
           </div>
           <div className="flex flex-col gap-1 pt-4">
              <span className="text-[11px] font-black text-white/70 uppercase tracking-widest">Total COD Liquidity</span>
              <span className="text-3xl font-black text-white tracking-tight">
                ${(stats?.totalCodValue || 0).toLocaleString()}
              </span>
           </div>
        </div>
      </div>
    </div>
  )
}
