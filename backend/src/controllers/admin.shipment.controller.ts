import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';

/**
 * Get all shipments (Admin View)
 * Supports pagination and filtering by status
 */
export const getAllShipments = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, page = 1, limit = 20, search, startDate, endDate, hubId, merchantId } = req.query;

  const validStatusList = [
    'pending', 'assigned', 'picked_up', 'received_at_hub', 'in_transit', 'delivered', 'cancelled', 'returned', 'failed'
  ];

  // Determine Global Filters (excluding status) for statistics
  const globalWhere: any = {};
  
  if (merchantId) {
    globalWhere.merchant_id = merchantId;
  }

  if (search) {
    globalWhere.OR = [
      { tracking_number: { contains: search as string, mode: 'insensitive' } },
      { recipient_name: { contains: search as string, mode: 'insensitive' } },
      { delivery_address: { contains: search as string, mode: 'insensitive' } },
      { merchant: { full_name: { contains: search as string, mode: 'insensitive' } } },
      { rider: { full_name: { contains: search as string, mode: 'insensitive' } } }
    ];
  }

  if (startDate || endDate) {
    globalWhere.created_at = {};
    if (startDate) globalWhere.created_at.gte = new Date(startDate as string);
    if (endDate) {
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      globalWhere.created_at.lte = end;
    }
  }

  // Hub Manager Restriction & Filtering for Stats
  let filterHubId = hubId as string;
  if (req.user?.role === 'hub_manager') {
      const managedHub = await prisma.hub.findFirst({ where: { manager_id: req.user.id } });
      if (managedHub) filterHubId = managedHub.id;
  }

  if (filterHubId && filterHubId !== 'all' && filterHubId !== 'All Hubs') {
    globalWhere.OR = [
      { hub_id: filterHubId },
      { rider: { rider: { hub_id: filterHubId } } }
    ];
  }

  // Final Where clause for the data list
  const where: any = { AND: [globalWhere] };
  
  if (status && status !== 'all' && status !== 'All Status') {
     const s = (status as string).toLowerCase();
     if (s === 'pending') {
         where.AND.push({ status: { in: ['pending', 'assigned', 'scheduled'] } });
     } else if (s === 'at_hub' || s === 'received_at_hub') {
         where.AND.push({ status: 'received_at_hub' });
     } else if (s === 'in_transit') {
         where.AND.push({ status: { in: ['in_transit', 'picked_up'] } });
     } else if (s === 'delivered') {
         where.AND.push({ status: 'delivered' });
     } else if (s === 'failed') {
         where.AND.push({ status: 'failed' });
     } else if (s === 'returned') {
         where.AND.push({ status: { in: ['returned', 'cancelled'] } });
     } else if (validStatusList.includes(s)) {
         where.AND.push({ status: s });
     }
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  // Parallel fetch: data + list count + global status distribution
  const [shipments, total, statusDistribution] = await Promise.all([
    prisma.shipment.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: 'desc' },
      include: {
        merchant: { select: { id: true, full_name: true, email: true } },
        rider: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            rider: { select: { hub_id: true } }
          }
        },
        hub: { select: { id: true, name: true, city: true } },
        packages: { select: { id: true } }
      } as any
    }),
    prisma.shipment.count({ where }),
    prisma.shipment.groupBy({
      by: ['status'],
      where: globalWhere, // Distribution based on filters EXCEPT status
      _count: { status: true }
    })
  ]);

  // Define the statuses we want to track in the stats
  const statusSummary: Record<string, number> = {
    delivered: 0,
    at_hub: 0,
    in_transit: 0,
    pending: 0,
    failed: 0,
    returned: 0
  };

  // Populate counts from global DB result (respecting Hub/Search/Date)
  statusDistribution.forEach((group: any) => {
    const s = group.status.toLowerCase();
    if (s === 'delivered') statusSummary.delivered += group._count.status;
    else if (s === 'received_at_hub') statusSummary.at_hub += group._count.status;
    else if (s === 'in_transit' || s === 'picked_up') statusSummary.in_transit += group._count.status;
    else if (s === 'pending' || s === 'assigned' || s === 'scheduled') statusSummary.pending += group._count.status;
    else if (s === 'failed') statusSummary.failed += group._count.status;
    else if (s === 'returned' || s === 'cancelled') statusSummary.returned += group._count.status;
  });

  // Transform to the array format the frontend expects
  const stats = Object.entries(statusSummary).map(([status, count]) => ({
    name: status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: count
  }));

  // Transform data for frontend
  const formattedShipments = shipments.map((s: any) => ({
    id: s.id,
    trackingNumber: s.tracking_number,
    status: s.status,
    recipientName: s.recipient_name,
    recipientPhone: s.recipient_phone,
    customerName: s.recipient_name,
    merchantName: s.merchant?.full_name || 'Unknown',
    merchantPhone: s.merchant?.phone,
    merchantEmail: s.merchant?.email,
    amount: s.cod_amount,
    codAmount: s.cod_amount, 
    paymentStatus: s.payment_status, 
    deliveryFee: s.delivery_fee,
    date: s.created_at,
    createdAt: s.created_at,
    packageCount: s.packages ? s.packages.length : 0,
    packageWeight: s.package_weight,
    packageType: s.package_type,
    rider: s.rider ? s.rider.full_name : 'Unassigned',
    hubId: s.hub?.id || s.rider?.rider?.hub_id || null, 
    hub: s.hub?.name || 'Unassigned',
    pickupAddress: s.pickup_address,
    deliveryAddress: s.delivery_address,
    priority: s.priority || 'Normal',
  }));

  res.json({
    success: true,
    data: {
      shipments: formattedShipments,
      stats,
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
 * Get list of all hubs
 */
export const getHubList = asyncHandler(async (req: AuthRequest, res: Response) => {
  const hubs = await prisma.hub.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: 'asc' }
  });
  res.json({ success: true, data: hubs });
});

