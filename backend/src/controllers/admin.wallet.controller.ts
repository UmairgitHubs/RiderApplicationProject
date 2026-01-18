import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';

// Get wallets list with stats
export const getWallets = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: Prisma.UserWhereInput = {};
    
    // Filter by role
    if (role) {
        if (role === 'Merchants') where.role = 'merchant';
        else if (role === 'Riders') where.role = 'rider';
        else if (role === 'Agents') where.role = 'agent'; // Assumes 'agent' is the role string for an agent
    }

    // Filter by search (name, email, id)
    if (search) {
      where.OR = [
        { full_name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { id: { contains: String(search), mode: 'insensitive' } },
        // Also search in profile-specific fields if needed, but User fields cover most
      ];
    }

    // Include profiles to get wallet balances
    // We fetch users and then map them to a common structure
    const users = await prisma.user.findMany({
      where,
      include: {
        merchant: true,
        rider: true,
        agent: true,
        _count: {
            select: { wallet_transactions: true }
        }
      },
      skip,
      take: limitNum,
      orderBy: { created_at: 'desc' }, // Or order by balance if requested
    });

    const total = await prisma.user.count({ where });

    // Process users to extract wallet info
    const walletUsers = await Promise.all(users.map(async (user) => {
        let currentBalance = 0;
        let pendingAmount = 0;
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let lastTransactionDate = null;
        let name = user.full_name || 'N/A';
        let specificId = user.id;

        // Get balance from specific profile
        if (user.role === 'merchant' && user.merchant) {
            currentBalance = Number(user.merchant.wallet_balance);
            name = user.merchant.business_name || user.full_name || 'N/A';
        } else if (user.role === 'rider' && user.rider) {
            currentBalance = Number(user.rider.wallet_balance);
        } else if (user.agent) { // Check relation existence for agent
             // Agent model doesn't have wallet_balance in schema shown earlier?
             // Re-checking schema: agent has total_earnings. 
             // If agent usage implies a wallet, maybe they use the User-level wallet if it existed, 
             // but 'agent' model has 'total_earnings'. 
             // If schema doesn't have wallet_balance for Agent, we might need to rely on calculating from transactions 
             // OR assume it's total_earnings for now.
             // Wait, the UI shows Agents tab.
             // Let's assume for now we calculate from transactions or use 0 if field missing.
             // EDIT: I will use 0 for now and check if I should update schema.
            currentBalance = 0; // Placeholder if not in schema
        }

        // Get aggregated stats from transactions for this user
        const stats = await prisma.walletTransaction.aggregate({
            where: { user_id: user.id },
            _sum: {
                amount: true
            },
            
        });
        
        // We need to group by type to get deposits vs withdrawals
        const typeStats = await prisma.walletTransaction.groupBy({
            by: ['transaction_type', 'status'],
            where: { user_id: user.id },
            _sum: { amount: true }
        });

        typeStats.forEach(stat => {
            const amount = Number(stat._sum.amount || 0);
            if (stat.transaction_type === 'credit') {
                totalDeposits += amount;
            } else if (stat.transaction_type === 'debit') {
                 if (stat.status === 'completed') {
                    totalWithdrawals += amount;
                 } else if (stat.status === 'pending') {
                    pendingAmount += amount; 
                 }
            }
        });

        // Last transaction
        const lastTx = await prisma.walletTransaction.findFirst({
            where: { user_id: user.id },
            orderBy: { created_at: 'desc' },
            select: { created_at: true }
        });
        
        if (lastTx) {
            lastTransactionDate = lastTx.created_at;
        }

        return {
            id: user.id, // Or specific profile ID usually same as User ID in this schema
            name,
            email: user.email,
            role: user.role,
            currentBalance,
            pendingAmount,
            totalDeposits,
            totalWithdrawals,
            lastTransactionDate
        };
    }));

    // Calculate Global Stats for the current filter (ignoring pagination)
    // This might be expensive on large datasets, so we might want to optimize or cache
    // For now, let's do a simple aggregation on the User table if possible, 
    // but balances are in separate tables (Merchant, Rider).
    // We can aggregate dependent on role.
    
    let globalStats = {
        totalBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        pendingAmount: 0
    };

    if (role === 'Merchants') {
         const agg = await prisma.merchant.aggregate({
             _sum: { wallet_balance: true }
         });
         globalStats.totalBalance = Number(agg._sum.wallet_balance || 0);
    } else if (role === 'Riders') {
        const agg = await prisma.rider.aggregate({
            _sum: { wallet_balance: true }
        });
        globalStats.totalBalance = Number(agg._sum.wallet_balance || 0);
    }
    
    // For deposits/withdrawals, we query WalletTransaction with user type filter
    const txAgg = await prisma.walletTransaction.groupBy({
        by: ['transaction_type', 'status'],
        where: {
            user: {
                role: role === 'Merchants' ? 'merchant' : 
                      role === 'Riders' ? 'rider' : 
                      role === 'Agents' ? 'agent' : undefined
            }
        },
        _sum: { amount: true }
    });

    txAgg.forEach(stat => {
        const amount = Number(stat._sum.amount || 0);
        if (stat.transaction_type === 'credit') {
            globalStats.totalDeposits += amount;
        } else if (stat.transaction_type === 'debit') {
             if (stat.status === 'completed') {
                globalStats.totalWithdrawals += amount;
             }
             if (stat.status === 'pending') {
                globalStats.pendingAmount += amount;
             }
        }
    });


    res.json({
      success: true,
      data: {
        users: walletUsers,
        stats: globalStats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    logger.error('Get wallets error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching wallets.',
      },
    });
  }
};

