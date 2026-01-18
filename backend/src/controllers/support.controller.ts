import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import { io } from '../app';

/**
 * Create a new support ticket (User)
 */
export const createTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { subject, category, priority, message } = req.body;
  const userId = req.user?.id;

  if (!subject || !category || !message) {
    res.status(400).json({
      success: false,
      error: { message: 'Subject, category, and initial message are required' }
    });
    return;
  }

  // Generate ticket number TKT-XXXX
  const lastTicket = await prisma.supportTicket.findFirst({
    orderBy: { created_at: 'desc' },
    select: { ticket_number: true }
  });

  let nextNumber = 1001;
  if (lastTicket && lastTicket.ticket_number.startsWith('TKT-')) {
    const num = parseInt(lastTicket.ticket_number.split('-')[1]);
    if (!isNaN(num)) nextNumber = num + 1;
  }

  const ticketNumber = `TKT-${nextNumber}`;

  const ticket = await prisma.supportTicket.create({
    data: {
      ticket_number: ticketNumber,
      user_id: userId!,
      subject,
      category,
      priority: priority || 'Medium',
      messages: {
        create: {
          sender_id: userId!,
          message: message
        }
      }
    },
    include: {
      messages: true
    }
  });

  // Notify admins
  io.to('role:admin').emit('support:new-ticket', {
    ticketId: ticket.id,
    ticketNumber: ticket.ticket_number,
    subject: ticket.subject,
    userName: req.user?.fullName || 'User'
  });

  res.status(201).json({
    success: true,
    data: ticket
  });
});

/**
 * Get my support tickets
 */
export const getMyTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  const tickets = await prisma.supportTicket.findMany({
    where: { user_id: userId },
    orderBy: { updated_at: 'desc' },
    include: {
      messages: {
        take: 1,
        orderBy: { created_at: 'desc' }
      }
    }
  });

  res.json({
    success: true,
    data: tickets
  });
});

/**
 * User reply to their own ticket
 */
export const replyToTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { message } = req.body;
  const userId = req.user?.id;

  const ticket = await prisma.supportTicket.findFirst({
    where: { id, user_id: userId }
  });

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ticket not found or unauthorized' }
    });
    return;
  }

  const newMessage = await prisma.supportMessage.create({
    data: {
      ticket_id: id,
      sender_id: userId!,
      message: message
    },
    include: {
      sender: {
        select: {
          id: true,
          full_name: true,
          role: true
        }
      }
    }
  });

  // Update ticket updated_at and status if it was closed/resolved?
  // Usually we re-open if user replies to a resolved ticket
  const updatedStatus = ticket.status === 'Resolved' || ticket.status === 'Closed' ? 'Open' : ticket.status;

  await prisma.supportTicket.update({
    where: { id },
    data: { 
      updated_at: new Date(),
      status: updatedStatus
    }
  });

  // Notify admin/assignee
  const targetRoom = ticket.assigned_to ? `user:${ticket.assigned_to}` : 'role:admin';
  io.to(targetRoom).emit('support:new-message', {
    ticketId: id,
    message: newMessage
  });

  res.json({
    success: true,
    data: newMessage
  });
});
