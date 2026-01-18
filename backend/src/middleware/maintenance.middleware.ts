import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settings.service';

export const maintenanceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await settingsService.getSettings();
    if (settings.maintenance_mode) {
      const user = (req as any).user;
      
      // Allow specific roles to bypass
      const allowedRoles = ['ADMIN', 'SUPER_ADMIN'];
      
      // If user is authenticated and is an admin, allow
      if (user && allowedRoles.includes(user.role)) {
        return next();
      }
      
      // Allow authentication routes so admins can log in
      if (req.path.startsWith('/auth') || req.path.startsWith('/admin')) {
        return next();
      }

      // If user is authenticated and is an admin (double check if auth middleware ran)

      return res.status(503).json({ 
        success: false,
        error: {
            code: 'MAINTENANCE_MODE',
            message: 'System is currently under maintenance. Please try again later.' 
        }
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};
