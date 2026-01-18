import { Agent } from '@/types/agent';
import { Eye, Edit2, Copy, Star } from 'lucide-react';
import { toast } from 'sonner';

interface AgentTableProps {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
}

export default function AgentTable({ agents, onAgentClick }: AgentTableProps) {
    
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
            .scrollbar-hide {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }
        `}</style>
        <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent ID</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Territory</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Referral Code</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Total Clients</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly Earnings</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Rating</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {agents.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                No agents found
                            </td>
                        </tr>
                    ) : (
                        agents.map((agent) => (
                            <tr 
                                key={agent.id} 
                                className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                onClick={() => onAgentClick(agent)}
                            >
                                {/* Agent ID */}
                                <td className="px-4 py-4">
                                    <span className="text-sm font-medium text-orange-600">
                                        {agent.id.substring(0, 8).toUpperCase()}
                                    </span>
                                </td>

                                {/* Name & Email */}
                                <td className="px-4 py-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                                        <p className="text-xs text-gray-500">{agent.email}</p>
                                    </div>
                                </td>

                                {/* Territory */}
                                <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">
                                    {agent.territory}
                                </td>

                                {/* Referral Code */}
                                <td className="px-4 py-4 hidden lg:table-cell">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-100">
                                            {agent.referralCode}
                                        </span>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); copyToClipboard(agent.referralCode); }}
                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Copy className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </td>

                                {/* Clients */}
                                <td className="px-4 py-4 hidden sm:table-cell">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{agent.totalClients}</p>
                                        <p className="text-xs text-gray-500">{agent.activeClients} active</p>
                                    </div>
                                </td>

                                {/* Earnings */}
                                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                    ${agent.monthlyEarnings.toLocaleString()}
                                </td>

                                {/* Rating */}
                                <td className="px-4 py-4 hidden xl:table-cell">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-medium text-gray-900">{agent.rating}</span>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${agent.status === 'Active' 
                                            ? 'bg-green-50 text-green-700 border border-green-100' 
                                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                                        }`}
                                    >
                                        {agent.status}
                                    </span>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onAgentClick(agent); }}
                                            className="p-1.5 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => e.stopPropagation()}
                                            className="p-1.5 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    </div>
  );
}
