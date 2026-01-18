import nodeCron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendHtmlEmail } from '../services/email.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Run every Monday at 00:00
export const initWeeklyReports = () => {
  nodeCron.schedule('0 0 * * 1', async () => {
    logger.info('Starting weekly report generation...');
    
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Format dates for display
    const dateRangeStr = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    
    try {
      // Find all users who have enabled weekly reports
      const users = await prisma.user.findMany({
        where: {
          weekly_reports: true,
          is_active: true,
          role: { in: ['merchant', 'rider'] }
        },
        include: {
          merchant: true,
          rider: true
        }
      });

      logger.info(`Found ${users.length} users for weekly reports.`);

      for (const user of users) {
        try {
          let reportContent = '';
          
          if (user.role === 'merchant') {
             // Merchant Stats
             // 1. Total orders placed in the last week
             const totalStats = await prisma.shipment.aggregate({
                where: {
                    merchant_id: user.id,
                    created_at: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                _count: {
                    id: true,
                },
             });

             // 2. Delivered orders and revenue (COD) in the last week
             const deliveredStats = await prisma.shipment.aggregate({
                where: {
                    merchant_id: user.id,
                    status: 'delivered', 
                    updated_at: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                _count: {
                    id: true
                },
                _sum: {
                    cod_amount: true
                }
             });

             const totalOrders = totalStats._count.id;
             const deliveredOrders = deliveredStats._count.id;
             // Handle Decimal to Number conversion safely usually requires toNumber() or Number()
             // Prisma decimals are returned as Decimal objects or strings depending on config.
             // Assuming default behavior which often requires handling.
             const revenue = Number(deliveredStats._sum.cod_amount || 0);

             reportContent = `
               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                 <h2 style="color: #ff6b35; text-align: center; margin-bottom: 5px;">Weekly Performance Report</h2>
                 <p style="text-align: center; color: #666; font-size: 14px; margin-top: 0;">${dateRangeStr}</p>
                 <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                 <p>Hello <strong>${user.full_name || 'Partner'}</strong>,</p>
                 <p>Here is your business summary for the last 7 days:</p>
                 
                 <div style="display: flex; justify-content: space-around; margin: 30px 0; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #333;">${totalOrders}</div>
                        <div style="font-size: 12px; color: #888; margin-top: 5px;">New Orders</div>
                    </div>
                    <div style="text-align: center; border-left: 1px solid #eee; padding-left: 20px;">
                        <div style="font-size: 24px; font-weight: bold; color: #28a745;">${deliveredOrders}</div>
                        <div style="font-size: 12px; color: #888; margin-top: 5px;">Delivered</div>
                    </div>
                    <div style="text-align: center; border-left: 1px solid #eee; padding-left: 20px;">
                        <div style="font-size: 24px; font-weight: bold; color: #ff6b35;">$${revenue.toFixed(2)}</div>
                        <div style="font-size: 12px; color: #888; margin-top: 5px;">Est. Revenue (COD)</div>
                    </div>
                 </div>
                 
                 <p style="text-align: center; color: #666; font-size: 12px; margin-top: 30px;">
                    This is an automated report from COD Express.
                 </p>
               </div>
             `;

          } else if (user.role === 'rider') {
             // Rider Stats
             const deliveredStats = await prisma.shipment.aggregate({
                where: {
                    rider_id: user.id,
                    status: 'delivered',
                    updated_at: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                _count: {
                    id: true
                },
                _sum: {
                    delivery_fee: true,
                    distance_km: true
                }
             });

             const totalDeliveries = deliveredStats._count.id;
             const earnings = Number(deliveredStats._sum.delivery_fee || 0);
             const distance = Number(deliveredStats._sum.distance_km || 0);

             reportContent = `
               <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;">
                 <h2 style="color: #ff6b35; text-align: center; margin-bottom: 5px;">Weekly Rider Report</h2>
                 <p style="text-align: center; color: #666; font-size: 14px; margin-top: 0;">${dateRangeStr}</p>
                 <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                 <p>Hello <strong>${user.full_name || 'Rider'}</strong>,</p>
                 <p>Here is your delivery summary for the last 7 days:</p>

                 <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <ul style="list-style: none; padding: 0; margin: 0;">
                        <li style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
                            <span style="color: #555;">Total Deliveries</span>
                            <strong style="color: #333;">${totalDeliveries}</strong>
                        </li>
                        <li style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee;">
                            <span style="color: #555;">Distance Covered</span>
                            <strong style="color: #333;">${distance.toFixed(1)} km</strong>
                        </li>
                        <li style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 5px;">
                            <span style="color: #555; font-weight: bold;">Total Earnings</span>
                            <strong style="color: #28a745; font-size: 18px;">$${earnings.toFixed(2)}</strong>
                        </li>
                    </ul>
                 </div>
                 
                 <p style="text-align: center; font-size: 14px; color: #666;">Ride safe & keep earning!</p>
               </div>
             `;
          }

          if (reportContent) {
            logger.info(`Sending weekly report to ${user.email} (Role: ${user.role})`);
            await sendHtmlEmail(user.email, 'Your Weekly Report - COD Express', reportContent);
          }
        } catch (err) {
          logger.error(`Failed to send report to ${user.email}`, err);
        }
      }
    } catch (error) {
      logger.error('Error in weekly report job:', error);
    }
  });

  logger.info('Weekly report job scheduled (Every Monday at 00:00).');
};
