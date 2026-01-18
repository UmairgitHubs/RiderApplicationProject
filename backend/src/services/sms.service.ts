import twilio from 'twilio';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { settingsService } from './settings.service';

/**
 * Send SMS notification via Twilio
 */
export const sendSMS = async (
    to: string,
    message: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Check System Settings
        const settings = await settingsService.getSettings();
        if (!settings.sms_notifications) {
            logger.warn('SMS notifications are disabled in System Settings. Skipping SMS send.');
            return { success: false, error: 'SMS notifications disabled via settings' };
        }

        // Validate Twilio Config
        if (!config.twilio.accountSid || !config.twilio.authToken || !config.twilio.phoneNumber) {
             logger.warn('Twilio credentials not configured. Skipping SMS send.');
             return { success: false, error: 'Twilio provider not configured' };
        }

        const client = twilio(config.twilio.accountSid, config.twilio.authToken);

        // Normalize Phone Number (E.164 format required by Twilio)
        let normalizedTo = to.trim().replace(/\s+/g, ''); // Remove spaces
        
        if (!normalizedTo.startsWith('+')) {
            if (normalizedTo.startsWith('0')) {
                // Local format (e.g., 0325...) -> +92325...
                normalizedTo = '+92' + normalizedTo.substring(1);
            } else if (normalizedTo.startsWith('92')) {
                // Already has country code but no + (e.g., 92325...) -> +92325...
                normalizedTo = '+' + normalizedTo;
            } else {
                // Fallback: prepend + if not present (assume it might be international without +)
                normalizedTo = '+' + normalizedTo;
            }
        }

        const response = await client.messages.create({
            body: message,
            from: config.twilio.phoneNumber,
            to: normalizedTo
        });

        logger.info(`SMS sent successfully to ${normalizedTo}. SID: ${response.sid}`);

        return {
            success: true,
        };
    } catch (error: any) {
        logger.error(`Failed to send SMS to ${to}:`, error);
        return {
            success: false,
            error: error.message || 'Failed to send SMS',
        };
    }
};
