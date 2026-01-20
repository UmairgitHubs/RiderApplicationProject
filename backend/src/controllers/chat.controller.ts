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

/**
 * Get or create a support conversation for the current user
 */
export const getSupportConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    // Look for an existing 'Support Chat' ticket that is not closed
    let ticket = await prisma.supportTicket.findFirst({
        where: {
            user_id: userId,
            category: 'Support Chat',
            status: { not: 'Closed' }
        },
        orderBy: { created_at: 'desc' }
    });

    if (!ticket) {
        // Create a new support ticket for chat
        const lastTicket = await prisma.supportTicket.findFirst({
            orderBy: { created_at: 'desc' },
            select: { ticket_number: true }
        });

        let nextNumber = 1001;
        if (lastTicket && lastTicket.ticket_number.startsWith('TKT-')) {
            const num = parseInt(lastTicket.ticket_number.split('-')[1].replace(/\D/g, ''));
            if (!isNaN(num)) nextNumber = num + 1;
        }

        ticket = await prisma.supportTicket.create({
            data: {
                ticket_number: `TKT-${nextNumber}`,
                user_id: userId,
                subject: 'Live Support Chat',
                category: 'Support Chat',
                priority: 'Medium',
                status: 'Open'
            }
        });
    }

    res.json({
        success: true,
        data: ticket
    });
});

/**
 * Get messages for a support conversation
 */
export const getSupportMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { conversationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const messages = await prisma.supportMessage.findMany({
        where: { ticket_id: conversationId },
        orderBy: { created_at: 'asc' },
        include: {
            sender: {
                select: { id: true, full_name: true, role: true }
            }
        }
    });

    res.json({
        success: true,
        data: {
            messages: messages.map(m => ({
                id: m.id,
                text: m.message,
                senderId: m.sender_id,
                senderRole: m.sender.role,
                createdAt: m.created_at,
                isRead: m.is_read
            }))
        }
    });
});

/**
 * Send a message to support
 */
export const sendSupportMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { text, conversationId } = req.body;
    const userId = req.user?.id;

    if (!text || !userId) {
        return res.status(400).json({ success: false, error: { message: 'Message text is required' } });
    }

    let targetConversationId = conversationId;

    if (!targetConversationId) {
        // Find latest open support chat ticket
        const ticket = await prisma.supportTicket.findFirst({
            where: {
                user_id: userId,
                category: 'Support Chat',
                status: { not: 'Closed' }
            },
            orderBy: { created_at: 'desc' }
        });
        
        if (ticket) {
            targetConversationId = ticket.id;
        } else {
             // Create a new support ticket for chat
             const lastTicket = await prisma.supportTicket.findFirst({
                orderBy: { created_at: 'desc' },
                select: { ticket_number: true }
            });

            let nextNumber = 1001;
            if (lastTicket && lastTicket.ticket_number.startsWith('TKT-')) {
                const num = parseInt(lastTicket.ticket_number.split('-')[1].replace(/\D/g, ''));
                if (!isNaN(num)) nextNumber = num + 1;
            }

            const newTicket = await prisma.supportTicket.create({
                data: {
                    ticket_number: `TKT-${nextNumber}`,
                    user_id: userId,
                    subject: 'Live Support Chat',
                    category: 'Support Chat',
                    priority: 'Medium',
                    status: 'Open'
                }
            });
            targetConversationId = newTicket.id;
        }
    }

    const message = await prisma.supportMessage.create({
        data: {
            ticket_id: targetConversationId,
            sender_id: userId,
            message: text
        },
        include: {
            sender: {
                select: { id: true, full_name: true, role: true }
            }
        }
    });

    // Notify admins via socket
    io.to('role:admin').emit('support:new-message', {
        ticketId: targetConversationId,
        message: {
            id: message.id,
            text: message.message,
            senderId: message.sender_id,
            senderRole: message.sender.role,
            createdAt: message.created_at
        }
    });

    res.status(201).json({
        success: true,
        data: {
            message: {
                id: message.id,
                text: message.message,
                senderId: message.sender_id,
                senderRole: message.sender.role,
                createdAt: message.created_at
            },
            conversationId: targetConversationId
        }
    });
});
