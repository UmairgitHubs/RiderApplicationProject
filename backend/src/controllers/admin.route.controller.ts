import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/async.middleware';
import { routeService } from '../services/route.service';
import prisma from '../config/database';

/**
 * Get all routes with stats and filtering
 */
export const getAllRoutes = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hubId, status, riderId } = req.query;

  const routes = await routeService.getAllRoutes({
    hubId: hubId as string,
    status: status as string,
    riderId: riderId as string
  });

  const data = routes.map(route => {
      const stops = (route as any).stops || [];
      const pickupCount = stops.filter((s: any) => s.type === 'pickup').length;
      const deliveryCount = stops.filter((s: any) => s.type === 'delivery').length;
      const completedCount = stops.filter((s: any) => s.status === 'completed').length;
      
      // Progress calculation
      const progress = stops.length > 0 
        ? Math.min(100, Math.round((completedCount / stops.length) * 100)) 
        : 0;
      
      // Total COD calculation - ensuring we sum all shipment cod amounts in this route
      const totalCod = stops.reduce((sum: number, stop: any) => {
          const amount = stop.shipment?.cod_amount ? Number(stop.shipment.cod_amount) : 0;
          return sum + amount;
      }, 0);

      const formattedStatus = route.status === 'active' ? 'Active' : 
                              route.status === 'completed' ? 'Completed' : 
                              route.status === 'draft' ? 'Pending' : 
                              route.status.charAt(0).toUpperCase() + route.status.slice(1);

      return {
          id: route.id,
          name: route.name,
          status: formattedStatus,
          rider: route.rider ? {
              id: route.rider.id,
              name: (route.rider as any).user?.full_name || 'Unknown Rider'
          } : { id: '', name: 'Unassigned' },
          vehicleId: route.vehicle_id || '---',
          progress,
          pickupCount,
          deliveryCount,
          distance: route.distance_km ? `${Number(route.distance_km).toFixed(1)} km` : '0 km',
          estTime: route.duration_min ? `${route.duration_min} mins` : '0 mins',
          startPoint: route.hub ? route.hub.name : 'Unknown Hub',
          totalCod,
          createdAt: route.created_at
      };
  });

  res.json({ success: true, data });
});

/**
 * Get Route Stats
 */
export const getRouteStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await routeService.getRouteStats();
    res.json({ success: true, data: stats });
});

/**
 * Create a new Route
 */
export const createRoute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const route = await routeService.createRoute(req.body);
    res.status(201).json({ success: true, data: route });
});

/**
 * Get a single route
 */
export const getRouteById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const route = await prisma.route.findUnique({
        where: { id },
        include: {
            rider: { include: { user: true } },
            hub: true,
            stops: { include: { shipment: true }, orderBy: { stop_order: 'asc' } }
        }
    });

    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });
    res.json({ success: true, data: route });
});

/**
 * Update a route
 */
export const updateRoute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const route = await routeService.updateRoute(id, req.body);
    res.json({ success: true, data: route });
});

/**
 * Delete a route
 */
export const deleteRoute = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await prisma.route.delete({ where: { id } });
    res.json({ success: true, message: 'Route deleted' });
});

/**
 * Get Unassigned Shipments
 */
export const getUnassignedShipments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { hubId } = req.query;
    const shipments = await routeService.getUnassignedShipments(hubId as string);
    res.json({ success: true, data: shipments });
});

/**
 * Get Available Riders
 */
export const getAvailableRiders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { hubId } = req.query;
    const riders = await routeService.getAvailableRiders(hubId as string);
    
    const formatted = riders.map(r => ({
        id: r.id,
        name: (r as any).user.full_name,
        phone: (r as any).user.phone,
        vehicleType: r.vehicle_type,
        rating: r.rating,
        hubId: r.hub_id
    }));

    res.json({ success: true, data: formatted });
});

export const autoOptimize = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await routeService.autoOptimize();
    res.json(result);
});
