import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { sendOTPEmail } from '../services/email.service';
import { sendSMS } from '../services/sms.service';
import { settingsService } from '../services/settings.service';
import { logActivity } from '../services/activity.service';
import { AuthRequest } from '../middleware/auth.middleware';

// Admin Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    // Check if user is admin or hub_manager
    if (user.role !== 'admin' && user.role !== 'hub_manager') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'Access denied. Admin credentials required.',
        },
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled. Please contact support.',
        },
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        },
      });
    }

    // Check 2FA Requirements
    const settings = await settingsService.getSettings();
    const normalizedRole = user.role.toLowerCase();
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin';
    
    // Check if user has 2FA enabled individually OR if global settings require it for admins
    const is2FARequired = user.two_factor_enabled || (settings.two_factor_required_admins && isAdmin);

    if (is2FARequired) {
      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

      // Save OTP
      await prisma.verificationCode.create({
        data: {
          user_id: user.id,
          email: user.email,
          code,
          type: 'two_factor_auth', // Using existing type for admin controller consistency
          expires_at: expiresAt,
        },
      });

      // Send OTP email
      await sendOTPEmail(
        user.email,
        code,
        user.full_name || undefined,
        'Two-Factor Authentication Code - COD Express',
        'Two-Factor Authentication',
        'A secure login attempt requires verification.'
      );
      
      // Send OTP via SMS (if phone exists)
      if (user.phone) {
           const smsMessage = `Your COD Express login code is: ${code}. Valid for 10 minutes.`;
           await sendSMS(user.phone, smsMessage);
      }
      
      logger.info(`2FA OTP sent to ${user.email} (System Enforced: ${settings.two_factor_required_admins})`);

      return res.json({
        success: true,
        data: {
          requiresTwoFactor: true,
          email: user.email,
        },
        message: 'Two-factor authentication required. Please check your email for the code.',
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || '',
    });

    // Create active session
    const userAgent = req.headers['user-agent'] || 'Unknown';
    // Simple device parsing
    let deviceName = 'Unknown Device';
    if (userAgent.includes('Windows')) deviceName = 'Windows PC';
    else if (userAgent.includes('Macintosh')) deviceName = 'Mac';
    else if (userAgent.includes('Linux')) deviceName = 'Linux PC';
    else if (userAgent.includes('Android')) deviceName = 'Android Device';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceName = 'iOS Device';
    
    // Add Browser info
    if (userAgent.includes('Chrome')) deviceName += ' (Chrome)';
    else if (userAgent.includes('Firefox')) deviceName += ' (Firefox)';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) deviceName += ' (Safari)';

    // Generate refresh token (admin controller was missing this but used it in auth controller)
    // We need to generate a unique token for the session.
    const { v4: uuidv4 } = require('uuid');
    const sessionToken = uuidv4(); 

    await prisma.session.create({
      data: {
        user_id: user.id,
        token: sessionToken, 
        user_agent: userAgent,
        ip_address: req.ip || req.socket.remoteAddress || 'Unknown',
        device_name: deviceName,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    await logActivity({
      userId: user.id,
      action: 'Logged in',
      description: `Logged in from ${deviceName}`,
      ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
      userAgent,
      location: 'Unknown', // In real app, we would use GeoIP
    });

    logger.info(`Admin logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          profile_image_url: user.profile_image_url,
        },
        token,
      },
      message: 'Login successful.',
    });
  } catch (error: any) {
    logger.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login.',
      },
    });
  }
};

// Verify 2FA Login
export const verifyTwoFactorLogin = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    // Verify OTP
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'two_factor_auth',
        is_used: false,
        expires_at: {
          gt: new Date(),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid or expired verification code.',
        },
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.',
        },
      });
    }

    // Mark OTP as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { is_used: true },
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || '',
    });

    // Create active session (Duplicated from login for now to ensure consistency)
    const userAgent = req.headers['user-agent'] || 'Unknown';
    let deviceName = 'Unknown Device';
    if (userAgent.includes('Windows')) deviceName = 'Windows PC';
    else if (userAgent.includes('Macintosh')) deviceName = 'Mac';
    else if (userAgent.includes('Linux')) deviceName = 'Linux PC';
    else if (userAgent.includes('Android')) deviceName = 'Android Device';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) deviceName = 'iOS Device';
    
    if (userAgent.includes('Chrome')) deviceName += ' (Chrome)';
    else if (userAgent.includes('Firefox')) deviceName += ' (Firefox)';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) deviceName += ' (Safari)';

    const { v4: uuidv4 } = require('uuid');
    const sessionToken = uuidv4(); 

    await prisma.session.create({
      data: {
        user_id: user.id,
        token: sessionToken, 
        user_agent: userAgent,
        ip_address: req.ip || req.socket.remoteAddress || 'Unknown',
        device_name: deviceName,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    });

    await logActivity({
      userId: user.id,
      action: 'Logged in',
      description: `Logged in from ${deviceName} using 2FA`,
      ipAddress: req.ip || req.socket.remoteAddress || 'Unknown',
      userAgent,
      location: 'Unknown',
    });

    logger.info(`Admin 2FA login successful: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
          profile_image_url: user.profile_image_url,
        },
        token,
      },
      message: 'Login successful.',
    });

  } catch (error: any) {
    logger.error('Admin 2FA verification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during 2FA verification.',
      },
    });
  }
};

// Get Current Admin User
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        role: true,
        profile_image_url: true,
        is_active: true,
        is_verified: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.',
        },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error('Get admin user error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred.',
      },
    });
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
      });
    }

    // Check if user is admin or hub_manager
    if (user.role !== 'admin' && user.role !== 'hub_manager') {
      // Don't reveal if user exists for security
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
      });
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    // Save OTP
    await prisma.verificationCode.create({
      data: {
        user_id: user.id,
        email: user.email,
        code,
        type: 'password_reset',
        expires_at: expiresAt,
      },
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(user.email, code, user.full_name || undefined);
    
    if (emailResult.success) {
      logger.info(`Admin password reset OTP email sent successfully to ${email}`);
    } else {
      logger.warn(`Failed to send OTP email to ${email}: ${emailResult.error}`);
      // Still log OTP for development/testing purposes if email fails
      logger.info(`Admin password reset OTP for ${email}: ${code}`);
    }

    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (error: any) {
    logger.error('Admin forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred. Please try again later.',
      },
    });
  }
};

// Verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'password_reset',
        is_used: false,
        expires_at: {
          gt: new Date(),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid or expired verification code.',
        },
      });
    }

    res.json({
      success: true,
      message: 'Verification code is valid.',
      data: {
        email,
        code,
      },
    });
  } catch (error: any) {
    logger.error('Admin verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred. Please try again later.',
      },
    });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

    // Validate password length
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password must be at least 6 characters long.',
        },
      });
    }

    // Verify OTP
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'password_reset',
        is_used: false,
        expires_at: {
          gt: new Date(),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'Invalid or expired verification code.',
        },
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found.',
        },
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
      },
    });

    // Mark OTP as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: {
        is_used: true,
      },
    });

    logger.info(`Admin password reset successful for ${email}`);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error: any) {
    logger.error('Admin reset password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred. Please try again later.',
      },
    });
  }
};





