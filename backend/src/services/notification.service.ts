import firebaseAdmin from 'firebase-admin';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import prisma from '../config/database';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Firebase initialization
let isInitialized = false;

export const initFirebase = () => {
  try {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      logger.warn('Firebase Service Account not provided. Push notifications will be limited.');
      return;
    }

    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount),
    });

    isInitialized = true;
    logger.info('Firebase Admin initialized successfully.');
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin:', error);
  }
};

// Email transporter configuration
// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

// Twilio configuration
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (!twilioClient) {
  logger.warn('Twilio credentials not found. SMS notifications will be disabled.');
}

// Notification types
export enum NotificationType {
  ORDER_UPDATE = 'order_update',
  DELIVERY_ALERT = 'delivery_alert',
  PAYMENT = 'payment',
  PROMOTION = 'promotion',
  SYSTEM_UPDATE = 'system_update',
}

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

/**
 * Main notification service - checks user preferences and sends notifications
 */
export class NotificationService {
  /**
   * Send notification to a user (checks their preferences first)
   */
  static async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          email: true,
          phone: true,
          fcm_token: true,
          push_notifications: true,
          email_notifications: true,
          sms_notifications: true,
          notif_order_updates: true,
          notif_delivery_alerts: true,
          notif_payments: true,
          notif_promotions: true,
          notif_system_updates: true,
        },
      });

      if (!user) {
        logger.error(`User ${payload.userId} not found`);
        return;
      }

      // Check if user wants this type of notification
      const shouldSend = this.checkUserPreference(user, payload.type);
      if (!shouldSend) {
        logger.info(`User ${payload.userId} has disabled ${payload.type} notifications`);
        return;
      }

      // Send push notification if enabled
      if (user.push_notifications && user.fcm_token) {
        console.log(`📲 Sending Push to ${payload.userId}`);
        await this.sendPushNotification(user.fcm_token, payload);
      } else {
        console.log(`ℹ️ Skipping Push for ${payload.userId}: Enabled=${user.push_notifications}, Token=${!!user.fcm_token}`);
      }

      // Send email notification if enabled
      if (user.email_notifications && user.email) {
        console.log(`📧 Sending Email to ${payload.userId} (${user.email})`);
        await this.sendEmailNotification(user.email, payload);
      } else {
        console.log(`ℹ️ Skipping Email for ${payload.userId}: Enabled=${user.email_notifications}, Email=${!!user.email}`);
      }

      // Send SMS notification if enabled
      if (user.sms_notifications && user.phone) {
        await this.sendSmsNotification(user.phone, payload);
      }

      // Store notification in database
      await this.storeNotification(payload);
      
      logger.info(`Notification stored for user ${payload.userId}`);

    } catch (error) {
      logger.error('Error sending notification:', error);
    }
  }

  /**
   * Check if user wants this type of notification
   */
  private static checkUserPreference(user: any, type: NotificationType): boolean {
    // Check global channel preferences first ??? 
    // Actually, channel prefs (email/sms) are checked at sending time.
    // This method checks the "Topic" preference (Order vs Promotion).

    let pref = true;
    switch (type) {
      case NotificationType.ORDER_UPDATE:
        pref = user.notif_order_updates ?? true;
        break;
      case NotificationType.DELIVERY_ALERT:
        pref = user.notif_delivery_alerts ?? true;
        break;
      case NotificationType.PAYMENT:
        pref = user.notif_payments ?? true;
        break;
      case NotificationType.PROMOTION:
        pref = user.notif_promotions ?? false;
        break;
      case NotificationType.SYSTEM_UPDATE:
        pref = user.notif_system_updates ?? false;
        break;
    }

    if (!pref) {
      logger.info(`User disabled topic: ${type}`);
    }
    return pref;
  }

  /**
   * Send push notification via Firebase Cloud Messaging
   */
  private static async sendPushNotification(
    fcmToken: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      if (!isInitialized) {
        // Only log at debug level to avoid spamming if not configured
        logger.debug('Firebase not initialized - skipping push');
        return;
      }

      const message: firebaseAdmin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          type: payload.type,
          ...(payload.data || {}),
        },
        android: {
          priority: 'high',
          notification: { sound: 'default', channelId: 'default' },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      };

      await firebaseAdmin.messaging().send(message);
      logger.info(`Push sent to ${fcmToken.substring(0, 10)}...`);
    } catch (error) {
      logger.error('Push notification error:', error);
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    email: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      if (!config.email.user || !config.email.password) {
        logger.warn(`📧 Email credentials missing. Configured User: ${!!config.email.user}, Configured Pass: ${!!config.email.password}. Skipping email to ${email}.`);
        return;
      }

      const mailOptions = {
        from: `"${config.email.from}" <${config.email.user}>`, 
        to: email,
        subject: payload.title,
        html: this.getEmailTemplate(payload),
      };

      console.log(`📧 Attempting to send email to ${email} via ${config.email.host}:${config.email.port}`);
      const info = await emailTransporter.sendMail(mailOptions);
      logger.info(`✅ Email sent to ${email}. ID: ${info.messageId}`);
    } catch (error: any) {
      logger.error('❌ Email send failed:', error.message);
      if (error.code === 'EAUTH') {
        logger.error('Authentication invalid. Check EMAIL_USER and EMAIL_PASSWORD (use App Password for Gmail).');
      }
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSmsNotification(
    phone: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      if (!twilioClient) {
        logger.warn('Twilio client not initialized (missing SID/Token). Skipping SMS.');
        return;
      }

      if (!process.env.TWILIO_PHONE_NUMBER) {
        logger.warn('TWILIO_PHONE_NUMBER missing. Skipping SMS.');
        return;
      }

      const body = `${payload.title}: ${payload.body}`;
      
      const msg = await twilioClient.messages.create({
        body: body.substring(0, 160),
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      logger.info(`SMS sent to ${phone}. SID: ${msg.sid}`);
    } catch (error: any) {
      logger.error('SMS send failed:', error.message);
    }
  }

  /**
   * Store notification in database for in-app display
   */
  private static async storeNotification(payload: NotificationPayload): Promise<void> {
    try {
      await prisma.notification.create({
        data: {
          user_id: payload.userId,
          title: payload.title,
          message: payload.body,
          type: payload.type,
          reference_id: payload.data?.trackingNumber || payload.data?.shipmentId || null,
          reference_type: 'shipment',
          is_read: false,
        },
      });
    } catch (error) {
      logger.error('Error storing notification:', error);
    }
  }

  /**
   * Get email template based on notification type
   */
  private static getEmailTemplate(payload: NotificationPayload): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #FF6B00; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #FF6B00; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${payload.title}</h1>
            </div>
            <div class="content">
              <p>${payload.body}</p>
              ${payload.data?.trackingNumber ? `<p><strong>Tracking Number:</strong> ${payload.data.trackingNumber}</p>` : ''}
              ${payload.data?.amount ? `<p><strong>Amount:</strong> $${payload.data.amount}</p>` : ''}
              <a href="${process.env.APP_URL || 'https://zimli.com'}" class="button">Open App</a>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Zimli. All rights reserved.</p>
              <p>You received this email because you have notifications enabled in your account settings.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send bulk notifications (for promotions, system updates)
   */
  static async sendBulkNotification(
    userIds: string[],
    payload: Omit<NotificationPayload, 'userId'>
  ): Promise<void> {
    const promises = userIds.map((userId) =>
      this.sendNotification({ ...payload, userId })
    );
    await Promise.allSettled(promises);
  }
}

// Helper functions for common notification scenarios

export const sendOrderUpdateNotification = async (
  userId: string,
  trackingNumber: string,
  status: string
) => {
  await NotificationService.sendNotification({
    userId,
    type: NotificationType.ORDER_UPDATE,
    title: 'Order Update',
    body: `Your order #${trackingNumber} is now ${status}`,
    data: { trackingNumber, status },
  });
};

export const sendDeliveryAlertNotification = async (
  userId: string,
  trackingNumber: string,
  message: string
) => {
  await NotificationService.sendNotification({
    userId,
    type: NotificationType.DELIVERY_ALERT,
    title: 'Delivery Alert',
    body: message,
    data: { trackingNumber },
  });
};

export const sendPaymentNotification = async (
  userId: string,
  amount: number,
  description: string
) => {
  await NotificationService.sendNotification({
    userId,
    type: NotificationType.PAYMENT,
    title: 'Payment Received',
    body: description,
    data: { amount },
  });
};

export const sendPromotionNotification = async (
  userId: string,
  title: string,
  message: string
) => {
  await NotificationService.sendNotification({
    userId,
    type: NotificationType.PROMOTION,
    title,
    body: message,
  });
};

export const sendSystemUpdateNotification = async (
  userId: string,
  title: string,
  message: string
) => {
  await NotificationService.sendNotification({
    userId,
    type: NotificationType.SYSTEM_UPDATE,
    title,
    body: message,
  });
};

// Legacy function for backward compatibility
export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: any
): Promise<boolean> => {
  if (!isInitialized) {
    logger.warn('Firebase not initialized. Cannot send push notification.');
    return false;
  }

  try {
    await firebaseAdmin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: data || {},
    });
    logger.info(`Push notification sent to ${fcmToken}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send push notification to ${fcmToken}:`, error);
    return false;
  }
};
