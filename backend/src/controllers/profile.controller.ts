import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { logActivity } from '../services/activity.service';

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        merchant: true,
        rider: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.',
        },
      });
    }

    const profile: any = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      role: user.role,
      profileImageUrl: user.profile_image_url,
      isVerified: user.is_verified,
      languagePreference: user.language_preference,
      themePreference: user.theme_preference,
      emailNotifications: user.email_notifications,
      pushNotifications: user.push_notifications,
      smsNotifications: user.sms_notifications,
      weeklyReports: user.weekly_reports,
      notifOrderUpdates: user.notif_order_updates,
      notifDeliveryAlerts: user.notif_delivery_alerts,
      notifPayments: user.notif_payments,
      notifPromotions: user.notif_promotions,
      notifSystemUpdates: user.notif_system_updates,
      twoFactorEnabled: user.two_factor_enabled,
      createdAt: user.created_at,
    };

    if (user.role === 'merchant' && user.merchant) {
      profile.businessName = user.merchant.business_name;
      profile.businessType = user.merchant.business_type;
      profile.businessAddress = user.merchant.address;
      profile.city = user.merchant.city;
      profile.address = user.merchant.address; // For backwards compatibility
      profile.walletBalance = user.merchant.wallet_balance;
      profile.totalSpent = user.merchant.total_spent;
    }

    if (user.role === 'rider' && user.rider) {
      profile.cnic = user.rider.cnic;
      profile.licenseNumber = user.rider.license_number;
      profile.vehicleType = user.rider.vehicle_type;
      profile.vehicleNumber = user.rider.vehicle_number;
      profile.isOnline = user.rider.is_online;
      profile.walletBalance = user.rider.wallet_balance;
      profile.totalEarnings = user.rider.total_earnings;
      profile.rating = user.rider.rating;
      profile.totalDeliveries = user.rider.total_deliveries;
    }

    res.json({
      success: true,
      data: { profile },
    });
  } catch (error: any) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching profile.',
      },
    });
  }
};

// Update profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const {
      fullName,
      email,
      phone,
      profileImageUrl,
      languagePreference,
      themePreference,
      emailNotifications,
      pushNotifications,
      smsNotifications,
      weeklyReports,
      notifOrderUpdates,
      notifDeliveryAlerts,
      notifPayments,
      notifPromotions,
      notifSystemUpdates,
      businessName,
      businessType,
      cnic,
      licenseNumber,
      vehicleType,
      vehicleNumber,
      address,
    } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        merchant: true,
        rider: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.',
        },
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email address is already in use.',
          },
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { full_name: fullName }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(profileImageUrl && { profile_image_url: profileImageUrl }),
        ...(languagePreference && { language_preference: languagePreference }),
        ...(themePreference && { theme_preference: themePreference }),
        ...(emailNotifications !== undefined && { email_notifications: emailNotifications }),
        ...(pushNotifications !== undefined && { push_notifications: pushNotifications }),
        ...(smsNotifications !== undefined && { sms_notifications: smsNotifications }),
        ...(weeklyReports !== undefined && { weekly_reports: weeklyReports }),
        ...(notifOrderUpdates !== undefined && { notif_order_updates: notifOrderUpdates }),
        ...(notifDeliveryAlerts !== undefined && { notif_delivery_alerts: notifDeliveryAlerts }),
        ...(notifPayments !== undefined && { notif_payments: notifPayments }),
        ...(notifPromotions !== undefined && { notif_promotions: notifPromotions }),
        ...(notifSystemUpdates !== undefined && { notif_system_updates: notifSystemUpdates }),
      },
    });

    // Update role-specific profile
    if (user.role === 'merchant' && user.merchant) {
      await prisma.merchant.update({
        where: { id: userId },
        data: {
          ...(businessName && { business_name: businessName }),
          ...(businessType && { business_type: businessType }),
          ...(address && { address: address }),
        },
      });
    }

    if (user.role === 'rider' && user.rider) {
      await prisma.rider.update({
        where: { id: userId },
        data: {
          ...(cnic && { cnic }),
          ...(licenseNumber && { license_number: licenseNumber }),
          ...(vehicleType && { vehicle_type: vehicleType }),
          ...(vehicleNumber && { vehicle_number: vehicleNumber }),
        },
      });
    }


    logger.info(`Profile updated for user ${userId}. Details: Notifications(Email=${updatedUser.email_notifications}, Push=${updatedUser.push_notifications}, SMS=${updatedUser.sms_notifications}), WeeklyReports=${updatedUser.weekly_reports}`);

    res.json({
      success: true,
      data: {
        profile: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.full_name,
          phone: updatedUser.phone,
          profileImageUrl: updatedUser.profile_image_url,
          emailNotifications: updatedUser.email_notifications,
          pushNotifications: updatedUser.push_notifications,
          smsNotifications: updatedUser.sms_notifications,
          weeklyReports: updatedUser.weekly_reports,
          languagePreference: updatedUser.language_preference,
          themePreference: updatedUser.theme_preference,
        },
      },
      message: 'Profile updated successfully.',
    });
  } catch (error: any) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating profile.',
      },
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.',
        },
      });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect.',
        },
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password_hash: passwordHash,
      },
    });

    logger.info(`Password changed for user ${userId}`);

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error: any) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while changing password.',
      },
    });
  }
};

