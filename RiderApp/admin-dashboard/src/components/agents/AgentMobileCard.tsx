import { Eye, Edit2, Copy, Star } from 'lucide-react'
import { Agent } from '@/types/agent'

interface AgentMobileCardProps {
  agent: Agent
  onViewDetails: (agent: Agent) => void
}

export default function AgentMobileCard({ agent, onViewDetails }: AgentMobileCardProps) {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm p-4 space-y-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onViewDetails(agent)}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold text-primary">{agent.id}</div>
          <div className="font-medium text-gray-900 mt-1">{agent.name}</div>
          <div className="text-xs text-gray-500">{agent.email}</div>
        </div>
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
          agent.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
        }`}>
          {agent.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-3">
        <div>
          <p className="text-gray-500 text-xs">Territory</p>
          <div className="font-medium text-gray-900">{agent.territory}</div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Referral Code</p>
          <div className="flex items-center gap-1 font-medium text-blue-600">
            {agent.referralCode}
            <Copy 
              className="w-3 h-3 cursor-pointer hover:text-blue-800" 
              onClick={(e) => { e.stopPropagation(); /* Copy Logic */ }}
            />
          </div>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Earnings</p>
          <div className="font-medium text-gray-900">${agent.monthlyEarnings.toFixed(2)}</div>
        </div>
        <div>
            <p className="text-gray-500 text-xs">Rating</p>
          <div className="flex items-center font-medium text-gray-900">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
            {agent.rating}
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
        <button 
          className="p-2 text-primary hover:bg-primary-50 rounded-md transition-colors"
          onClick={(e) => { e.stopPropagation(); onViewDetails(agent); }}
        >
          <Eye className="w-5 h-5" />
        </button>
        <button 
          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Edit2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
