import { Server, Socket } from 'socket.io';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { logger } from '../utils/logger';
import prisma from '../config/database';

interface AuthenticatedSocket extends Socket {
  user?: TokenPayload;
}

export const setupSocket = (io: Server) => {
  // Authentication middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = verifyToken(token);
        socket.user = decoded;
        next();
      } catch (error) {
        return next(new Error('Authentication error: Invalid token'));
      }
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (!socket.user) {
      socket.disconnect();
      return;
    }

    const userId = socket.user.id;
    const userRole = socket.user.role;

    logger.info(`Socket connected: ${userId} (${userRole})`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join role-specific room
    socket.join(`role:${userRole}`);

    // Handle rider location updates
    socket.on('rider:location-update', async (data: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      shipmentId?: string;
    }) => {
      try {
        if (userRole !== 'rider') {
          socket.emit('error', { message: 'Unauthorized: Only riders can update location' });
          return;
        }

        // Save location to database
        await prisma.riderLocation.create({
          data: {
            rider_id: userId,
            shipment_id: data.shipmentId || null,
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: data.accuracy || null,
            speed: data.speed || null,
            heading: data.heading || null,
          },
        });

        // Update rider's current location
        await prisma.rider.update({
          where: { id: userId },
          data: {
            current_latitude: data.latitude,
            current_longitude: data.longitude,
          },
        });

        // If on active delivery, notify merchant
        if (data.shipmentId) {
          const shipment = await prisma.shipment.findUnique({
            where: { id: data.shipmentId },
            include: { merchant: true },
          });

          if (shipment) {
            // Emit to merchant
            io.to(`user:${shipment.merchant_id}`).emit('shipment:location-update', {
              shipmentId: data.shipmentId,
              location: {
                lat: data.latitude,
                lng: data.longitude,
              },
              timestamp: new Date().toISOString(),
            });
          }
        }

        socket.emit('rider:location-update:success');
      } catch (error: any) {
        logger.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle shipment status updates
    socket.on('shipment:status-update', async (data: {
      shipmentId: string;
      status: string;
      notes?: string;
    }) => {
      try {
        // Verify user has permission to update this shipment
        const shipment = await prisma.shipment.findUnique({
          where: { id: data.shipmentId },
        });

        if (!shipment) {
          socket.emit('error', { message: 'Shipment not found' });
          return;
        }

        // Check permissions
        const canUpdate = 
          shipment.merchant_id === userId || 
          shipment.rider_id === userId || 
          userRole === 'admin';

        if (!canUpdate) {
          socket.emit('error', { message: 'Unauthorized to update this shipment' });
          return;
        }

        // Update shipment status
        await prisma.shipment.update({
          where: { id: data.shipmentId },
          data: {
            status: data.status,
            updated_at: new Date(),
          },
        });

        // Create tracking entry
        await prisma.shipmentTracking.create({
          data: {
            shipment_id: data.shipmentId,
            status: data.status,
            notes: data.notes || null,
            updated_by: userId,
          },
        });

        // Notify relevant users
        io.to(`user:${shipment.merchant_id}`).emit('shipment:status-update', {
          shipmentId: data.shipmentId,
          status: data.status,
          timestamp: new Date().toISOString(),
        });

        if (shipment.rider_id) {
          io.to(`user:${shipment.rider_id}`).emit('shipment:status-update', {
            shipmentId: data.shipmentId,
            status: data.status,
            timestamp: new Date().toISOString(),
          });
        }

        socket.emit('shipment:status-update:success');
      } catch (error: any) {
        logger.error('Status update error:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // --- Order Chat Integration ---
    
    // Join a room for a specific order/shipment
    socket.on('join_order', async (data: { orderId: string }) => {
      try {
        const { orderId } = data;
        
        // Security check: must be merchant, rider, or admin
        const shipment = await prisma.shipment.findUnique({
          where: { id: orderId },
          select: { merchant_id: true, rider_id: true }
        });

        if (!shipment) {
          socket.emit('error', { message: 'Order not found' });
          return;
        }

        const isAllowed = 
          shipment.merchant_id === userId || 
          shipment.rider_id === userId || 
          userRole === 'admin';

        if (!isAllowed) {
          socket.emit('error', { message: 'Unauthorized: You are not a participant in this order' });
          return;
        }

        socket.join(`order:${orderId}`);
        logger.info(`User ${userId} joined order room: ${orderId}`);
        socket.emit('join_order:success', { orderId });
      } catch (error) {
        logger.error('join_order error:', error);
      }
    });

    // Send a message within an order room
    socket.on('send_message', async (data: { orderId: string; content: string; recipientId: string }) => {
      try {
        const { orderId, content, recipientId } = data;
        
        // Fetch shipment to determine participants and security
        const shipment = await prisma.shipment.findUnique({
             where: { id: orderId },
             select: { merchant_id: true, rider_id: true }
        });

        if (!shipment) {
             socket.emit('error', { message: 'Order not found' });
             return;
        }

        let finalRecipientId = recipientId;

        // Force-resolve recipient for reliability
        if (userId === shipment.merchant_id) {
            finalRecipientId = shipment.rider_id!;
        } else if (userId === shipment.rider_id) {
            finalRecipientId = shipment.merchant_id;
        }
        // If admin, respect the passed recipientId (or add logic if needed)

        // Save message via Prisma
        const message = await prisma.chatMessage.create({
          data: {
            shipment_id: orderId,
            sender_id: userId,
            recipient_id: finalRecipientId || null,
            content: content,
          },
          include: {
            sender: {
              select: { id: true, full_name: true, role: true }
            }
          }
        });

        // Emit message to the room (for those active in chat)
        io.to(`order:${orderId}`).emit('chat:new-message', {
          orderId,
          shipmentId: orderId, 
          message: {
            id: message.id,
            content: message.content,
            senderId: message.sender_id,
            senderName: message.sender.full_name,
            createdAt: message.created_at
          }
        });

        // Emit to recipient's personal room (For Notifications)
        if (finalRecipientId) {
            io.to(`user:${finalRecipientId}`).emit('chat:new-message', {
                orderId,
                shipmentId: orderId, 
                message: {
                    id: message.id,
                    content: message.content,
                    senderId: message.sender_id,
                    senderName: message.sender.full_name,
                    createdAt: message.created_at
                }
            });
        }

        // Offline logic: If recipient is not in the room
        const room = io.sockets.adapter.rooms.get(`order:${orderId}`);
        const recipientRoom = io.sockets.adapter.rooms.get(`user:${recipientId}`);
        
        // Check if recipient is "offline" (not connected to socket or not in the order room)
        const isRecipientInOrderRoom = room && Array.from(room).some(id => {
          const s = io.sockets.sockets.get(id) as AuthenticatedSocket;
          return s && s.user?.id === recipientId;
        });

        if (!isRecipientInOrderRoom) {
          const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { fcm_token: true }
          });

          if (recipient?.fcm_token) {
            const { sendPushNotification } = await import('../services/firebase.service');
            await sendPushNotification(
              recipient.fcm_token,
              `New message from ${socket.user?.fullName || 'User'}`,
              content,
              { orderId, type: 'chat' }
            );
          }
        }

        socket.emit('send_message:success', { messageId: message.id });
      } catch (error) {
        logger.error('send_message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${userId}`);
    });
  });

  logger.info('Socket.io server initialized');
};


