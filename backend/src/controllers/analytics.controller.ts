import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';

// Get Dashboard Stats
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const [
    activeRiders, 
    activeMerchants, 
    activeHubs,
    shipmentGroups,
    hubPerformanceHistory,
    recentActivitiesHistory,
    upcomingDeliveriesCount
  ] = await Promise.all([
    prisma.rider.count({
      where: { is_online: true }
    }),
    prisma.merchant.count({
      where: { user: { is_active: true } }
    }),
    prisma.hub.count({
      where: { is_active: true }
    }),
    prisma.shipment.groupBy({
      by: ['status'],
      _count: { status: true }
    }),
    prisma.hub.findMany({
      where: { is_active: true },
      take: 5,
      include: {
        riders: {
          include: {
            user: {
              include: {
                shipments_as_rider: {
                  select: { status: true }
                }
              }
            }
          }
        }
      }
    }),
    prisma.shipmentTracking.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        shipment: {
          include: {
            merchant: {
              include: { merchant: true }
            },
            rider: true
          }
        }
      }
    }),
    prisma.shipment.count({
      where: {
        status: { in: ['pending', 'assigned', 'picked_up', 'in_transit'] },
        scheduled_delivery_time: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    })
  ]);

  const statusColors: Record<string, string> = {
    delivered: '#4CAF50',
    pending: '#FF9800',
    cancelled: '#9ca3af',
    in_transit: '#2196F3',
    assigned: '#8B5CF6',
    picked_up: '#03A9F4',
    returned: '#F44336'
  };

  const shipment_status = shipmentGroups.map(group => ({
    name: group.status.charAt(0).toUpperCase() + group.status.slice(1).replace('_', ' '),
    value: group._count.status,
    color: statusColors[group.status] || '#8884d8'
  }));

  const hub_performance = hubPerformanceHistory.map((hub: any) => {
    let delivered = 0;
    let pending = 0;
    hub.riders.forEach((r: any) => {
      r.user?.shipments_as_rider.forEach((s: any) => {
        if (s.status === 'delivered') delivered++;
        else pending++;
      });
    });
    return { name: hub.name, delivered, pending };
  });

  const recent_activities = recentActivitiesHistory.map((track: any) => {
    const shipment = track.shipment;
    const type = track.status.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
    let color = 'orange';
    if (track.status === 'delivered') color = 'green';
    if (track.status === 'picked_up') color = 'blue';

    return {
      type: `${type} - ${shipment?.tracking_number || 'N/A'}`,
      merchant: shipment?.merchant?.merchant?.business_name || shipment?.merchant?.full_name || 'N/A',
      rider: shipment?.rider?.full_name,
      time: formatTimeAgo(track.created_at),
      color
    };
  });

  res.json({
    success: true,
    data: {
      active_riders: activeRiders,
      active_merchants: activeMerchants,
      active_hubs: activeHubs,
      shipment_status,
      hub_performance,
      recent_activities,
      upcoming_count: upcomingDeliveriesCount
    }
  });
});

// Helper for formatting time ago in node
function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

