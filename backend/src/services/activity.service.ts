import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface LogActivityParams {
  userId: string;
  action: string;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

export const logActivity = async (params: LogActivityParams) => {
  const { userId, action, description, ipAddress, userAgent, location } = params;

  try {
    await prisma.activityLog.create({
      data: {
        user_id: userId,
        action,
        description,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        location: location || null,
      },
    });
  } catch (error) {
    // We don't want to fail the request if logging fails, but we should log the error
    logger.error('Failed to log activity:', error);
  }
};
