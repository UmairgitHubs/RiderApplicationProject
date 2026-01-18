import { Request, Response } from 'express';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { settingsService } from '../services/settings.service';


// Get available orders for riders
export const getAvailableOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { latitude, longitude, radius = 10 } = req.query; // radius in km

    // Get rider's current location
    const rider = await prisma.rider.findUnique({
      where: { id: userId },
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rider profile not found.',
        },
      });
    }

    // Find pending shipments
    // In production, use proper geospatial queries to find nearby shipments
    const shipments = await prisma.shipment.findMany({
      where: {
        status: 'pending',
        rider_id: null,
      },
      include: {
        merchant: {
          select: {
            id: true,
            full_name: true,
            phone: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    // Calculate distance and filter (simplified - should use proper geospatial calculation)
    const availableOrders = shipments.map((shipment) => ({
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      pickupAddress: shipment.pickup_address,
      deliveryAddress: shipment.delivery_address,
      deliveryFee: shipment.delivery_fee,
      codAmount: shipment.cod_amount,
      distance: null, // TODO: Calculate using coordinates
      estimatedTime: shipment.estimated_delivery_time,
      merchant: shipment.merchant,
      createdAt: shipment.created_at,
    }));

    res.json({
      success: true,
      data: {
        orders: availableOrders,
      },
    });
  } catch (error: any) {
    logger.error('Get available orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching available orders.',
      },
    });
  }
};

// Accept an order
export const acceptOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { shipmentId } = req.body;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found.',
        },
      });
    }

    if (shipment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'This shipment is no longer available.',
        },
      });
    }

    if (shipment.rider_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_ASSIGNED',
          message: 'This shipment has already been assigned to another rider.',
        },
      });
    }

    // Assign shipment to rider
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        rider_id: userId,
        status: 'assigned',
      },
    });

    // Create tracking entry
    await prisma.shipmentTracking.create({
      data: {
        shipment_id: shipmentId,
        status: 'assigned',
        notes: `Assigned to rider`,
        updated_by: userId,
      },
    });

    // Create notifications
    await prisma.notification.createMany({
      data: [
        {
          user_id: shipment.merchant_id,
          title: 'Rider Assigned',
          message: `A rider has been assigned to your shipment ${shipment.tracking_number}.`,
          type: 'delivery',
          reference_id: shipmentId,
          reference_type: 'shipment',
        },
        {
          user_id: userId,
          title: 'Order Accepted',
          message: `You have accepted shipment ${shipment.tracking_number}.`,
          type: 'delivery',
          reference_id: shipmentId,
          reference_type: 'shipment',
        },
      ],
    });

    logger.info(`Rider ${userId} accepted shipment ${shipmentId}`);

    res.json({
      success: true,
      data: {
        shipment: updatedShipment,
      },
      message: 'Order accepted successfully.',
    });
  } catch (error: any) {
    logger.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while accepting the order.',
      },
    });
  }
};

// Update rider location
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { latitude, longitude, accuracy, speed, heading, shipmentId } = req.body;

    const settings = await settingsService.getSettings();
    if (!settings.gps_tracking) {
        // If GPS tracking is disabled globally, we just acknowledge but do nothing, 
        // OR we return a specific code so the app knows to stop sending.
        // For now, let's just ignore the write operation to save DB space/load.
        return res.json({ success: true, message: 'GPS tracking disabled by admin' });
    }

    // Update rider's current location
    await prisma.rider.update({
      where: { id: userId },
      data: {
        current_latitude: parseFloat(latitude),
        current_longitude: parseFloat(longitude),
      },
    });

    // Save location history
    await prisma.riderLocation.create({
      data: {
        rider_id: userId,
        shipment_id: shipmentId || null,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
      },
    });

    res.json({
      success: true,
      message: 'Location updated successfully.',
    });
  } catch (error: any) {
    logger.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating location.',
      },
    });
  }
};

// Get rider's active orders
export const getActiveOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const shipments = await prisma.shipment.findMany({
      where: {
        rider_id: userId,
        status: {
          in: ['assigned', 'picked_up', 'in_transit'],
        },
      },
      include: {
        merchant: {
          select: {
            id: true,
            full_name: true,
            phone: true,
          },
        },
        tracking_history: {
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: {
        orders: shipments.map((s) => ({
          id: s.id,
          trackingNumber: s.tracking_number,
          status: s.status,
          recipientName: s.recipient_name,
          recipientPhone: s.recipient_phone,
          pickupAddress: s.pickup_address,
          deliveryAddress: s.delivery_address,
          deliveryFee: s.delivery_fee,
          codAmount: s.cod_amount,
          distanceKm: s.distance_km,
          estimatedDeliveryTime: s.estimated_delivery_time,
          scheduledDeliveryTime: s.scheduled_delivery_time,
          merchant: s.merchant,
          lastUpdate: s.tracking_history[0]?.created_at,
        })),
      },
    });
  } catch (error: any) {
    logger.error('Get active orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching active orders.',
      },
    });
  }
};

