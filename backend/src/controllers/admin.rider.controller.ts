import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';

/**
 * Get all riders (Admin View)
 */
export const getAllRiders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, page = 1, limit = 20, status, is_online } = req.query;

  const where: any = { role: 'rider' };
  
  // Search
  if (search) {
    where.OR = [
      { full_name: { contains: String(search), mode: 'insensitive' } },
      { phone: { contains: String(search), mode: 'insensitive' } },
      { email: { contains: String(search), mode: 'insensitive' } },
      { rider: { vehicle_number: { contains: String(search), mode: 'insensitive' } } }
    ];
  }

  // Status Filter
  if (status && status !== 'all') {
    if (status === 'active') where.is_active = true;
    else if (status === 'inactive') where.is_active = false;
  }

  // Online Status
  if (is_online !== undefined && is_online !== 'all') {
    where.rider = { 
        ...where.rider,
        is_online: is_online === 'true' 
    };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [riders, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        is_active: true,
        rider: {
          select: {
            vehicle_type: true,
            vehicle_number: true,
            is_online: true,
            hub_id: true,
            rating: true,
            total_earnings: true,
            total_deliveries: true
          }
        },
        _count: {
            select: {
                shipments_as_rider: true
            }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  // Transform
  const formattedRiders = await Promise.all(riders.map(async (r) => {
     // Fetch active orders count
     const activeOrders = await prisma.shipment.count({
        where: { rider_id: r.id, status: { in: ['assigned', 'picked_up', 'in_transit'] } }
     });
     
     // Fetch Hub Name if needed
     let hubName = 'Unknown';
     if (r.rider?.hub_id) {
         const hub = await prisma.hub.findUnique({ where: { id: r.rider.hub_id }, select: { name: true } });
         hubName = hub?.name || 'Unknown';
     }

     return {
        id: r.id,
        name: r.full_name,
        phone: r.phone,
        email: r.email,
        hub: hubName,
        hubId: r.rider?.hub_id,
        location: 'Unknown', // Need location tracking for this
        vehicle: {
            type: r.rider?.vehicle_type || 'Unknown',
            plate: r.rider?.vehicle_number || 'N/A'
        },
        status: r.is_active ? 'Active' : 'Inactive',
        onlineStatus: r.rider?.is_online ? 'Online' : 'Offline',
        activeOrders,
        totalDeliveries: r.rider?.total_deliveries || 0,
        rating: Number(r.rider?.rating || 0),
        earnings: Number(r.rider?.total_earnings || 0)
     }
  }));

  res.json({
    success: true,
    data: {
      riders: formattedRiders,
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
 * Get Rider Stats
 */
export const getRiderStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [totalRiders, activeRiders, onlineRiders] = await Promise.all([
    prisma.user.count({ where: { role: 'rider' } }),
    prisma.user.count({ where: { role: 'rider', is_active: true } }),
    prisma.rider.count({ where: { is_online: true } })
  ]);

  res.json({
     success: true,
     data: {
         totalRiders,
         activeRiders,
         onlineRiders,
         inactiveRiders: totalRiders - activeRiders
     }
  });
});

/**
 * Get Rider Details
 */
export const getRiderDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const riderUser = await prisma.user.findUnique({
        where: { id },
        include: { rider: true }
    });

    if (!riderUser || riderUser.role !== 'rider') {
        res.status(404).json({ success: false, message: 'Rider not found' });
        return;
    }

    // Stats
    const [activeOrders, completedOrders] = await Promise.all([
        prisma.shipment.count({ where: { rider_id: id, status: { in: ['assigned', 'picked_up', 'in_transit'] } } }),
        prisma.shipment.count({ where: { rider_id: id, status: 'delivered' } })
    ]);

    // Recent Orders
    const recentOrders = await prisma.shipment.findMany({
        where: { rider_id: id },
        take: 5,
        orderBy: { created_at: 'desc' },
        select: {
            id: true,
            tracking_number: true,
            pickup_address: true,
            delivery_address: true,
            status: true,
            cod_amount: true,
            created_at: true 
        }
    });

    res.json({
        success: true,
        data: {
            profile: {
                ...riderUser,
                vehicle: {
                    type: riderUser.rider?.vehicle_type,
                    number: riderUser.rider?.vehicle_number
                },
                onlineStatus: riderUser.rider?.is_online ? 'Online' : 'Offline'
            },
            stats: {
                activeOrders,
                completedOrders,
                totalEarnings: Number(riderUser.rider?.total_earnings || 0),
                walletBalance: Number(riderUser.rider?.wallet_balance || 0),
                rating: Number(riderUser.rider?.rating || 0)
            },
            recentOrders
        }
    });
});

/**
 * Update Rider
 */
export const updateRider = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { fullName, email, phone, vehicleType, vehicleNumber, status, hubId } = req.body;

    const user = await prisma.$transaction(async (tx) => {
        // Update User
        const updatedUser = await tx.user.update({
            where: { id },
            data: {
                full_name: fullName,
                email: email,
                phone: phone,
                is_active: status === 'Active'
            }
        });

        // Update Rider Profile
        await tx.rider.update({
            where: { id },
            data: {
                vehicle_type: vehicleType,
                vehicle_number: vehicleNumber,
                hub_id: hubId
            }
        });

        return updatedUser;
    });

    res.json({ success: true, message: 'Rider updated successfully', data: user });
});

