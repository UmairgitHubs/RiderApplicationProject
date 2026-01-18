import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import prisma from '../config/database';
import { settingsService } from '../services/settings.service';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please provide a valid token.',
        },
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = verifyToken(token);
      req.user = decoded;

      // Ensure settingService is imported at top: import { settingsService } from '../services/settings.service';
      // Ensure prisma is imported: import prisma from '../config/database';

      // 1. Check Session Timeout (from DB settings)
      // We need to find the session. Since JWT is stateless, we might not have session_id in payload.
      // However, auth controller creates a session with 'token: refreshToken'.
      // If we only have access token here, we can't easily find the specific session unless we store session_id in JWT.
      // Strategy: Fallback to checking User's latest session or enforce general inactivity if we tracked it on User model.
      // Better Strategy: Users table doesn't have last_active. Session table does.
      // But we don't know WHICH session this token belongs to without session_id in JWT.
      
      // FIX: For now, strict session management usually requires looking up the user.
      // Let's check the GLOBAL validation first.
      
      const settings = await settingsService.getSettings();
      const timeoutMinutes = settings.session_timeout || 30;
      
      // If we want to strictly enforce "Logout inactive users", we need to track their activity.
      // Let's assume we want to update the 'User' last active time if we don't have session ID.
      // OR, we check if the user has ANY active session that isn't expired.
      
      // REAL IMPLEMENTATION:
      // We will check the user's sessions. If ALL are expired based on this new rule, we deny access.
      // But that's heavy.
      
      // ALTERNATIVE: JWT expiration is static '7d'.
      // The requirement "Automatically log out inactive users" implies sliding window.
      // We should check the 'Session' table. But we need to know the session.
      // If we can't identify the session, we can't implement this properly without refactoring JWT to include session_id.
      
      // Let's check `auth.controller.ts` login again. It stores `userId` in session.
      // Let's find the most recent session for this user.
      const session = await prisma.session.findFirst({
        where: { user_id: decoded.id },
        orderBy: { last_active: 'desc' }
      });

      if (session) {
         const now = new Date();
         const lastActive = new Date(session.last_active);
         const diffMinutes = (now.getTime() - lastActive.getTime()) / 1000 / 60;

         if (diffMinutes > timeoutMinutes) {
             // Session timed out
             await prisma.session.delete({ where: { id: session.id } }); // or { user_id: decoded.id } to kill all? let's kill specific.
             return res.status(401).json({
                success: false,
                error: {
                  code: 'SESSION_EXPIRED',
                  message: `Session timed out due to inactivity (${timeoutMinutes} mins). Please login again.`,
                },
              });
         }

         // Update last_active
         // Optimization: Don't update on EVERY request (e.g. only if > 1 min has passed) to save DB writes
         if (diffMinutes > 1) {
             await prisma.session.update({
                 where: { id: session.id },
                 data: { last_active: now }
             });
         }
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token. Please login again.',
        },
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during authentication.',
      },
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions. You do not have access to this resource.',
        },
      });
    }
    
    next();
  };
};

export const requireAdmin = [authenticate, authorize('admin', 'ADMIN', 'hub_manager')];