// Get addresses
export const getAddresses = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const addresses = await prisma.address.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_default: 'desc' },
        { created_at: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: { addresses },
    });
  } catch (error: any) {
    logger.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching addresses.',
      },
    });
  }
};

// Add address
export const addAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const {
      label,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          user_id: userId,
          is_default: true,
        },
        data: {
          is_default: false,
        },
      });
    }

    const address = await prisma.address.create({
      data: {
        user_id: userId,
        label: label || null,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        state: state || null,
        postal_code: postalCode || null,
        country: country || 'Pakistan',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        is_default: isDefault || false,
      },
    });

    res.status(201).json({
      success: true,
      data: { address },
      message: 'Address added successfully.',
    });
  } catch (error: any) {
    logger.error('Add address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while adding address.',
      },
    });
  }
};

// Update address
export const updateAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const {
      label,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      latitude,
      longitude,
      isDefault,
    } = req.body;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Address not found.',
        },
      });
    }

    if (address.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this address.',
        },
      });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          user_id: userId,
          is_default: true,
          id: { not: id },
        },
        data: {
          is_default: false,
        },
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(addressLine1 && { address_line1: addressLine1 }),
        ...(addressLine2 !== undefined && { address_line2: addressLine2 }),
        ...(city && { city }),
        ...(state !== undefined && { state }),
        ...(postalCode !== undefined && { postal_code: postalCode }),
        ...(country && { country }),
        ...(latitude !== undefined && { latitude: latitude ? parseFloat(latitude) : null }),
        ...(longitude !== undefined && { longitude: longitude ? parseFloat(longitude) : null }),
        ...(isDefault !== undefined && { is_default: isDefault }),
      },
    });

    res.json({
      success: true,
      data: { address: updatedAddress },
      message: 'Address updated successfully.',
    });
  } catch (error: any) {
    logger.error('Update address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating address.',
      },
    });
  }
};

// Delete address
export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Address not found.',
        },
      });
    }

    if (address.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this address.',
        },
      });
    }

    await prisma.address.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error: any) {
    logger.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting address.',
      },
    });
  }
};

// Get active sessions
export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const sessions = await prisma.session.findMany({
      where: { user_id: userId },
      orderBy: { last_active: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      data: { sessions },
    });
  } catch (error: any) {
    logger.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching sessions.',
      },
    });
  }
};

// Toggle 2FA
export const toggleTwoFactor = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { enabled } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        two_factor_enabled: enabled,
      },
    });

    // Log 2FA toggle
    await logActivity({
      userId,
      action: `2FA ${enabled ? 'Enabled' : 'Disabled'}`,
      description: `Two-factor authentication was ${enabled ? 'enabled' : 'disabled'}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully.`,
    });
  } catch (error: any) {
    logger.error('Toggle 2FA error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating 2FA settings.',
      },
    });
  }
};

// Get activity logs
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    const logs = await prisma.activityLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    res.json({
      success: true,
      data: { logs },
    });
  } catch (error: any) {
    logger.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching activity logs.',
      },
    });
  }
};

// Export user data
export const exportData = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Fetch comprehensive user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        merchant: true,
        rider: true,
        addresses: true,
        wallet_transactions: { take: 100, orderBy: { created_at: 'desc' } }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' }
      });
    }

    // Scrub sensitive data
    const { password_hash, two_factor_secret, ...safeUserData } = user as any;

    await logActivity({
      userId,
      action: 'Data Export',
      description: 'User requested data export',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: safeUserData,
      message: 'Data export generated successfully.'
    });

  } catch (error: any) {
    logger.error('Export data error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while exporting data.',
      },
    });
  }
};

// Delete account
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    // Soft delete - deactivate account
    await prisma.user.update({
      where: { id: userId },
      data: {
        is_active: false
      }
    });

    await logActivity({
      userId,
      action: 'Account Deletion',
      description: 'User requested account deletion (Deactivated)',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Account deleted successfully.'
    });

  } catch (error: any) {
    logger.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting account.',
      },
    });
  }
};