/**
 * Get Single Shipment Details (Admin View)
 */
export const getShipmentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const shipment = await prisma.shipment.findFirst({
    where: {
      OR: [
        { id },
        { tracking_number: id }
      ]
    },
    include: {
      merchant: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
        }
      },
      rider: {
        select: {
          id: true,
          full_name: true,
          phone: true,
        }
      },
      packages: {
        orderBy: { package_number: 'asc' }
      },
      hub: true,
      tracking_history: {
        orderBy: { created_at: 'desc' },
        include: {
          updated_by_user: {
            select: { full_name: true, role: true }
          }
        }
      }
    }
  });

  if (!shipment) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Shipment not found' }
    });
    return;
  }

  res.json({
    success: true,
    data: { shipment }
  });
});

/**
 * Update Shipment Details (Admin)
 */
export const updateShipment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  console.log('Update Shipment Request:', id);
  console.log('Body:', req.body);

  const {
    recipientName,
    recipientPhone,
    deliveryAddress,
    pickupAddress,
    codAmount,
    deliveryFee,
    packageWeight,
    packageValue,
    specialInstructions,
    status,
    paymentStatus,
    scheduledPickupTime
  } = req.body;

  const shipment = await prisma.shipment.findFirst({
    where: {
      OR: [
        { id },
        { tracking_number: id }
      ]
    }
  });

  if (!shipment) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Shipment not found' }
    });
    return;
  }

  // Prepare update data
  const updateData: any = {};
  if (recipientName) updateData.recipient_name = recipientName;
  if (recipientPhone) updateData.recipient_phone = recipientPhone;
  if (deliveryAddress) updateData.delivery_address = deliveryAddress;
  if (pickupAddress) updateData.pickup_address = pickupAddress;
  if (codAmount !== undefined) updateData.cod_amount = codAmount;
  if (deliveryFee !== undefined) updateData.delivery_fee = deliveryFee;
  if (packageWeight !== undefined) updateData.package_weight = packageWeight;
  if (packageValue !== undefined) updateData.package_value = packageValue;
  if (specialInstructions !== undefined) updateData.special_instructions = specialInstructions;
  if (status) updateData.status = status;
  if (paymentStatus) updateData.payment_status = paymentStatus;
  if (scheduledPickupTime) updateData.scheduled_pickup_time = new Date(scheduledPickupTime);

  console.log('Update Data prepared:', updateData);

  const updatedShipment = await prisma.shipment.update({
    where: { id: shipment.id },
    data: updateData
  });

  // Track status change if any
  if (status && status !== shipment.status) {
    await prisma.shipmentTracking.create({
      data: {
        shipment_id: shipment.id,
        status: status,
        updated_by: req.user?.id,
        notes: `Status updated to ${status} by Admin`
      }
    });
  }

  res.json({
    success: true,
    data: { shipment: updatedShipment },
    message: 'Shipment updated successfully.'
  });
});

