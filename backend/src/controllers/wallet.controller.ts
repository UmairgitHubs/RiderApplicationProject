import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';

// Get wallet balance and transactions
export const getWallet = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { page = 1, limit = 20 } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        merchant: true,
        rider: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.',
        },
      });
    }

    const walletBalance =
      user.role === 'merchant'
        ? user.merchant?.wallet_balance || 0
        : user.rider?.wallet_balance || 0;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { user_id: userId },
        skip,
        take: parseInt(limit as string),
        orderBy: { created_at: 'desc' },
      }),
      prisma.walletTransaction.count({
        where: { user_id: userId },
      }),
    ]);

    res.json({
      success: true,
      data: {
        walletBalance,
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.transaction_type,
          amount: t.amount,
          balanceAfter: t.balance_after,
          category: t.transaction_category,
          description: t.description,
          status: t.status,
          createdAt: t.created_at,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error: any) {
    logger.error('Get wallet error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching wallet information.',
      },
    });
  }
};

// Add money to wallet (for merchants)
export const addMoney = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { amount, paymentMethod, paymentProviderTransactionId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { merchant: true },
    });

    if (!user || user.role !== 'merchant') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only merchants can add money to wallet.',
        },
      });
    }

    if (!user.merchant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Merchant profile not found.',
        },
      });
    }

    // TODO: Verify payment with payment provider (Stripe, JazzCash, EasyPaisa)
    // For now, we'll assume payment is verified

    const newBalance = Number(user.merchant.wallet_balance) + parseFloat(amount);

    // Update merchant wallet
    await prisma.merchant.update({
      where: { id: userId },
      data: {
        wallet_balance: newBalance,
      },
    });

    // Create wallet transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        user_id: userId,
        transaction_type: 'credit',
        amount: parseFloat(amount),
        balance_after: newBalance,
        transaction_category: 'top_up',
        payment_method: paymentMethod,
        payment_provider_transaction_id: paymentProviderTransactionId || null,
        description: `Top up via ${paymentMethod}`,
        status: 'completed',
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        user_id: userId,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        payment_provider: paymentMethod,
        provider_transaction_id: paymentProviderTransactionId || null,
        status: 'completed',
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Money Added',
        message: `PKR ${amount} has been added to your wallet.`,
        type: 'payment',
        reference_id: transaction.id,
        reference_type: 'transaction',
      },
    });

    logger.info(`Merchant ${userId} added PKR ${amount} to wallet`);

    res.json({
      success: true,
      data: {
        walletBalance: newBalance,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          createdAt: transaction.created_at,
        },
      },
      message: 'Money added to wallet successfully.',
    });
  } catch (error: any) {
    logger.error('Add money error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while adding money to wallet.',
      },
    });
  }
};

// Withdraw money (for riders)
export const withdrawMoney = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { amount, bankAccount, accountTitle } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { rider: true },
    });

    if (!user || user.role !== 'rider') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only riders can withdraw money.',
        },
      });
    }

    if (!user.rider) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rider profile not found.',
        },
      });
    }

    const currentBalance = Number(user.rider.wallet_balance);
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: 'Insufficient balance in wallet.',
        },
      });
    }

    if (withdrawAmount < 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Minimum withdrawal amount is PKR 100.',
        },
      });
    }

    const newBalance = currentBalance - withdrawAmount;

    // Update rider wallet
    await prisma.rider.update({
      where: { id: userId },
      data: {
        wallet_balance: newBalance,
      },
    });

    // Create wallet transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        user_id: userId,
        transaction_type: 'debit',
        amount: withdrawAmount,
        balance_after: newBalance,
        transaction_category: 'withdrawal',
        description: `Withdrawal to ${bankAccount}`,
        status: 'pending', // Will be updated when processed
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        user_id: userId,
        title: 'Withdrawal Request',
        message: `Withdrawal request of PKR ${amount} has been submitted.`,
        type: 'payment',
        reference_id: transaction.id,
        reference_type: 'transaction',
      },
    });

    logger.info(`Rider ${userId} requested withdrawal of PKR ${amount}`);

    res.json({
      success: true,
      data: {
        walletBalance: newBalance,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          createdAt: transaction.created_at,
        },
      },
      message: 'Withdrawal request submitted successfully. It will be processed within 2-3 business days.',
    });
  } catch (error: any) {
    logger.error('Withdraw money error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while processing withdrawal.',
      },
    });
  }
};

// Get transaction details
export const getTransactionDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    const transaction = await prisma.walletTransaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found.',
        },
      });
    }

    if (transaction.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this transaction.',
        },
      });
    }

    res.json({
      success: true,
      data: { transaction },
    });
  } catch (error: any) {
    logger.error('Get transaction details error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching transaction details.',
      },
    });
  }
};

