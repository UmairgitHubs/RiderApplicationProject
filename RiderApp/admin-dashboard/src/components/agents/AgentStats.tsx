import { AgentStats } from '@/types/agent';
import { Users, LayoutGrid, CheckCircle2, DollarSign } from 'lucide-react';

interface AgentStatsProps {
  stats: AgentStats;
  isLoading: boolean;
}

export default function AgentStatsCard({ stats, isLoading }: AgentStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: 'Total Agents',
      value: stats.totalAgents,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-l-4 border-blue-600',
      shadow: 'shadow-sm'
    },
    {
      label: 'Active Agents',
      value: stats.activeAgents,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-l-4 border-green-600',
      shadow: 'shadow-sm'
    },
    {
      label: 'Total Clients',
      value: stats.totalClients,
      icon: LayoutGrid, // Using Box lookalike
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      border: 'border-l-4 border-orange-500',
      shadow: 'shadow-sm'
    },
    {
      label: 'Total Earnings',
      value: `$${stats.totalEarnings.toLocaleString()}`,
      icon: DollarSign, // Safest option
      color: 'text-purple-600', // As per screenshot
      bg: 'bg-purple-50',
      border: 'border-l-4 border-purple-600',
      shadow: 'shadow-sm'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden group">
             {/* Left Border Decoration */}
             <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.color.replace('text-', 'bg-')}`}></div>

             <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{item.label}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{item.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-200`}>
                    <item.icon className="w-5 h-5" />
                </div>
             </div>
        </div>
      ))}
    </div>
  );
}
