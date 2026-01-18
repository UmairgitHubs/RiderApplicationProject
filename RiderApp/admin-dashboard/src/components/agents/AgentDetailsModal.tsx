import { Agent, AgentDetails } from '@/types/agent';
import { X, Phone, Mail, Calendar, Clock, Copy, Users, Package, TrendingUp, DollarSign, Award, Download, Edit2, Ban, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { agentsApi } from '@/lib/api/agents';

interface AgentDetailsModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentDetailsModal({ agent, isOpen, onClose }: AgentDetailsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const { data: detailsResponse, isLoading } = useQuery({
    queryKey: ['agent-details', agent?.id],
    queryFn: () => agentsApi.getDetails(agent!.id),
    enabled: !!agent && isOpen && mounted
  });

  const details: AgentDetails | undefined = detailsResponse?.data;

  // Use the fetched details if available, otherwise fall back to the basic agent prop (for initial render)
  // or show loading state.
  // We'll use a combined object to avoid null checks everywhere, but prefer details.
  const displayData = details || (agent as unknown as AgentDetails) || null;

  if (!isOpen || !displayData || !mounted) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatDate = (dateString?: string) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
  };
  
  const formatTime = (dateString?: string) => {
      if (!dateString) return 'N/A';
       // Mock relative time logic or just return string
       return new Date(dateString).toLocaleString();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header - Fixed at top */}
        <div className="flex-none px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-white rounded-t-2xl">
            <div>
                <h2 className="text-xl font-bold text-orange-600">Agent Details</h2>
                <div className="text-sm text-gray-500 mt-1">
                    <span className="font-medium text-gray-900">{displayData.id?.substring(0, 8).toUpperCase()}</span> - {displayData.name}
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-500 transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
            
            {isLoading && !details ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            ) : (
                <>
                {/* Top Section: Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Personal Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-3 text-gray-400" />
                                <span>{displayData.phone || 'N/A'}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-4 h-4 mr-3 text-gray-400" />
                                <span>{displayData.email}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                                <span>Joined: {formatDate(displayData.joined)}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                                <Clock className="w-4 h-4 mr-3 text-gray-400" />
                                <span>Last Active: {formatTime(displayData.lastActive)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Referral Information */}
                    <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">Referral Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Referral Code:</span>
                                <button 
                                    onClick={() => copyToClipboard(displayData.referralCode)} 
                                    className="flex items-center text-blue-600 font-medium hover:text-blue-700 bg-blue-50 px-2 py-1 rounded"
                                >
                                    {displayData.referralCode}
                                    <Copy className="w-3 h-3 ml-2" />
                                </button>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Commission Rate:</span>
                                <span className="font-medium text-gray-900">{displayData.commissionRate || '5%'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Territory:</span>
                                <span className="font-medium text-gray-900">{displayData.territory || 'N/A'}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Status:</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    displayData.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {displayData.status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Colored Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Clients */}
                    <div className="bg-blue-600 text-white p-5 rounded-xl shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <Users className="w-6 h-6 mb-3 opacity-90" />
                            <div className="text-3xl font-bold">{displayData.totalClients}</div>
                            <div className="text-blue-100 text-xs mt-1">Total Clients</div>
                            <div className="text-blue-200 text-[10px] mt-0.5">{displayData.activeClients} active</div>
                        </div>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 scale-150 transform group-hover:scale-125 transition-transform">
                            <Users className="w-24 h-24" />
                        </div>
                    </div>

                    {/* Merchants Referred */}
                    <div className="bg-green-500 text-white p-5 rounded-xl shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <Package className="w-6 h-6 mb-3 opacity-90" />
                            <div className="text-3xl font-bold">{displayData.merchantsReferred || 0}</div>
                            <div className="text-green-100 text-xs mt-1">Merchants Referred</div>
                        </div>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 scale-150 transform group-hover:scale-125 transition-transform">
                            <Package className="w-24 h-24" />
                        </div>
                    </div>

                    {/* This Month Earnings */}
                    <div className="bg-orange-400 text-white p-5 rounded-xl shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <TrendingUp className="w-6 h-6 mb-3 opacity-90" />
                            <div className="text-3xl font-bold">${(displayData.thisMonthEarnings || 0).toLocaleString()}</div>
                            <div className="text-orange-100 text-xs mt-1">This Month</div>
                        </div>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 scale-150 transform group-hover:scale-125 transition-transform">
                            <TrendingUp className="w-24 h-24" />
                        </div>
                    </div>

                    {/* Total Earnings */}
                    <div className="bg-purple-600 text-white p-5 rounded-xl shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <DollarSign className="w-6 h-6 mb-3 opacity-90" />
                            <div className="text-3xl font-bold">${(displayData.totalEarnings || 0).toLocaleString()}</div>
                            <div className="text-purple-100 text-xs mt-1">Total Earnings</div>
                        </div>
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 scale-150 transform group-hover:scale-125 transition-transform">
                            <DollarSign className="w-24 h-24" />
                        </div>
                    </div>
                </div>

                {/* Performance Metrics Row */}
                <div className="bg-white border boundary-gray-200 rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-gray-100">
                    <div className="text-center px-4">
                        <div className="flex items-center justify-center text-green-500 font-bold text-xl mb-1">{displayData.clientRetention || 'N/A'}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Client Retention</div>
                    </div>
                    <div className="text-center px-4">
                        <div className="flex items-center justify-center text-blue-500 font-bold text-xl mb-1">{displayData.avgCommission || 'N/A'}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Avg Commission</div>
                    </div>
                    <div className="text-center px-4">
                        <div className="flex items-center justify-center text-orange-500 font-bold text-xl mb-1">{displayData.rating || 0}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Agent Rating</div>
                    </div>
                    <div className="text-center px-4">
                        <div className="flex items-center justify-center mb-1">
                            {displayData.isTopPerformer ? <Award className="w-6 h-6 text-yellow-400" /> : <span className="text-gray-400">-</span>}
                        </div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Top Performer</div>
                    </div>
                </div>

                {/* Monthly Earnings Trend Placeholder */}
                <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        Monthly Earnings Trend
                    </h3>
                    {/* Visual Placeholder for Chart */}
                    <div className="h-40 flex items-end justify-between gap-2 px-4 border-b border-gray-200 pb-2">
                        {[35, 45, 30, 60, 75, 50, 65, 80, 55, 70, 90, 85].map((h, i) => (
                            <div key={i} className="w-full bg-blue-50 rounded-t-sm hover:bg-blue-100 transition-colors relative group" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    ${h * 100}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
                        <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Dec</span>
                    </div>
                </div>

                {/* Recent Referrals */}
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            Recent Referrals
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {displayData.recentReferrals?.length > 0 ? (
                            displayData.recentReferrals.map((ref, idx) => (
                                <div key={idx} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">{ref.name}</h4>
                                        <div className="text-xs text-gray-500 mt-0.5">{ref.type} • {ref.date}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-green-600">+${ref.commission}</div>
                                        <div className="text-[10px] text-gray-400 uppercase">Commission</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-6 py-8 text-center text-gray-500 text-sm">No recent referrals</div>
                        )}
                    </div>
                </div>
                </>
            )}
        </div>

        {/* Footer Actions - Fixed at bottom */}
        <div className="flex-none bg-white border-t border-gray-100 p-6 flex flex-wrap gap-3 justify-between items-center z-10 rounded-b-2xl">
            <button className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base">
                <Edit2 className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Edit</span>
            </button>
            <button className="flex-1 flex items-center justify-center px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-sm sm:text-base">
                <CreditCard className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Pay</span>
            </button>
            <button className="flex-1 flex items-center justify-center px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm sm:text-base">
                <Download className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Export</span>
            </button>
             <button className="flex-1 flex items-center justify-center px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm sm:text-base">
                <Ban className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Suspend</span>
            </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
