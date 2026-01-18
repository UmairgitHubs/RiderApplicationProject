import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';

/**
 * Get all merchants (Admin View)
 * Includes stats like total orders (shipments) and wallet balance.
 */
export const getAllMerchants = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, page = 1, limit = 20 } = req.query;

  const where: any = { role: 'merchant' };
  
  if (search) {
    where.OR = [
      { full_name: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
      { merchant: { business_name: { contains: String(search), mode: 'insensitive' } } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [merchants, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        email: true,
        is_active: true,
        merchant: {
          select: {
            business_name: true,
            city: true,
            wallet_balance: true,
          }
        },
        _count: {
          select: {
            shipments_as_merchant: true // Total orders
          }
        },
      }
    }),
    prisma.user.count({ where })
  ]);

  // Transform to match frontend Merchant interface
  const formattedMerchants = await Promise.all(merchants.map(async (m) => {
    // Optional: Fetch active orders count separately if critical
    const activeOrders = await prisma.shipment.count({
      where: {
        merchant_id: m.id,
        status: { in: ['pending', 'assigned', 'picked_up', 'in_transit'] }
      }
    });

    return {
      id: m.id,
      name: m.merchant?.business_name || m.full_name || 'Unknown',
      location: m.merchant?.city || 'Unknown',
      owner: { name: m.full_name },
      category: 'Retail', // Placeholder as not in schema
      activeOrders: activeOrders,
      totalOrders: m._count.shipments_as_merchant,
      rating: 5.0, // Placeholder
      wallet: Number(m.merchant?.wallet_balance || 0),
      status: m.is_active ? 'Active' : 'Suspended'
    };
  }));

  res.json({
    success: true,
    data: {
      merchants: formattedMerchants,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / take)
      }
    }
  });
});

/**
 * Get Merchant Stats (Summary cards)
 */
export const getMerchantStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [totalMerchants, activeMerchants, totalShipments] = await Promise.all([
    prisma.user.count({ where: { role: 'merchant' } }),
    prisma.user.count({ where: { role: 'merchant', is_active: true } }),
    prisma.shipment.count({}) // Total shipments in system
  ]);

  const suspendedMerchants = totalMerchants - activeMerchants;

  res.json({
    success: true,
    data: {
      totalMerchants,
      activeMerchants,
      suspendedMerchants,
      totalShipments
    }
  });
});

/**
 * Get Merchant Details (Deep Dive for Modal)
 */
export const getMerchantDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const merchantUser = await prisma.user.findUnique({
    where: { id },
    include: {
      merchant: true,
      addresses: true
    }
  });

  if (!merchantUser) {
    res.status(404).json({ success: false, message: 'Merchant not found' });
    return;
  }

  // Calculate Stats
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalShipments,
    completedToday,
    pendingPickup,
    activeOrders, 
    recentOrders,
    monthlyRevenue
  ] = await Promise.all([
    prisma.shipment.count({ where: { merchant_id: id } }),
    prisma.shipment.count({ 
      where: { 
        merchant_id: id, 
        status: 'delivered',
        updated_at: { gte: todayStart }
      } 
    }),
    prisma.shipment.count({ 
      where: { 
        merchant_id: id, 
        status: 'pending' // pending pickup
      } 
    }),
    prisma.shipment.count({ 
        where: { 
          merchant_id: id, 
          status: { in: ['pending', 'assigned', 'picked_up', 'in_transit'] }
        } 
    }),
    prisma.shipment.findMany({
      where: { merchant_id: id },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        tracking_number: true,
        recipient_name: true,
        cod_amount: true,
        created_at: true,
        status: true
      }
    }),
    prisma.shipment.aggregate({
      where: {
        merchant_id: id,
        status: 'delivered',
        created_at: { gte: monthStart }
      },
      _sum: { cod_amount: true }
    })
  ]);

  const totalRevenue = await prisma.shipment.aggregate({
    where: { merchant_id: id, status: 'delivered' },
    _sum: { cod_amount: true }
  });

  res.json({
    success: true,
    data: {
      profile: {
        id: merchantUser.id,
        name: merchantUser.merchant?.business_name || merchantUser.full_name,
        contactName: merchantUser.full_name,
        email: merchantUser.email,
        phone: merchantUser.phone,
        address: merchantUser.merchant?.address || merchantUser.addresses[0]?.address_line1 || 'No address',
        joinedAt: merchantUser.created_at,
        category: merchantUser.merchant?.business_type || 'Retail',
        status: merchantUser.is_active ? 'Active' : 'Suspended',
        rating: 5.0 // Mock rating
      },
      stats: {
        totalOrders: totalShipments,
        completedToday,
        pendingPickup,
        walletBalance: Number(merchantUser.merchant?.wallet_balance || 0),
        activeOrders
      },
      financials: {
        totalRevenue: Number(totalRevenue._sum.cod_amount || 0),
        monthlyRevenue: Number(monthlyRevenue._sum.cod_amount || 0),
        avgOrderValue: totalShipments > 0 ? Number(totalRevenue._sum.cod_amount || 0) / totalShipments : 0
      },
      recentOrders: recentOrders.map(o => ({
        id: o.tracking_number,
        customer: o.recipient_name,
        amount: Number(o.cod_amount),
        time: o.created_at,
        status: o.status
      }))
    }
  });
});

