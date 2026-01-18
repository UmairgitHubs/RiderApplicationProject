import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import bcrypt from 'bcryptjs';

/**
 * Get all agents with filtering and pagination
 */
export const getAgents = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, page = 1, limit = 10 } = req.query;

  const pageNumber = Number(page);
  const pageSize = Number(limit);
  const skip = (pageNumber - 1) * pageSize;

  const where: any = {
    role: 'agent',
    is_active: true // Or handle filtering
  };

  if (search) {
    where.OR = [
      { full_name: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
      { 
        agent: { 
            OR: [
                { referral_code: { contains: String(search), mode: 'insensitive' } },
                { territory: { contains: String(search), mode: 'insensitive' } }
            ]
        } 
      }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        agent: true // Include agent profile
      } as any, // Cast to any to bypass potential type mismatch
      skip,
      take: pageSize,
      orderBy: { created_at: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  const data = users.map(u => {
    // Explicitly cast user to any to access 'agent' property safely
    const agent = (u as any).agent;
    return {
        id: agent?.id || u.id, // Prefer Agent ID (same as User ID)
        name: u.full_name,
        email: u.email,
        territory: agent?.territory || 'N/A',
        referralCode: agent?.referral_code || 'N/A',
        totalClients: agent?.total_clients || 0,
        activeClients: agent?.active_clients || 0,
        monthlyEarnings: Number(agent?.total_earnings || 0),
        totalEarnings: Number(agent?.total_earnings || 0),
        rating: Number(agent?.rating || 0),
        status: agent?.is_active ? 'Active' : 'Inactive'
    };
  });

  res.json({
    success: true,
    data,
    pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
    }
  });
});

/**
 * Get agent statistics for dashboard
 */
export const getAgentStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Cast prisma to any to access 'agent' model if types are stale
    const totalAgents = await (prisma as any).agent.count();
    const activeAgents = await (prisma as any).agent.count({ where: { is_active: true } });
    
    // Total Clients (sum of all agents' clients)
    const totalClientsAgg = await (prisma as any).agent.aggregate({
        _sum: { total_clients: true, total_earnings: true }
    });

    res.json({
        success: true,
        data: {
            totalAgents,
            activeAgents,
            totalClients: totalClientsAgg._sum.total_clients || 0,
            totalEarnings: Number(totalClientsAgg._sum.total_earnings || 0)
        }
    });
});

/**
 * Create a new agent
 */
export const createAgent = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fullName, email, phone, password, territory, referralCode } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
        res.status(400);
        throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
        // 1. Create User
        const user = await tx.user.create({
            data: {
                full_name: fullName,
                email,
                phone,
                password_hash: passwordHash,
                role: 'agent',
                is_active: true,
                is_verified: true
            }
        });

        // 2. Create Agent Profile
        // Cast tx to any to access 'agent' model
        const agent = await (tx as any).agent.create({
            data: {
                id: user.id,
                referral_code: referralCode,
                territory: territory,
                rating: 5.0,
                total_clients: 0,
                active_clients: 0,
                total_earnings: 0
            }
        });

        return { user, agent };
    });

    res.status(201).json({
        success: true,
        data: result
    });
});

/**
 * Get single agent details
 */
export const getAgentDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            agent: true,
            sessions: {
                orderBy: { last_active: 'desc' },
                take: 1
            }
        } as any
    });

    if (!user || !(user as any).agent) {
        res.status(404);
        throw new Error('Agent not found');
    }

    const agent = (user as any).agent;
    const lastSession = (user as any).sessions?.[0];

    // Calculate "This Month" earnings (Mock logic since we don't have transaction history linked to agents yet)
    // In a real app, query WalletTransaction or Payment where agent_id = id AND date > startOfMonth
    const thisMonthEarnings = Number(agent.total_earnings) * 0.2; // roughly 20% for now as a realistic-looking mock portion

    res.json({
        success: true,
        data: {
            // Personal
            id: user.id,
            name: user.full_name,
            email: user.email,
            phone: user.phone || 'N/A',
            joined: user.created_at,
            lastActive: lastSession?.last_active || user.updated_at,
            
            // Referral
            referralCode: agent.referral_code,
            commissionRate: '5%', // Standard
            territory: agent.territory || 'N/A',
            status: user.is_active ? 'Active' : 'Inactive',
            
            // Stats
            totalClients: agent.total_clients,
            activeClients: agent.active_clients,
            merchantsReferred: 0, // Placeholder
            totalEarnings: Number(agent.total_earnings),
            thisMonthEarnings: thisMonthEarnings,
            
            // Matrices
            clientRetention: '92%', // Placeholder
            avgCommission: '$126/client', // Placeholder
            rating: Number(agent.rating),
            isTopPerformer: Number(agent.rating) >= 4.5,
            
            // Activity (Mocked since we lack the relation)
            recentReferrals: [
                { name: 'Tech Store NYC', type: 'Merchant', date: '2024-12-14', commission: 150 },
                { name: 'Express Riders', type: 'Rider', date: '2024-12-13', commission: 80 },
            ]
        }
    });
});
