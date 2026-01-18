import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { settingsService } from './settings.service';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    logger.error('Email transporter verification failed:', error);
  } else {
    logger.info('Email transporter is ready to send messages');
  }
});

/**
 * Generate HTML email template for OTP
 */
/**
 * Generate HTML email template for OTP
 */
const generateOTPEmailTemplate = (
  otpCode: string, 
  userName?: string, 
  title: string = 'Password Reset Request',
  introText: string = 'You have requested to reset your password.'
): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px 0; text-align: center; background-color: #ff6b35;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">COD Express</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 20px; background-color: #ffffff;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto;">
          <tr>
            <td>
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 20px;">${title}</h2>
              ${userName ? `<p style="color: #666666; font-size: 16px; margin: 0 0 20px 0;">Hello ${userName},</p>` : '<p style="color: #666666; font-size: 16px; margin: 0 0 20px 0;">Hello,</p>'}
              <p style="color: #666666; font-size: 16px; margin: 0 0 20px 0;">
                ${introText} Please use the following verification code to complete the process:
              </p>
              
              <div style="background-color: #f8f9fa; border: 2px dashed #ff6b35; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="color: #333333; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Your Verification Code</p>
                <p style="color: #ff6b35; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otpCode}</p>
              </div>
              
              <p style="color: #666666; font-size: 14px; margin: 20px 0 0 0;">
                <strong>Important:</strong> This code will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
              </p>
              
              <p style="color: #666666; font-size: 14px; margin: 20px 0 0 0;">
                For security reasons, never share this code with anyone.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px; text-align: center; background-color: #f4f4f4;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} COD Express. All rights reserved.
        </p>
        <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
          This is an automated message, please do not reply to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Send OTP email for password reset or 2FA
 */
export const sendOTPEmail = async (
  to: string,
  otpCode: string,
  userName?: string,
  subject: string = 'Password Reset Verification Code - COD Express',
  title: string = 'Password Reset Request',
  introText: string = 'You have requested to reset your password.'
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if email is configured
    if (!config.email.user || !config.email.password) {
      logger.warn('Email service not configured. Skipping email send.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Check System Settings
    const settings = await settingsService.getSettings();
    if (!settings.email_notifications) {
      logger.warn('Email notifications are disabled in System Settings. Skipping email send.');
      return {
        success: false,
        error: 'Email notifications disabled via settings', 
      };
    }

    const mailOptions = {
      from: `"COD Express" <${config.email.from}>`,
      to: to,
      subject: subject,
      html: generateOTPEmailTemplate(otpCode, userName, title, introText),
      // Plain text fallback
      text: `${title}\n\nHello${userName ? ` ${userName}` : ''},\n\n${introText} Please use the following verification code:\n\n${otpCode}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\n© ${new Date().getFullYear()} COD Express. All rights reserved.`,
    };

    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`OTP email sent successfully to ${to}. MessageId: ${info.messageId}`);
    
    return {
      success: true,
    };
  } catch (error: any) {
    logger.error(`Failed to send OTP email to ${to}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
};

/**
 * Send welcome email (for future use)
 */
export const sendWelcomeEmail = async (
  to: string,
  userName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!config.email.user || !config.email.password) {
      logger.warn('Email service not configured. Skipping email send.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Check System Settings
    const settings = await settingsService.getSettings();
    if (!settings.email_notifications) {
      logger.warn('Email notifications are disabled in System Settings. Skipping email send.');
      return { success: false, error: 'Email notifications disabled via settings' };
    }

    const mailOptions = {
      from: `"COD Express" <${config.email.from}>`,
      to: to,
      subject: 'Welcome to COD Express!',
      html: `
        <h2>Welcome to COD Express, ${userName}!</h2>
        <p>Thank you for joining us. We're excited to have you on board.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>COD Express Team</p>
      `,
      text: `Welcome to COD Express, ${userName}!\n\nThank you for joining us. We're excited to have you on board.\n\nIf you have any questions, feel free to reach out to our support team.\n\nBest regards,\nCOD Express Team`,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent successfully to ${to}. MessageId: ${info.messageId}`);
    
    return {
      success: true,
    };
  } catch (error: any) {
    logger.error(`Failed to send welcome email to ${to}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
};

/**
 * Send generic HTML email
 */
export const sendHtmlEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!config.email.user || !config.email.password) {
      logger.warn('Email service not configured. Skipping email send.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Check System Settings
    const settings = await settingsService.getSettings();
    if (!settings.email_notifications) {
      logger.warn('Email notifications are disabled in System Settings. Skipping email send.');
      return { success: false, error: 'Email notifications disabled via settings' };
    }

    const mailOptions = {
      from: `"COD Express" <${config.email.from}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || "Please enable HTML to view this email.",
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    
    return {
      success: true,
    };
  } catch (error: any) {
    logger.error(`Failed to send email to ${to}:`, error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
};



