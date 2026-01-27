import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import { logger } from '../utils/logger';
import { io } from '../app';

/**
 * Get all support tickets (Admin View)
 */
export const getAllTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { status, priority, search, page = 1, limit = 10 } = req.query;

  const where: any = {};

  if (status && status !== 'all') {
    where.status = status;
  }

  if (priority && priority !== 'all') {
    where.priority = priority;
  }

  if (search) {
    where.OR = [
      { ticket_number: { contains: search as string, mode: 'insensitive' } },
      { subject: { contains: search as string, mode: 'insensitive' } },
      { user: { full_name: { contains: search as string, mode: 'insensitive' } } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take,
      orderBy: { updated_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            role: true,
            email: true,
            phone: true
          }
        },
        assignee: {
          select: {
            id: true,
            full_name: true
          }
        }
      }
    }),
    prisma.supportTicket.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      tickets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / take)
      }
    }
  });
});

/**
 * Get support statistics
 */
export const getSupportStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [total, open, inProgress, resolved, closed] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: 'Open' } }),
    prisma.supportTicket.count({ where: { status: 'In Progress' } }),
    prisma.supportTicket.count({ where: { status: 'Resolved' } }),
    prisma.supportTicket.count({ where: { status: 'Closed' } })
  ]);

  res.json({
    success: true,
    data: {
      total,
      open,
      inProgress,
      resolved,
      closed
    }
  });
});

/**
 * Get ticket by ID with full conversation
 */
export const getTicketById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          full_name: true,
          role: true,
          email: true,
          phone: true,
          profile_image_url: true
        }
      },
      assignee: {
        select: {
          id: true,
          full_name: true
        }
      },
      messages: {
        orderBy: { created_at: 'asc' },
        include: {
          sender: {
            select: {
              id: true,
              full_name: true,
              role: true
            }
          }
        }
      }
    }
  });

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ticket not found' }
    });
    return;
  }

  res.json({
    success: true,
    data: ticket
  });
});

/**
 * Admin reply to a support ticket
 */
export const replyToTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { message, status } = req.body;
  const adminId = req.user?.id;

  if (!message && !status) {
    res.status(400).json({
      success: false,
      error: { message: 'Message or status update is required' }
    });
    return;
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id }
  });

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Ticket not found' }
    });
    return;
  }

  // Transaction for message and status update
  const result = await prisma.$transaction(async (tx) => {
    let newMessage = null;
    
    if (message) {
      newMessage = await tx.supportMessage.create({
        data: {
          ticket_id: id,
          sender_id: adminId!,
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
    }

    const updatedTicket = await tx.supportTicket.update({
      where: { id },
      data: {
        status: status || ticket.status,
        assigned_to: adminId // Auto-assign to the admin who replies
      }
    });

    return { newMessage, updatedTicket };
  });

  // Emit real-time notification via Socket.io
  if (result.newMessage) {
    const room = `user:${ticket.user_id}`;
    logger.info(`📢 Emitting 'support:new-message' to room: ${room} for Ticket: ${id}`);
    io.to(room).emit('support:new-message', {
      ticketId: id,
      message: result.newMessage
    });
  }

  if (status && status !== ticket.status) {
    io.to(`user:${ticket.user_id}`).emit('support:status-updated', {
      ticketId: id,
      status: status
    });
  }

  res.json({
    success: true,
    data: result
  });
});

/**
 * Update ticket status (Admin)
 */
export const updateTicketStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, priority } = req.body;

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: status || undefined,
      priority: priority || undefined
    }
  });

  // Notify user
  io.to(`user:${ticket.user_id}`).emit('support:status-updated', {
    ticketId: id,
    status: ticket.status,
    priority: ticket.priority
  });

  res.json({
    success: true,
    data: ticket
  });
});

/**
 * Create a support ticket on behalf of a user (Admin)
 */
export const createTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { user_id, subject, category, priority, message } = req.body;
  const adminId = req.user?.id;

  if (!user_id || !subject || !category || !message) {
    res.status(400).json({
      success: false,
      error: { message: 'User ID, subject, category, and initial message are required' }
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

  const result = await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        ticket_number: ticketNumber,
        user_id: user_id,
        subject,
        category,
        priority: priority || 'Medium',
        assigned_to: adminId, // Auto-assign to the admin who created it
        messages: {
          create: {
            sender_id: adminId!,
            message: message
          }
        }
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                full_name: true,
                role: true
              }
            }
          }
        },
        user: {
            select: {
                id: true,
                full_name: true,
                role: true,
                email: true,
                phone: true
            }
        },
        assignee: {
            select: {
                id: true,
                full_name: true
            }
        }
      }
    });

    return ticket;
  });

  // Notify user
  io.to(`user:${user_id}`).emit('support:new-ticket', {
    ticketId: result.id,
    ticketNumber: result.ticket_number,
    subject: result.subject
  });

  res.status(201).json({
    success: true,
    data: result
  });
});

/**
 * Search users for ticket creation (Admin)
 */
export const searchUsers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q } = req.query;

  if (!q || String(q).length < 2) {
    res.json({ success: true, data: [] });
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { full_name: { contains: String(q), mode: 'insensitive' } },
        { email: { contains: String(q), mode: 'insensitive' } },
        { phone: { contains: String(q), mode: 'insensitive' } },
      ],
      role: { in: ['merchant', 'rider'] }
    },
    take: 10,
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      phone: true
    }
  });

  res.json({
    success: true,
    data: users
  });
});

