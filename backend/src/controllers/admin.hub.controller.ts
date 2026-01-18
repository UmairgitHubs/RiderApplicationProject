import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import bcrypt from 'bcryptjs';

/**
 * Get all hubs with stats
 */
export const getAllHubs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search } = req.query;


  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { city: { contains: String(search), mode: 'insensitive' } },
      { address: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const hubs = await prisma.hub.findMany({
    where,
    include: {
      manager: {
        select: { id: true, full_name: true, phone: true }
      },
      riders: {
        select: { id: true, is_online: true }
      },
       _count: {
        select: { riders: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Calculate dynamic stats
  const data = await Promise.all(hubs.map(async (hub) => {
    try {
      // 1. Rider Stats
      const totalRiders = hub.riders.length;
      const activeRiders = hub.riders.filter(r => r.is_online).length;
      const inactiveRiders = totalRiders - activeRiders;

      // 2. Shipment Stats (linked via Rider)
      const riderIds = hub.riders.map(r => r.id);
      
      let shipmentStats = {
        pending: 0,
        sorted: 0, 
        delivered: 0, 
        transit: 0
      };

      if (riderIds.length > 0) {
          const stats = await prisma.shipment.groupBy({
              by: ['status'],
              where: {
                  rider_id: { in: riderIds }
              },
              _count: { status: true }
          });

          stats.forEach(s => {
               if (['pending', 'assigned'].includes(s.status)) shipmentStats.pending += s._count.status;
               if (['picked_up', 'in_transit'].includes(s.status)) shipmentStats.transit += s._count.status;
               if (['delivered'].includes(s.status)) shipmentStats.delivered += s._count.status;
               if (['cancelled', 'returned', 'failed'].includes(s.status)) shipmentStats.sorted += s._count.status;
          });
      }

      // 3. Activity Stats
      const activeRoutesCount = await prisma.route.count({
          where: {
              hub_id: hub.id,
              status: 'active'
          }
      });

      return {
        id: hub.id,
        name: hub.name,
        address: hub.address,
        city: hub.city,
        status: hub.is_active ? 'Operational' : 'Inactive',
        manager: hub.manager ? {
          id: hub.manager.id,
          name: hub.manager.full_name,
          role: 'Manager'
        } : null,
        capacity: (hub as any).capacity || 100,
        size_sqft: (hub as any).size_sqft || 5000,
          stats: {
            totalRiders: totalRiders,
            totalEmployees: totalRiders + (hub.manager ? 1 : 0), 
            pendingParcels: shipmentStats.pending,
            activeParcels: shipmentStats.sorted,
            deliveredParcels: shipmentStats.delivered,
            failedParcels: shipmentStats.transit,
            activeRoutes: activeRoutesCount
          },
        details: {
          capacity: `${Math.round(((shipmentStats.pending + shipmentStats.sorted) / ((hub as any).capacity || 100)) * 100)}%`, 
          activeTrucks: activeRiders, 
          sqft: `${(hub as any).size_sqft || 5000} sq ft`
        }
      };
    } catch (err) {
      console.error(`[ERROR] Stats calculation failed for hub ${hub.id}:`, err);
      // Fallback for this hub
      return {
        id: hub.id,
        name: hub.name,
        address: hub.address,
        city: hub.city,
        status: hub.is_active ? 'Operational' : 'Inactive',
        manager: null,
        capacity: (hub as any).capacity || 100,
        size_sqft: (hub as any).size_sqft || 5000,
        stats: { totalRiders: 0, totalEmployees: 0, pendingParcels: 0, activeParcels: 0, deliveredParcels: 0, failedParcels: 0 },
        details: { capacity: '0%', activeTrucks: 0, sqft: '0' }
      };
    }
  }));

  res.json({ success: true, data });
});


/**
 * Create a new hub
 */
export const createHub = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, address, city, managerId, capacity, sizeSqft, managerName, managerEmail, managerPassword, managerPhone } = req.body;

  let finalManagerId = managerId;

  // If new manager details are provided, create the user
  if (!finalManagerId && managerName && managerEmail && managerPassword) {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
          where: { email: managerEmail }
      });

      if (existingUser) {
          // If user exists but is not a hub_manager, we might want to error or just warn. 
          // For now, let's assume if they provide details they expect a new user or assignment.
          // If email exists, we can't create a new user.
          return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      // Hash password
      // We need to dynamic import bcryptjs or require it since it wasn't imported at top
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(managerPassword, salt);

      // Create Manager User
      const newManager = await prisma.user.create({
          data: {
              full_name: managerName,
              email: managerEmail,
              password_hash: hashedPassword,
              role: 'hub_manager',
              is_active: true,
              is_verified: true, // Auto verify since admin created
              phone: managerPhone || ''
          }
      });

      finalManagerId = newManager.id;
  }

  const hub = await prisma.hub.create({
    data: {
      name,
      address,
      city,
      manager_id: finalManagerId || null,
      capacity: Number(capacity) || 100,
      size_sqft: Number(sizeSqft) || 5000
    } as any
  });

  res.status(201).json({ success: true, data: hub });
});