/**
 * Cancel a shipment (Admin Override)
 */
export const adminCancelShipment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.id;

  const shipment = await prisma.shipment.findFirst({
    where: {
      OR: [
        { id },
        { tracking_number: id }
      ]
    }
  });
  
  if (!shipment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    return;
  }

  // Update status
  const updatedShipment = await prisma.shipment.update({
    where: { id: shipment.id },
    data: { status: 'cancelled' }
  });

  // Track event
  await prisma.shipmentTracking.create({
    data: {
      shipment_id: shipment.id,
      status: 'cancelled',
      notes: 'Cancelled by Admin',
      updated_by: adminId
    }
  });

  res.json({
    success: true,
    data: { shipment: updatedShipment },
    message: 'Shipment cancelled by admin.'
  });
});

/**
 * Add a note to shipment (Admin)
 * specific endpoint to just add a tracking note without changing status
 */
export const addShipmentNote = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const adminId = req.user?.id;

  if (!note) {
    res.status(400).json({ success: false, error: { message: "Note is required" } });
    return;
  }

  const shipment = await prisma.shipment.findFirst({
    where: {
      OR: [
        { id },
        { tracking_number: id }
      ]
    }
  });

  if (!shipment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    return;
  }

  // Create tracking entry with current status but new note
  await prisma.shipmentTracking.create({
    data: {
      shipment_id: shipment.id,
      status: shipment.status,
      notes: note,
      updated_by: adminId
    }
  });

  res.json({ success: true, message: "Note added successfully" });
});

/**
 * Assign a rider to a shipment manually (Admin/Hub Manager)
 */
export const assignShipmentToRider = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { riderId } = req.body;
  const adminId = req.user?.id;

  if (!riderId) {
    res.status(400).json({ success: false, error: { message: "Rider ID is required" } });
    return;
  }

  const shipment = await prisma.shipment.findUnique({
    where: { id }
  });

  if (!shipment) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
    return;
  }

  // Check if rider exists
  const rider = await prisma.rider.findUnique({
    where: { id: riderId },
    include: { user: { select: { full_name: true, phone: true, email: true } } }
  });

  if (!rider) {
     res.status(404).json({ success: false, error: { message: "Rider not found" } });
     return;
  }

  // Update Shipment
  const updatedShipment = await prisma.shipment.update({
    where: { id },
    data: {
      rider_id: riderId,
      status: 'assigned', // Reset to assigned for the new rider
    }
  });

  // Track History
  await prisma.shipmentTracking.create({
    data: {
      shipment_id: id,
      status: 'assigned',
      notes: `Assigned to rider ${rider.user.full_name}`,
      updated_by: adminId
    }
  });

  // Notification to Rider
  await prisma.notification.create({
    data: {
      user_id: riderId,
      title: 'New Shipment Assigned',
      message: `You have been assigned shipment ${shipment.tracking_number} for delivery.`,
      type: 'delivery',
      reference_id: id,
      reference_type: 'shipment'
    }
  });

  res.json({
    success: true,
    data: { shipment: updatedShipment },
    message: `Shipment assigned to ${rider.user.full_name}`
  });
});
