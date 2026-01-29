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
    // Find pending shipments or those received at hub waiting for dispatch
    const shipments = await prisma.shipment.findMany({
      where: {
        status: { in: ['pending', 'received_at_hub'] },
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
        hub: {
          select: {
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    // Calculate distance and filter (simplified - should use proper geospatial calculation)
    const availableOrders = shipments.map((s) => {
      const isSecondLeg = s.status === 'received_at_hub';
      const pickupAddress = isSecondLeg ? (s.hub?.address || s.hub?.name || 'Hub') : s.pickup_address;
      const deliveryAddress = isSecondLeg ? s.delivery_address : (s.hub?.address || s.hub?.name || s.delivery_address);

      return {
        id: s.id,
        trackingNumber: s.tracking_number,
        pickupAddress,
        deliveryAddress,
        deliveryFee: s.delivery_fee,
        codAmount: s.cod_amount,
        pickupLatitude: isSecondLeg ? Number(s.hub?.latitude) : s.pickup_latitude,
        pickupLongitude: isSecondLeg ? Number(s.hub?.longitude) : s.pickup_longitude,
        deliveryLatitude: isSecondLeg ? s.delivery_latitude : Number(s.hub?.latitude),
        deliveryLongitude: isSecondLeg ? s.delivery_longitude : Number(s.hub?.longitude),
        distance: s.distance_km ? `${s.distance_km} km` : null,
        estimatedTime: s.estimated_delivery_time,
        merchant: s.merchant,
        createdAt: s.created_at,
        packageType: s.package_type,
        packageWeight: s.package_weight,
        status: s.status
      };
    });

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

    if (!['pending', 'received_at_hub'].includes(shipment.status)) {
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
    const updateData: any = {
      rider_id: userId,
      status: 'assigned',
    };

    // If picking up from merchant (First Leg), record as pickup rider
    if (shipment.status === 'pending') {
       updateData.pickup_rider_id = userId;
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
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

// Pickup an order
export const pickupOrder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { shipmentId, condition } = req.body;

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        route_stops: {
          include: {
            route: {
              select: {
                rider_id: true
              }
            }
          }
        }
      }
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

    // Check if shipment is assigned to the rider via a route
    const isAssignedViaRoute = shipment.route_stops.some(stop => stop.route.rider_id === userId);

    if (shipment.rider_id !== userId && !isAssignedViaRoute) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not assigned to this shipment.',
        },
      });
    }

    // Allow 'pending' or 'received_at_hub' statuses if assigned via route
    const validStatuses = ['assigned', 'pending', 'received_at_hub'];
    if (!validStatuses.includes(shipment.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Shipment status (${shipment.status}) is invalid for pickup. Must be one of: ${validStatuses.join(', ')}.`,
        },
      });
    }

    // Update shipment status
    const isSecondLeg = !!shipment.pickup_rider_id && !!shipment.hub_id;
    const trackingNoteBase = isSecondLeg ? 'Picked Up from Hub' : 'Picked Up from Merchant';

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'picked_up',
        rider_id: userId, // Ensure rider is assigned if not already
        // picked_up_at: new Date(), // If this field exists in schema, otherwise skip
      },
    });

    // CRITICAL: Complete the Pickup Route Stop to advance navigation
    await prisma.routeStop.updateMany({
        where: {
            shipment_id: shipmentId,
            type: 'pickup',
            route: { rider_id: userId }
        },
        data: { status: 'completed' }
    });

    // Create tracking entry
    await prisma.shipmentTracking.create({
      data: {
        shipment_id: shipmentId,
        status: 'picked_up',
        notes: `${trackingNoteBase}. ${condition ? `Condition: ${condition}.` : ''} ${req.body.scannedCode ? `Scan: ${req.body.scannedCode}` : ''}`,
        updated_by: userId,
      },
    });

    // Create notifications
    // Simple notification logic
    await prisma.notification.createMany({
      data: [
        {
          user_id: shipment.merchant_id,
          title: 'Shipment Picked Up',
          message: `Rider has picked up shipment ${shipment.tracking_number}.`,
          type: 'delivery',
          reference_id: shipmentId,
          reference_type: 'shipment',
        },
      ],
    });

    res.json({
      success: true,
      data: {
        shipment: updatedShipment,
      },
      message: 'Order picked up successfully.',
    });
  } catch (error: any) {
    logger.error('Pickup order error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while picking up the order.',
      },
    });
  }
};

// Drop off at Hub (First Leg)
export const dropOffAtHub = async (req: Request, res: Response) => {
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

    if (shipment.rider_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not assigned to this shipment.',
        },
      });
    }

    // Must be picked up first
    if (shipment.status !== 'picked_up') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Shipment must be picked up before dropping at hub.',
        },
      });
    }

    // Check if it has an origin hub assigned
    if (!shipment.hub_id) {
       // If no hub assignments, we can't drop at hub.
       // However, for individual orders, maybe we assign the nearest hub now? 
       // For now, fail if no hub.
       return res.status(400).json({
          success: false,
          error: {
            code: 'NO_HUB_ASSIGNED',
            message: 'This shipment is not assigned to any hub.',
          }
       });
    }

    // Find active route for this shipment/rider to check completion later
    // We do this BEFORE the update just to get the ID, but we check status AFTER
    const activeRoute = await prisma.route.findFirst({
        where: {
            rider_id: userId,
            status: 'active',
            stops: { some: { shipment_id: shipmentId } }
        }
    });

    // Update shipment to 'received_at_hub'
    // Clear current rider_id so it can be assigned to next rider
    // Save current rider to pickup_rider_id
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'received_at_hub',
        rider_id: null, 
        pickup_rider_id: userId,
        // We could also add a 'received_at_hub_time' if we had the field
      },
    });

    // Create tracking entry
    await prisma.shipmentTracking.create({
      data: {
        shipment_id: shipmentId,
        status: 'received_at_hub',
        notes: 'Submitted to Hub',
        updated_by: userId,
      },
    });

    // Close the stop in the rider's route
    // Specifically the DELIVERY leg to the hub
    await prisma.routeStop.updateMany({
        where: {
            shipment_id: shipmentId,
            type: 'delivery',
            route: {
                rider_id: userId
            }
        },
        data: {
            status: 'completed'
        }
    });

    // Check if Route is Complete
    if (activeRoute) {
        const pendingCount = await prisma.routeStop.count({
            where: {
                route_id: activeRoute.id,
                status: 'pending'
            }
        });

        if (pendingCount === 0) {
            await prisma.route.update({
                where: { id: activeRoute.id },
                data: {
                    status: 'completed',
                    end_time: new Date()
                }
            });
        }
    }

    // Notification to Merchant (optional)
    // Notification to Hub Manager (if we can identify them)

    res.json({
        success: true,
        data: {
            shipment: updatedShipment
        },
        message: 'Shipment dropped off at hub successfully.'
    });

  } catch (error: any) {
    logger.error('Drop off at hub error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while dropping off at hub.',
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
        hub: { // Include Hub details
            select: {
                name: true,
                address: true,
                latitude: true,
                longitude: true
            }
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
        orders: shipments.map((s) => {
          // If it's a second leg (Hub -> Customer), Pickup is the Hub
          const isSecondLeg = !!s.pickup_rider_id && !!s.hub_id;
          const pickupAddress = isSecondLeg ? (s.hub?.address || s.hub?.name) : s.pickup_address;
          const pickupLatitude = isSecondLeg ? Number(s.hub?.latitude) : s.pickup_latitude;
          const pickupLongitude = isSecondLeg ? Number(s.hub?.longitude) : s.pickup_longitude;

          return {
            id: s.id,
            trackingNumber: s.tracking_number,
            status: s.status,
            recipientName: s.recipient_name,
            recipientPhone: s.recipient_phone,
            pickupAddress: pickupAddress,
            deliveryAddress: s.delivery_address,
            deliveryFee: s.delivery_fee,
            codAmount: s.cod_amount,
            distanceKm: s.distance_km,
            estimatedDeliveryTime: s.estimated_delivery_time,
            scheduledDeliveryTime: s.scheduled_delivery_time,
            merchant: s.merchant,
            lastUpdate: s.tracking_history[0]?.created_at,
            packageType: s.package_type,
            shipmentType: s.shipment_type,
            specialInstructions: s.special_instructions,
            deliveryLatitude: s.delivery_latitude,
            deliveryLongitude: s.delivery_longitude,
            pickupLatitude: pickupLatitude,
            pickupLongitude: pickupLongitude,
            hubId: s.hub_id,
            pickupRiderId: s.pickup_rider_id
          };
        }),
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
      include: {
        route_stops: {
          include: {
            route: {
              select: {
                rider_id: true
              }
            }
          }
        }
      }
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

    // Check if shipment is assigned to the rider via a route
    const isAssignedViaRoute = shipment.route_stops.some(stop => stop.route.rider_id === userId);

    if (shipment.rider_id !== userId && !isAssignedViaRoute) {
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

    // Check for active route before update
    const activeRoute = await prisma.route.findFirst({
        where: {
            rider_id: userId,
            status: 'active',
            stops: { some: { shipment_id: shipmentId } }
        }
    });

    // Update shipment
    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'delivered',
        rider_id: userId, // Ensure rider is marked as the one who delivered it
        actual_delivery_time: new Date(),
        payment_status: Number(shipment.cod_amount) > 0 ? 'pending' : 'paid',
        // Also update the route stop status if this shipment is part of a route
        // CRITICAL: Specifically complete the DELIVERY stop.
        route_stops: {
          updateMany: {
            where: { 
                shipment_id: shipmentId,
                type: 'delivery' // Only close the delivery leg
            },
            data: { status: 'completed' }
          }
        }
      },
    });

    // Check if Route is Complete
    if (activeRoute) {
        const pendingCount = await prisma.routeStop.count({
            where: {
                route_id: activeRoute.id,
                status: 'pending'
            }
        });

        if (pendingCount === 0) {
            await prisma.route.update({
                where: { id: activeRoute.id },
                data: {
                    status: 'completed',
                    end_time: new Date()
                }
            });
        }
    }

    // Create tracking entry
    await prisma.shipmentTracking.create({
      data: {
        shipment_id: shipmentId,
        status: 'delivered',
        notes: notes || `Delivered to Customer. ${req.body.paymentMethod ? `Paid via ${req.body.paymentMethod}.` : ''} ${req.body.scannedCode ? `Scan: ${req.body.scannedCode}` : ''}`,
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
    const { page = 1, limit = 20, startDate, endDate } = req.query;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    const hasDateFilter = startDate || endDate;

    const where: any = {
      OR: [
        // 1. Fully Delivered (Last Mile by this rider OR First Mile by this rider)
        {
          status: 'delivered',
          OR: [
             { rider_id: userId }, 
             { pickup_rider_id: userId }
          ],
          ...(hasDateFilter ? { actual_delivery_time: dateFilter } : {})
        },
        // 2. Dropped at Hub (First Mile completed by this rider)
        {
          status: 'received_at_hub',
          pickup_rider_id: userId,
          ...(hasDateFilter ? { updated_at: dateFilter } : {})
        }
      ]
    };

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { updated_at: 'desc' },
        include: {
          merchant: {
            select: {
              id: true,
              full_name: true,
              phone: true,
              merchant: { select: { business_name: true } }
            },
          },
          hub: {
             select: {
                 name: true,
                 address: true
             }
          }
        },
      }),
      prisma.shipment.count({
        where,
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
          deliveryAddress: s.status === 'received_at_hub' ? (s.hub?.address || s.hub?.name || s.delivery_address) : s.delivery_address,
          hub: s.hub,
          deliveryFee: s.delivery_fee,
          codAmount: s.cod_amount,
          distanceKm: s.distance_km,
          scheduledDeliveryTime: s.scheduled_delivery_time,
          actualDeliveryTime: s.actual_delivery_time,
          createdAt: s.created_at,
          merchant: {
            ...s.merchant,
             business_name: (s.merchant as any)?.merchant?.business_name
          },
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

// Get rider's assigned routes
export const getRiderRoutes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { status } = req.query;

    const where: any = {
      rider_id: userId,
    };

    if (status) {
      const statuses = (status as string).split(',');
      where.status = { in: statuses };
    } else {
      where.status = { in: ['active', 'draft', 'pending'] };
    }

    const routes = await prisma.route.findMany({
      where,
      include: {
        hub: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
          }
        },
        stops: {
          orderBy: { stop_order: 'asc' },
          include: {
            shipment: {
              select: {
                id: true,
                tracking_number: true,
                status: true,
                pickup_address: true,
                delivery_address: true,
                recipient_name: true,
                recipient_phone: true,
                package_weight: true,
                estimated_delivery_time: true
              }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: {
        routes: routes.map(route => ({
          id: route.id,
          name: route.name,
          status: route.status,
          startTime: route.start_time,
          endTime: route.end_time,
          distanceKm: route.distance_km,
          durationMin: route.duration_min,
          hub: route.hub,
          stops: route.stops.map(stop => ({
            id: stop.id,
            type: stop.type,
            status: stop.status,
            order: stop.stop_order,
            location: stop.location,
            latitude: stop.latitude,
            longitude: stop.longitude,
            shipment: stop.shipment,
            arrivalTime: stop.arrival_time
          }))
        }))
      }
    });

  } catch (error: any) {
    logger.error('Get rider routes error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching rider routes.',
      },
    });
  }
};

// Get rider performance stats
export const getPerformanceStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { startDate, endDate } = req.query;

    const rider = await prisma.rider.findUnique({
      where: { id: userId },
      select: { rating: true, total_deliveries: true }
    });

    if (!rider) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Rider not found' }
      });
    }

    const where: any = {
      rider_id: userId,
      status: 'delivered',
    };

    if (startDate || endDate) {
        where.actual_delivery_time = {};
        if (startDate) where.actual_delivery_time.gte = new Date(startDate as string);
        if (endDate) where.actual_delivery_time.lte = new Date(endDate as string);
    }

    const shipments = await prisma.shipment.findMany({
      where,
      select: {
          actual_delivery_time: true,
          scheduled_delivery_time: true,
      }
    });

    const deliveriesCount = shipments.length;
    
    // Calculate on-time
    let onTimeCount = 0;
    shipments.forEach(s => {
        if (s.scheduled_delivery_time && s.actual_delivery_time) {
            // Give 30 mins buffer?
            // Let's stick to strict <= for now
            if (s.actual_delivery_time <= s.scheduled_delivery_time) {
                onTimeCount++;
            }
        } else {
             // If no scheduled time, count as on-time (cannot be late if no deadline)
            onTimeCount++; 
        }
    });

    const onTimeRate = deliveriesCount > 0 ? (onTimeCount / deliveriesCount) * 100 : 100;

    res.json({
      success: true,
      data: {
        deliveries: deliveriesCount,
        onTimeRate: parseFloat(onTimeRate.toFixed(1)),
        rating: Number(rider.rating || 0), 
      }
    });

  } catch (error: any) {
    logger.error('Get performance stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Error fetching stats' }
    });
  }
};

// Start a route (Move from Next Day/Assigned to Urgent/Active)
export const startRoute = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { routeId } = req.body;

    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Route not found.' },
      });
    }

    if (route.rider_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You are not assigned to this route.' },
      });
    }

    // Update status to active
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: { status: 'active' },
    });

    // Also ensure all pending shipments in this route are marked as 'assigned' if they weren't already
    // This handles the "All shipments... must now be considered active stops" req
    const stops = await prisma.routeStop.findMany({
        where: { route_id: routeId },
        include: { shipment: true }
    });
    
    // Check if stop is a first leg or second leg and handle accordingly if needed
    // But primarily just ensure status 'assigned' for pending shipments so they show up for rider actions.
    const shipmentIds = stops
        .filter(s => s.shipment_id && s.shipment?.status === 'pending')
        .map(s => s.shipment_id as string);

    if (shipmentIds.length > 0) {
        await prisma.shipment.updateMany({
            where: { id: { in: shipmentIds } },
            data: { status: 'assigned' }
        });
    }

    res.json({
      success: true,
      data: { route: updatedRoute },
      message: 'Route started successfully.',
    });
  } catch (error: any) {
    logger.error('Start route error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to start route.' },
    });
  }
};