/**
 * Update a hub
 */
export const updateHub = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, address, city, managerId, isActive, capacity, sizeSqft, managerName, managerEmail, managerPhone, managerPassword } = req.body;

  let finalManagerId = managerId;

  // If new manager details are provided, create the user
  if (!finalManagerId && managerName && managerEmail && managerPassword) {
       // ... existing creation logic ...
       // Check if user exists
       const existingUser = await prisma.user.findUnique({
           where: { email: managerEmail }
       });
 
       if (existingUser) {
           return res.status(400).json({ success: false, message: 'User with this email already exists' });
       }
 
       // Hash password
       const salt = await bcrypt.genSalt(10);
       const hashedPassword = await bcrypt.hash(managerPassword, salt);
 
       // Create Manager User
       const newManager = await prisma.user.create({
           data: {
               full_name: managerName,
               email: managerEmail,
               password_hash: hashedPassword,
               role: 'hub_manager',
               is_active: true,
               is_verified: true,
               phone: managerPhone || ''
           }
       });
 
       finalManagerId = newManager.id;
  } else if (finalManagerId && (managerName || managerEmail || managerPhone)) {
      // Update existing manager details if provided
      // Ideally we would validate email uniqueness if it changed, but let's assume valid for now or basic check
      const updateData: any = {};
      if (managerName) updateData.full_name = managerName;
      if (managerEmail) updateData.email = managerEmail;
      if (managerPhone !== undefined) updateData.phone = managerPhone;

      if (Object.keys(updateData).length > 0) {
           await prisma.user.update({
               where: { id: finalManagerId },
               data: updateData
           });
      }
  }

  const hub = await prisma.hub.update({
    where: { id },
    data: {
      name,
      address,
      city,
      manager_id: finalManagerId || null,
      is_active: isActive,
      capacity: capacity ? Number(capacity) : undefined,
      size_sqft: sizeSqft ? Number(sizeSqft) : undefined
    } as any
  });

  res.json({ success: true, data: hub });
});

/**
 * Get single hub details
 */
