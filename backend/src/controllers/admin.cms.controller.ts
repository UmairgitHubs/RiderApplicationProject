import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import { sendSystemUpdateNotification, sendPromotionNotification, NotificationService } from '../services/notification.service';

// Get all CMS items
export const getAllCMS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, search } = req.query;

  const where: any = {};
  if (type && type !== 'all' && type !== 'Faqs' && type !== 'Announcements' && type !== 'Banners' && type !== 'Legal Pages') {
    where.type = (type as string).toUpperCase();
  } else if (type === 'Faqs') {
    where.type = 'FAQ';
  } else if (type === 'Announcements') {
    where.type = 'ANNOUNCEMENT';
  } else if (type === 'Banners') {
    where.type = 'BANNER';
  } else if (type === 'Legal Pages') {
    where.type = 'LEGAL';
  }

  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { content: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const items = await prisma.cmsContent.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });

  res.json({
    success: true,
    data: items,
  });
});

// Get CMS stats
export const getCMSStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [faqs, announcements, banners, legal] = await Promise.all([
    prisma.cmsContent.count({ where: { type: 'FAQ' } }),
    prisma.cmsContent.count({ where: { type: 'ANNOUNCEMENT' } }),
    prisma.cmsContent.count({ where: { type: 'BANNER' } }),
    prisma.cmsContent.count({ where: { type: 'LEGAL' } }),
  ]);

  res.json({
    success: true,
    data: {
      faqs,
      announcements,
      banners,
      legal,
    }
  });
});

// Create CMS item
export const createCMS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type, title, content, category, image_url, status } = req.body;

  const item = await prisma.cmsContent.create({
    data: {
      type: type.toUpperCase(),
      title,
      content,
      category,
      image_url,
      status: status || 'published',
    },
  });

  // Trigger Notifications if Published
  if (item.status === 'published') {
    const isAnnouncement = item.type === 'ANNOUNCEMENT';
    const isPromotion = item.type === 'BANNER' || (item.category && item.category.toLowerCase().includes('promotion'));

    if (isAnnouncement || isPromotion) {
        // Find users who have opted in
        // optimization: select only id to minimize data transfer
        const where: any = { is_active: true };
        
        if (isAnnouncement) where.notif_system_updates = true;
        if (isPromotion) where.notif_promotions = true;

        const users = await prisma.user.findMany({
            where,
            select: { id: true }
        });

        const userIds = users.map(u => u.id);

        if (userIds.length > 0) {
            // Send in background (don't await)
            NotificationService.sendBulkNotification(
                userIds,
                {
                    type: isAnnouncement ? 'system_update' : 'promotion',
                    title: item.title,
                    body: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''), // Truncate body
                    data: { cmsId: item.id }
                } as any
            ).catch(err => console.error('Bulk notification error:', err));
        }
    }
  }

  res.status(201).json({
    success: true,
    data: item,
  });
});

// Update CMS item
export const updateCMS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, category, image_url, status, type } = req.body;

  const item = await prisma.cmsContent.update({
    where: { id },
    data: {
      title,
      content,
      category,
      image_url,
      status,
      type: type?.toUpperCase(),
    },
  });

  res.json({
    success: true,
    data: item,
  });
});

// Delete CMS item
export const deleteCMS = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await prisma.cmsContent.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: 'Item deleted successfully',
  });
});

// Get public CMS content (published only)
export const getPublicContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { type } = req.query;

  const where: any = {
    status: 'published'
  };

  if (type) {
     const typeStr = type as string;
     // Handle various case inputs
     if (typeStr.toUpperCase() === 'FAQS' || typeStr === 'Faqs') {
         where.type = 'FAQ';
     } else {
         where.type = typeStr.toUpperCase();
     }
  }

  const items = await prisma.cmsContent.findMany({
    where,
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      image_url: true,
      created_at: true,
      type: true
    }
  });

  res.json({
    success: true,
    data: items,
  });
});