/**
 * Assign Orders to Rider
 */
export const assignOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params; // Rider ID
    const { shipmentIds } = req.body;

    if (!shipmentIds || !Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        res.status(400).json({ success: false, message: 'Please provide shipmentIds' });
        return;
    }

    // Verify Rider Exists
    const rider = await prisma.user.findUnique({
        where: { id, role: 'rider' }
    });

    if (!rider) {
        res.status(404).json({ success: false, message: 'Rider not found' });
        return;
    }

    // Transaction: Update Shipments and Create Tracking History
    await prisma.$transaction(async (tx) => {
        // 1. Update Shipments
        await tx.shipment.updateMany({
            where: { id: { in: shipmentIds } },
            data: {
                rider_id: id,
                status: 'assigned',
                updated_at: new Date()
            }
        });

        // 2. Add Tracking History for each shipment
        // process sequentially or Promise.all - simple loop is fine inside transaction
        for (const shipmentId of shipmentIds) {
             await tx.shipmentTracking.create({
                data: {
                    shipment_id: shipmentId,
                    status: 'assigned',
                    updated_by: req.user?.id || null, // Admin ID
                    notes: `Assigned to rider ${rider.full_name}`
                }
             });
        }
    });

    res.json({ success: true, message: `Successfully assigned ${shipmentIds.length} orders to rider` });
});

/**
 * Delete Rider
 */
export const deleteRider = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check if rider exists
    const rider = await prisma.user.findUnique({
        where: { id, role: 'rider' }
    });

    if (!rider) {
        res.status(404).json({ success: false, message: 'Rider not found' });
        return;
    }

    // Perform Delete
    await prisma.$transaction(async (tx) => {
        // Delete related shipments association (set to unassigned or null? or keep history?)
        // Usually, we might restrict deletion if active orders exist.
        // For now, let's assume we just unlink shipments or rely on schema cascade (if configured)
        // Schema generally: Shipment -> Rider (optional). So we set rider_id to null?
        
        await tx.shipment.updateMany({
            where: { rider_id: id },
            data: { rider_id: null, status: 'pending' } // Determine strictly. Maybe just rider_id -> null.
        });

        // Delete Rider Profile
        await tx.rider.delete({
            where: { id }
        });

        // Delete User
        await tx.user.delete({
            where: { id }
        });
    });

    res.json({ success: true, message: 'Rider deleted successfully' });
});

/**
 * Suspend Rider
 */
export const suspendRider = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const rider = await prisma.user.findUnique({
        where: { id, role: 'rider' }
    });

    if (!rider) {
        res.status(404).json({ success: false, message: 'Rider not found' });
        return;
    }

    // Toggle status or Force Suspend?
    // "Suspend" implies making inactive.
    
    await prisma.user.update({
        where: { id },
        data: { is_active: false }
    });

    // Optionally set Rider online status to false
    await prisma.rider.update({
        where: { id },
        data: { is_online: false }
    });

    res.json({ success: true, message: 'Rider suspended successfully' });
});

/**
 * Create New Rider
 */
export const createRider = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fullName, email, phone, password, vehicleType, vehicleNumber, hubId } = req.body;
    
    // Basic validation
    if (!email || !password || !fullName) {
         res.status(400).json({ success: false, message: 'Missing required fields' });
         return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } }
    });

    if (existingUser) {
        res.status(400).json({ success: false, message: 'User with this email already exists' });
        return;
    }

    const { hash } = await import('bcryptjs'); // Dynamic import or use shared util if available
    const passwordHash = await hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
        // Create User
        const newUser = await tx.user.create({
            data: {
                full_name: fullName,
                email,
                password_hash: passwordHash,
                phone,
                role: 'rider',
                is_active: true,
                is_verified: true // Admin created, so auto-verify?
            }
        });

        // Create Rider Profile
        await tx.rider.create({
            data: {
                id: newUser.id,
                vehicle_type: vehicleType,
                vehicle_number: vehicleNumber,
                hub_id: hubId,
                is_online: false
            }
        });

        return newUser;
    });

    res.status(201).json({ success: true, message: 'Rider created successfully', data: user });
});