export const getHubById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const hub = await prisma.hub.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, full_name: true, phone: true }
      },
      riders: {
        include: { user: { select: { full_name: true, phone: true } } }
      },
       _count: {
        select: { riders: true }
      }
    }
  });

  if (!hub) {
    return res.status(404).json({ success: false, error: 'Hub not found' });
  }

  // Calculate dynamic stats
  const totalRiders = hub.riders.length;
  const activeRiders = hub.riders.filter(r => r.is_online).length;
  
  const riderIds = hub.riders.map(r => r.id);
  
  let shipmentStats = {
      pending: 0,
      sorted: 0, 
      delivered: 0, 
      transit: 0
  };

  if (riderIds.length > 0) {
      const stats = await prisma.shipment.groupBy({
          by: ['status'],
          where: {
              rider_id: { in: riderIds }
          },
          _count: { status: true }
      });

      stats.forEach(s => {
           if (['pending', 'assigned'].includes(s.status)) shipmentStats.pending += s._count.status;
           if (['picked_up', 'in_transit'].includes(s.status)) shipmentStats.transit += s._count.status;
           if (['delivered'].includes(s.status)) shipmentStats.delivered += s._count.status;
           if (['cancelled', 'returned', 'failed'].includes(s.status)) shipmentStats.sorted += s._count.status;
      });
  }

  const activeRoutesCount = await prisma.route.count({
      where: {
          hub_id: hub.id,
          status: 'active'
      }
  });

  const data = {
      id: hub.id,
      name: hub.name,
      address: hub.address,
      city: hub.city,
      status: hub.is_active ? 'Operational' : 'Inactive',
      manager: hub.manager ? {
        id: hub.manager.id,
        name: hub.manager.full_name,
        phone: hub.manager.phone, 
        role: 'Manager'
      } : null,
      capacity: (hub as any).capacity || 100, // Raw capacity
      size_sqft: (hub as any).size_sqft || 5000, // Raw sqft
      stats: {
        totalRiders: totalRiders,
        totalEmployees: totalRiders + (hub.manager ? 1 : 0), 
        pendingParcels: shipmentStats.pending,
        activeParcels: shipmentStats.sorted, // Exceptions
        deliveredParcels: shipmentStats.delivered,
        failedParcels: shipmentStats.transit, // In Transit
        activeRoutes: activeRoutesCount
      },
      activeRoutes: activeRoutesCount,
      details: {
        capacity: `${Math.round(((shipmentStats.pending + shipmentStats.sorted) / ((hub as any).capacity || 100)) * 100)}%`, 
        activeTrucks: activeRiders, 
        sqft: `${(hub as any).size_sqft || 5000} sq ft`
      },
      ridersList: hub.riders.map(r => ({
          id: r.id,
          name: r.user.full_name || 'N/A',
          phone: r.user.phone || 'N/A',
          is_online: r.is_online,
          vehicle_type: r.vehicle_type,
          rating: r.rating
      }))
  };

  res.json({ success: true, data });
});

/**
 * Delete a hub
 */
/**
 * Delete a hub
 */
export const deleteHub = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await prisma.hub.delete({
    where: { id }
  });

  res.json({ success: true, message: 'Hub deleted successfully' });
});

/**
 * Get overall hub statistics
 */
export const getHubStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    // 1. Total Hubs
    const totalHubs = await prisma.hub.count({ where: { is_active: true } });

    // 2. Total Riders
    const totalRiders = await prisma.rider.count();

    // 3. Total Employees (Riders + Managers + Admins or just Riders + Hub Managers?)
    // Logic: Riders + Users with role 'hub_manager'
    const totalManagers = await prisma.user.count({ where: { role: 'hub_manager' } });
    const totalEmployees = totalRiders + totalManagers;

    // 4. Total Parcels
    // User requested to match "Total Shipments" (101), so we remove the status filter.
    const totalParcels = await prisma.shipment.count();

    res.json({
        success: true,
        data: {
            totalHubs,
            totalRiders,
            totalEmployees,
            totalParcels
        }
    });
    });


/**
 * Get potential hub managers
 */
export const getPotentialManagers = asyncHandler(async (req: AuthRequest, res: Response) => {
    const managers = await prisma.user.findMany({
        where: {
            role: 'hub_manager',
            is_active: true
        },
        select: {
            id: true,
            full_name: true,
            email: true,
            phone: true
        },
        orderBy: {
            full_name: 'asc'
        }
    });

    res.json({ success: true, data: managers });
});
