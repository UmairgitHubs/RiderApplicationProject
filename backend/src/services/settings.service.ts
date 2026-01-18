
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SettingsService {
  /**
   * Get system settings. Creates default settings if none exist.
   */
  async getSettings() {
    // @ts-ignore: Prisma Client types pending editor sync
    let settings = await prisma.systemSetting.findFirst();

    if (!settings) {
      // @ts-ignore
      settings = await prisma.systemSetting.create({
        data: {
          company_name: 'Cod Express',
          company_email: 'support@codexpress.com',
          company_phone: '+1 800-COD-EXPRESS',
          company_address: '123 Logistics Street, New York, NY 1',
          timezone: 'Eastern Standard Time (EST)',
          currency: 'USD ($)',
          cod_commission: 5.00,
          base_delivery_fee: 5.00,
          min_order_value: 10.00,
          rider_commission: 70.00,
          agent_commission: 5.00,
          maintenance_mode: false,
          auto_assignment: true,
          gps_tracking: true,
          email_notifications: true,
          sms_notifications: true,
          session_timeout: 30,
          two_factor_required_admins: false
        }
      });
    }

    return settings;
  }

  /**
   * Update system settings.
   */
  async updateSettings(data: any) {
    const settings = await this.getSettings();

    // @ts-ignore
    const updatedSettings = await prisma.systemSetting.update({
      where: {
        id: settings.id
      },
      data: {
        ...data,
        updated_at: new Date()
      }
    });

    return updatedSettings;
  }
}

export const settingsService = new SettingsService();