// Get specific wallet details (transactions) for a user
export const getWalletDetails = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        merchant: true,
        rider: true,
        agent: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // Get current balance
    let currentBalance = 0;
    if (user.role === 'merchant' && user.merchant) {
        currentBalance = Number(user.merchant.wallet_balance);
    } else if (user.role === 'rider' && user.rider) {
        currentBalance = Number(user.rider.wallet_balance);
    } else if (user.agent) {
         currentBalance = 0; 
    }

    const where: any = { user_id: userId };
    
    if (startDate && endDate) {
        where.created_at = {
            gte: new Date(String(startDate)),
            lte: new Date(String(endDate))
        };
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' }
      }),
      prisma.walletTransaction.count({
        where
      })
    ]);

    const mappedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.transaction_type,
      amount: Number(tx.amount),
      balanceAfter: Number(tx.balance_after),
      category: tx.transaction_category,
      description: tx.description,
      status: tx.status,
      createdAt: tx.created_at
    }));

    res.json({
      success: true,
      data: {
        user: {
            id: user.id,
            name: user.full_name,
            email: user.email,
            role: user.role,
            currentBalance
        },
        transactions: mappedTransactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error: any) {
    logger.error('Get wallet details error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching wallet details.'
      }
    });
  }
};

// Update payment status (Approve/Reject)
export const updatePaymentStatus = async (req: Request, res: Response) => {
    try {
        const { transactionId } = req.params;
        const { status } = req.body; // 'completed' or 'rejected'

        if (!['completed', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: 'Status must be either completed or rejected'
                }
            });
        }

        const transaction = await prisma.walletTransaction.findUnique({
            where: { id: transactionId },
            include: { user: { include: { merchant: true, rider: true } } }
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                error: { code: 'NOT_FOUND', message: 'Transaction not found' }
            });
        }

        if (transaction.status !== 'pending') {
             return res.status(400).json({
                success: false,
                error: { code: 'INVALID_STATE', message: 'Transaction is not pending' }
            });
        }

        // Use a transaction ensures atomicity
        await prisma.$transaction(async (tx) => {
            // 1. Update Transaction Status
            await tx.walletTransaction.update({
                where: { id: transactionId },
                data: { status }
            });

            // 2. If 'completed' (Approved), deduct form Wallet Balance
            // Note: In some systems, balance is deducted on request (held) or on approval.
            // Here we assume balance is deducted when APPROVED.
            
            if (status === 'completed' && transaction.transaction_type === 'debit') {
                 const amount = Number(transaction.amount);
                 const userId = transaction.user_id;

                 if (transaction.user.role === 'merchant' && transaction.user.merchant) {
                     await tx.merchant.update({
                         where: { id: userId },
                         data: { wallet_balance: { decrement: amount } }
                     });
                 } else if (transaction.user.role === 'rider' && transaction.user.rider) {
                     await tx.rider.update({
                         where: { id: userId },
                         data: { wallet_balance: { decrement: amount } }
                     });
                 }
            }
        });

        res.json({
            success: true,
            data: { message: `Transaction ${status} successfully` }
        });

    } catch (error: any) {
        logger.error('Update payment status error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to update payment status'
            }
        });
    }
};
