import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';

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