/**
 * Update Merchant Profile
 */
export const updateMerchant = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { 
    fullName, 
    email, 
    phone, 
    businessName, 
    businessAddress, 
    category,
    status 
  } = req.body;

  // Check if merchant exists
  const existingMerchant = await prisma.user.findUnique({
    where: { id },
    include: { merchant: true }
  });

  if (!existingMerchant) {
    res.status(404).json({ success: false, message: 'Merchant not found' });
    return;
  }

  // Determine is_active status
  let is_active = existingMerchant.is_active;
  if (status) {
    is_active = status === 'Active';
  }

  // Perform updates in transaction
  const updatedUser = await prisma.$transaction(async (tx) => {
    // 1. Update User basic info
    const user = await tx.user.update({
      where: { id },
      data: {
        full_name: fullName,
        email: email,
        phone: phone,
        is_active: is_active
      }
    });

    // 2. Update Merchant profile info
    if (existingMerchant.merchant) {
      await tx.merchant.update({
        where: { id: existingMerchant.merchant.id },
        data: {
          business_name: businessName,
          address: businessAddress,
          business_type: category
        }
      });
    }

    return user;
  });

  res.json({
    success: true,
    message: 'Merchant updated successfully',
    data: {
      id: updatedUser.id,
      status: updatedUser.is_active ? 'Active' : 'Inactive'
    }
  });
});

/**
 * Create New Merchant
 */
export const createMerchant = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fullName, email, phone, password, businessName, businessAddress, category, taxId } = req.body;
    
    // Basic validation
    if (!email || !password || !fullName || !businessName) {
         res.status(400).json({ success: false, message: 'Missing required fields' });
         return;
    }

    // Check if user or business exists
    const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (existingUser) {
        res.status(400).json({ success: false, message: 'User with this email already exists' });
        return;
    }

    const { hash } = await import('bcryptjs'); 
    const passwordHash = await hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
        // Create User
        const newUser = await tx.user.create({
            data: {
                full_name: fullName,
                email,
                password_hash: passwordHash,
                phone,
                role: 'merchant',
                is_active: true,
                is_verified: true // Admin created, so auto-verify?
            }
        });

        // Create Merchant Profile
        await tx.merchant.create({
            data: {
                id: newUser.id,
                business_name: businessName,
                address: businessAddress,
                business_type: category, // Mapping category to business_type
                tax_id: taxId
            }
        });

        return newUser;
    });

    res.status(201).json({ success: true, message: 'Merchant created successfully', data: user });
});