// Complete delivery
export const completeDelivery = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { shipmentId, codAmount, notes } = req.body;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found.',
        },
      });
    }

    if (shipment.rider_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to complete this delivery.',
        },
      });
    }

    if (shipment.status === 'delivered') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_DELIVERED',
          message: 'This shipment has already been delivered.',
        },
      });
    }

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'delivered',
        actual_delivery_time: new Date(),
        payment_status: Number(shipment.cod_amount) > 0 ? 'pending' : 'paid',
      },
    });

    // Create tracking entry
    await prisma.shipmentTracking.create({
      data: {
        shipment_id: shipmentId,
        status: 'delivered',
        notes: notes || 'Delivery completed',
        updated_by: userId,
      },
    });

    // Credit rider's wallet with delivery fee
    const rider = await prisma.rider.findUnique({
      where: { id: userId },
    });

    if (rider) {
      const newBalance = Number(rider.wallet_balance) + Number(shipment.delivery_fee);
      const newEarnings = Number(rider.total_earnings) + Number(shipment.delivery_fee);
      const newDeliveries = rider.total_deliveries + 1;

      await prisma.rider.update({
        where: { id: userId },
        data: {
          wallet_balance: newBalance,
          total_earnings: newEarnings,
          total_deliveries: newDeliveries,
        },
      });

      // Create wallet transaction
      await prisma.walletTransaction.create({
        data: {
          user_id: userId,
          transaction_type: 'credit',
          amount: shipment.delivery_fee,
          balance_after: newBalance,
          transaction_category: 'earnings',
          reference_id: shipmentId,
          reference_type: 'shipment',
          description: `Delivery fee for shipment ${shipment.tracking_number}`,
          status: 'completed',
        },
      });
    }

    // Create notifications
    await prisma.notification.createMany({
      data: [
        {
          user_id: shipment.merchant_id,
          title: 'Delivery Completed',
          message: `Your shipment ${shipment.tracking_number} has been delivered.`,
          type: 'delivery',
          reference_id: shipmentId,
          reference_type: 'shipment',
        },
        {
          user_id: userId,
          title: 'Delivery Completed',
          message: `You have completed delivery for shipment ${shipment.tracking_number}.`,
          type: 'delivery',
          reference_id: shipmentId,
          reference_type: 'shipment',
        },
      ],
    });

    logger.info(`Rider ${userId} completed delivery for shipment ${shipmentId}`);

    res.json({
      success: true,
      data: {
        shipment: updatedShipment,
      },
      message: 'Delivery completed successfully.',
    });
  } catch (error: any) {
    logger.error('Complete delivery error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while completing the delivery.',
      },
    });
  }
};

// Toggle rider online/offline status
export const toggleOnlineStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { isOnline } = req.body;

    const rider = await prisma.rider.update({
      where: { id: userId },
      data: {
        is_online: isOnline,
      },
    });

    res.json({
      success: true,
      data: {
        isOnline: rider.is_online,
      },
      message: `Rider is now ${rider.is_online ? 'online' : 'offline'}.`,
    });
  } catch (error: any) {
    logger.error('Toggle online status error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating online status.',
      },
    });
  }
};

// Get rider's completed orders
export const getCompletedOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where: {
          rider_id: userId,
          status: 'delivered',
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { actual_delivery_time: 'desc' },
        include: {
          merchant: {
            select: {
              id: true,
              full_name: true,
              phone: true,
            },
          },
        },
      }),
      prisma.shipment.count({
        where: {
          rider_id: userId,
          status: 'delivered',
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        shipments: shipments.map((s) => ({
          id: s.id,
          trackingNumber: s.tracking_number,
          status: s.status,
          recipientName: s.recipient_name,
          recipientPhone: s.recipient_phone,
          deliveryAddress: s.delivery_address,
          deliveryFee: s.delivery_fee,
          codAmount: s.cod_amount,
          distanceKm: s.distance_km,
          scheduledDeliveryTime: s.scheduled_delivery_time,
          actualDeliveryTime: s.actual_delivery_time,
          createdAt: s.created_at,
          merchant: s.merchant,
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
    logger.error('Get completed orders error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching completed orders.',
      },
    });
  }
};

// Get rider earnings
export const getEarnings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { startDate, endDate } = req.query;

    const rider = await prisma.rider.findUnique({
      where: { id: userId },
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Rider profile not found.',
        },
      });
    }

    const where: any = {
      user_id: userId,
      transaction_type: 'credit',
      transaction_category: 'earnings',
    };

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate as string);
      if (endDate) where.created_at.lte = new Date(endDate as string);
    }

    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    const totalEarnings = transactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    res.json({
      success: true,
      data: {
        walletBalance: rider.wallet_balance,
        totalEarnings: rider.total_earnings,
        periodEarnings: totalEarnings,
        totalDeliveries: rider.total_deliveries,
        rating: rider.rating,
        transactions: transactions.map((t) => ({
          id: t.id,
          amount: t.amount,
          description: t.description,
          createdAt: t.created_at,
        })),
      },
    });
  } catch (error: any) {
    logger.error('Get earnings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching earnings.',
      },
    });
  }
};

