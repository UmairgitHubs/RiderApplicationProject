export interface Agent {
  id: string;
  name: string;
  email: string;
  territory: string;
  referralCode: string;
  totalClients: number;
  activeClients: number;
  monthlyEarnings: number;
  totalEarnings: number;
  rating: number;
  status: 'Active' | 'Inactive';
}

export interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  totalClients: number;
  totalEarnings: number;
}

export interface AgentDetails extends Agent {
  phone: string;
  joined: string;
  lastActive: string;
  commissionRate: string;
  merchantsReferred: number;
  thisMonthEarnings: number;
  clientRetention: string;
  avgCommission: string;
  isTopPerformer: boolean;
  recentReferrals: {
    name: string;
    type: string;
    date: string;
    commission: number;
  }[];
}
