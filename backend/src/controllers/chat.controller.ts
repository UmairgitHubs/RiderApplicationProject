import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import { io } from '../app';
import { logger } from '../utils/logger';

/**
 * Send a message within a shipment context
 */
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shipmentId, content, recipientId } = req.body;
    const senderId = req.user?.id;

    if (!shipmentId || !content || !senderId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Missing required fields: shipmentId, content' }
        });
    }

    // Verify shipment exists and user is part of it
    const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        select: { id: true, merchant_id: true, rider_id: true }
    });

    if (!shipment) {
        return res.status(404).json({
            success: false,
            error: { message: 'Shipment not found' }
        });
    }

    // Authorization check
    const isParticipant = shipment.merchant_id === senderId || shipment.rider_id === senderId;
    const isAdmin = req.user?.role === 'admin';

    if (!isParticipant && !isAdmin) {
        return res.status(403).json({
            success: false,
            error: { message: 'Unauthorized: You are not a participant in this shipment delivery.' }
        });
    }

    // Determine recipient if not provided
    let finalRecipientId = recipientId;
    if (!finalRecipientId) {
        finalRecipientId = shipment.merchant_id === senderId ? shipment.rider_id : shipment.merchant_id;
    }

    // Create message (recipient_id remains null if still not found, e.g. no rider assigned)
    const message = await prisma.chatMessage.create({
        data: {
            shipment_id: shipmentId,
            sender_id: senderId,
            recipient_id: finalRecipientId || null,
            content: content,
            message_type: 'text'
        },
        include: {
            sender: {
                select: { id: true, full_name: true, role: true }
            }
        }
    });

    // Real-time event - only if recipient exists
    if (finalRecipientId) {
        io.to(`user:${finalRecipientId}`).emit('chat:new-message', {
            shipmentId,
            message
        });
    }
    
    // Also notify admins of new shipment messages
    io.to('role:admin').emit('chat:new-message', {
        shipmentId,
        message
    });

    res.status(201).json({
        success: true,
        data: message
    });
});

/**
 * Get messages for a specific shipment
 */
export const getMessagesByShipment = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shipmentId } = req.params;
    const userId = req.user?.id;

    if (!shipmentId || !userId) {
        return res.status(400).json({
            success: false,
            error: { message: 'Shipment ID is required' }
        });
    }

    // Authorization check
    const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        select: { merchant_id: true, rider_id: true }
    });

    if (!shipment) {
        return res.status(404).json({
            success: false,
            error: { message: 'Shipment not found' }
        });
    }

    if (shipment.merchant_id !== userId && shipment.rider_id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: { message: 'Access denied' }
        });
    }

    const messages = await prisma.chatMessage.findMany({
        where: { shipment_id: shipmentId },
        orderBy: { created_at: 'asc' },
        include: {
            sender: {
                select: { id: true, full_name: true, role: true }
            }
        },
        take: 100 // Limit for performance
    });

    res.json({
        success: true,
        data: messages
    });
});

/**
 * Mark messages as read
 */
export const markAsRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { shipmentId } = req.params;
    const userId = req.user?.id;

    await prisma.chatMessage.updateMany({
        where: {
            shipment_id: shipmentId,
            recipient_id: userId,
            is_read: false
        },
        data: { is_read: true }
    });

    res.json({ success: true });
});
