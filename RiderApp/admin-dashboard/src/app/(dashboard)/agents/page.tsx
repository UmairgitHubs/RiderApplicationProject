'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Plus, Search } from 'lucide-react';
import { agentsApi } from '@/lib/api/agents';
import AgentStatsCard from '@/components/agents/AgentStats';
import AgentTable from '@/components/agents/AgentTable';
import AddAgentModal from '@/components/agents/AddAgentModal';
import AgentDetailsModal from '@/components/agents/AgentDetailsModal';
import { useDebounce } from '@/hooks/use-debounce';
import { Agent } from '@/types/agent';

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Fetch Stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['agent-stats'],
    queryFn: () => agentsApi.getStats()
  });

  // Fetch Agents
  const { data: agentsData, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents', debouncedSearch],
    queryFn: () => agentsApi.getAll({ search: debouncedSearch })
  });

  const agents = agentsData?.data || [];
  const stats = statsData?.data || {
      totalAgents: 0,
      activeAgents: 0,
      totalClients: 0,
      totalEarnings: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-orange-600">Agent Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage agents, track referrals, and monitor commission earnings</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Agent
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <AgentStatsCard stats={stats} isLoading={isLoadingStats} />

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search by name, ID, email..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Agents Table */}
      {isLoadingAgents ? (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <AgentTable 
            agents={agents} 
            onAgentClick={setSelectedAgent}
        />
      )}

      {/* Modals */}
      <AddAgentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <AgentDetailsModal 
        agent={selectedAgent} 
        isOpen={!!selectedAgent} 
        onClose={() => setSelectedAgent(null)} 
      />
    </div>
  );
}