// Get Comprehensive Reports
export const getReports = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  // Default to last 30 days if no date provided
  let start = startDate ? new Date(String(startDate)) : new Date();
  let end = endDate ? new Date(String(endDate)) : new Date();

  if (!startDate) {
      start.setDate(start.getDate() - 30);
  }

  // Ensure end of day for end date
  end.setHours(23, 59, 59, 999);
  
  // Common Where Clause
  const where = {
    created_at: {
      gte: start,
      lte: end
    }
  };

  const [
    totalDeliveries,
    revenueStats,
    codStats,
    statusGroups,
    paymentMethods
  ] = await Promise.all([
     // 1. Total Deliveries (in range)
     prisma.shipment.count({ where }),

     // 2. Revenue (Delivery Fee)
     prisma.shipment.aggregate({
         where,
         _sum: { delivery_fee: true }
     }),

     // 3. COD Collections
     prisma.shipment.aggregate({
         where: { ...where, payment_method: 'cod' }, // Assuming 'cod' string
         _sum: { cod_amount: true }
     }),

      // 4. Status Distribution for Charts & Success Rate
      prisma.shipment.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),

      // 5. Payment Method Distribution
      prisma.shipment.groupBy({
          by: ['payment_method'],
          where,
          _count: { payment_method: true }
      })
  ]);

  // Calculate Success Rate
  // statusGroups: [{ status: 'delivered', _count: { status: 10 } }]
  const deliveredGroup = statusGroups.find(g => g.status === 'delivered');
  const deliveredCount = deliveredGroup?._count?.status || 0;
  
  const successRate = totalDeliveries > 0 ? (deliveredCount / totalDeliveries) * 100 : 0;

  // Trend Data (Raw Query for Date Grouping - PostgreSQL)
  const dailyTrends = await prisma.$queryRaw<any[]>`
    SELECT 
      DATE_TRUNC('day', created_at) as date,
      COUNT(id) as count,
      SUM(delivery_fee) as revenue,
      SUM(CASE WHEN payment_method = 'cod' THEN cod_amount ELSE 0 END) as cod
    FROM shipments
    WHERE created_at >= ${start} AND created_at <= ${end}
    GROUP BY DATE_TRUNC('day', created_at)
    ORDER BY date ASC
  `;

  // Format Trends
  const trends = dailyTrends.map((t: any) => ({
      date: t.date,
      deliveries: Number(t.count), // count is BigInt in newer Prisma/PG, convert safely
      revenue: Number(t.revenue || 0),
      cod: Number(t.cod || 0)
  }));

  // Format Distributions
   const statusColors: Record<string, string> = {
    delivered: '#22c55e', // green-500
    in_transit: '#3b82f6', // blue-500
    pending: '#f59e0b', // amber-500
    failed: '#ef4444', // red-500
    cancelled: '#64748b', // slate-500
    picked_up: '#0ea5e9', // sky-500
    scheduled: '#8b5cf6', // violet-500
  };
  
  const formattedStatusChart = statusGroups.map((g: any) => ({
      name: g.status.replace(/_/g, ' ').replace(/\b\w/g, (l:string) => l.toUpperCase()),
      value: g._count.status,
      color: statusColors[g.status] || '#94a3b8'
  }));


  const formattedPaymentDist = paymentMethods.map(g => ({
      name: (g.payment_method || 'Unknown').toUpperCase(),
      value: g._count.payment_method,
      color: g.payment_method === 'cod' ? '#f59e0b' : '#3b82f6'
  }));

  // 6. Hub Performance (Deliveries per hub)
  const hubPerformance = await prisma.hub.findMany({
    select: {
      id: true,
      name: true,
      riders: {
        select: {
          user: {
            select: {
              shipments_as_rider: {
                where,
                select: { status: true }
              }
            }
          }
        }
      }
    }
  });

  const formattedHubReports = hubPerformance.map(hub => {
    let delivered = 0;
    let failed = 0;
    hub.riders.forEach(r => {
      r.user?.shipments_as_rider.forEach(s => {
        if (s.status === 'delivered') delivered++;
        if (s.status === 'failed') failed++;
      });
    });
    return { name: hub.name, delivered, failed };
  });

  // 7. Rider Performance
  const topRiders = await prisma.rider.findMany({
    take: 5,
    orderBy: { total_deliveries: 'desc' },
    select: {
      user: { select: { full_name: true } },
      total_deliveries: true,
      rating: true
    }
  });

  // 8. Merchant Performance (Volume by most shipments in period)
  const merchantVolume = await prisma.shipment.groupBy({
    by: ['merchant_id'],
    where,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });

  const formattedMerchantReports = await Promise.all(merchantVolume.map(async (m) => {
    const merchant = await prisma.merchant.findUnique({
      where: { id: m.merchant_id },
      select: { business_name: true, total_spent: true }
    });
    return {
      name: merchant?.business_name || 'Unknown',
      revenue: Number(merchant?.total_spent || 0),
      shipments: m._count.id
    };
  }));

  res.json({
    success: true,
    data: {
      kpi: {
          total_deliveries: totalDeliveries,
          total_revenue: Number(revenueStats._sum.delivery_fee || 0),
          total_cod: Number(codStats._sum.cod_amount || 0),
          success_rate: Number(successRate.toFixed(1))
      },
      trends, 
      distribution: {
          status: formattedStatusChart,
          payment: formattedPaymentDist
      },
      riders: topRiders.map(r => ({ name: r.user.full_name, deliveries: r.total_deliveries, rating: Number(r.rating) })),
      hubs: formattedHubReports,
      merchants: formattedMerchantReports
    }
  });
});

// GET /api/v1/admin/analytics/order-trend?month=9&year=2024
export const getOrderTrend = asyncHandler(async (req: AuthRequest, res: Response) => {
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  // Calculate start and end of month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Get daily counts for the month
  const dailyData = await prisma.$queryRaw<any[]>`
    SELECT 
      EXTRACT(DAY FROM created_at) as day,
      COUNT(id) as count
    FROM shipments
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY EXTRACT(DAY FROM created_at)
    ORDER BY day ASC
  `;

  // Format with all days of the month to ensure a continuous line
  const lastDay = endDate.getDate();
  const trend = [];
  
  // To match the specific percentage/volume chart logic in the screenshot:
  // We'll calculate cumulative percentage if that's what's intended, 
  // but for "Order Details" standard trend is better.
  // We will provide both: count and cumulative percentage for flexibility.
  let cumulativeCount = 0;
  const totalInMonth = await prisma.shipment.count({
    where: { created_at: { gte: startDate, lte: endDate } }
  });

  for (let i = 1; i <= lastDay; i++) {
    const dayData = dailyData.find(d => parseInt(d.day) === i);
    const count = parseInt(dayData?.count || 0);
    cumulativeCount += count;
    
    trend.push({
      day: i,
      count: count,
      // value label matching screenshot (5k increments)
      valueLabel: `${i * 2}k`, 
      percentage: totalInMonth > 0 ? (cumulativeCount / totalInMonth) * 100 : 0
    });
  }

  res.json({
    success: true,
    data: trend
  });
});

// GET /api/v1/admin/analytics/calendar?month=9&year=2024
export const getCalendarData = asyncHandler(async (req: AuthRequest, res: Response) => {
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Find days with shipments or events
  const busyDays = await prisma.$queryRaw<any[]>`
    SELECT 
      EXTRACT(DAY FROM created_at) as day,
      COUNT(id) as shipments
    FROM shipments
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY EXTRACT(DAY FROM created_at)
  `;

  res.json({
    success: true,
    data: {
      month,
      year,
      busyDays: busyDays.map(d => ({
        day: parseInt(d.day),
        count: parseInt(d.shipments)
      }))
    }
  });
});
