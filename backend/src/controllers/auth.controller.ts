import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { sendOTPEmail } from '../services/email.service';
import { sendSMS } from '../services/sms.service';
import { settingsService } from '../services/settings.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, phone, role, businessName } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email already exists.',
        },
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        full_name: fullName,
        phone: phone || null,
        role: role || 'merchant',
        is_active: true,
        is_verified: false,
      },
    });

    if (role === 'merchant') {
      await prisma.merchant.create({
        data: {
          id: user.id,
          business_name: businessName || null,
          wallet_balance: 0,
          total_spent: 0,
        },
      });
    } else if (role === 'rider') {
      await prisma.rider.create({
        data: {
          id: user.id,
          is_online: false,
          wallet_balance: 0,
          total_earnings: 0,
          rating: 0,
          total_deliveries: 0,
        },
      });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || '',
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || '',
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
        },
        token,
        refreshToken,
        requiresVerification: !user.is_verified,
      },
      message: 'Registration successful. Please verify your email.',
    });
  } catch (error: any) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during registration.',
      },
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

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

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'Your account has been disabled. Please contact support.',
        },
      });
    }

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

    const settings = await settingsService.getSettings();
    const normalizedRole = user.role.toLowerCase();
    
    const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin';
    const is2FARequired = user.two_factor_enabled || (settings.two_factor_required_admins && isAdmin);

    if (is2FARequired) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        await prisma.verificationCode.create({
          data: {
            user_id: user.id,
            email: user.email,
            code,
            type: 'two_factor_login',
            expires_at: expiresAt,
          },
        });

        await sendOTPEmail(user.email, code, user.full_name || undefined);
        
        if (user.phone) {
             const smsMessage = `Your COD Express login code is: ${code}. Valid for 10 minutes.`;
             await sendSMS(user.phone, smsMessage);
        }

        return res.json({
            success: true,
            data: {
                requiresTwoFactor: true,
                email: user.email,
                twoFactorEnabled: user.two_factor_enabled
            },
            message: 'Two-factor authentication required. Verification code sent.',
        });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || '',
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || '',
    });

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

    await prisma.session.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        user_agent: userAgent,
        ip_address: req.ip || req.socket.remoteAddress || 'Unknown',
        device_name: deviceName,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          profileImageUrl: user.profile_image_url,
          twoFactorEnabled: user.two_factor_enabled,
        },
        token,
        refreshToken,
      },
      message: 'Login successful.',
    });
  } catch (error: any) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login.',
      },
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await prisma.verificationCode.create({
      data: {
        user_id: user.id,
        email: user.email,
        code,
        type: 'password_reset',
        expires_at: expiresAt,
      },
    });

    await sendOTPEmail(user.email, code, user.full_name || undefined);
    
    if (user.phone) {
        const smsMessage = `Your COD Express password reset code is: ${code}. Valid for 10 minutes.`;
        await sendSMS(user.phone, smsMessage);
    } 
    
    res.json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (error: any) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred. Please try again later.',
      },
    });
  }
};

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
    logger.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred. Please try again later.',
      },
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;

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

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email },
      data: {
        password_hash: passwordHash,
      },
    });

    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: {
        is_used: true,
      },
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please login with your new password.',
    });
  } catch (error: any) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred. Please try again later.',
      },
    });
  }
};

export const verifyLoginTwoFactor = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'User not found.' },
      });
    }

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        code,
        type: 'two_factor_login',
        is_used: false,
        expires_at: { gt: new Date() },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!verificationCode) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_OTP', message: 'Invalid or expired verification code.' },
      });
    }

    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { is_used: true },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || '',
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name || '',
    });

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

    await prisma.session.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        user_agent: userAgent,
        ip_address: req.ip || req.socket.remoteAddress || 'Unknown',
        device_name: deviceName,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          profileImageUrl: user.profile_image_url,
          twoFactorEnabled: user.two_factor_enabled,
        },
        token,
        refreshToken,
      },
      message: 'Login successful.',
    });

  } catch (error: any) {
    logger.error('Verify 2FA error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An error occurred during 2FA verification.' },
    });
  }
};

