
import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { config } from '../config/env';

export class RouteService {
  /**
   * Get all routes with stats
   */
  async getAllRoutes(filters: { hubId?: string, status?: string, riderId?: string }) {
    const { hubId, status, riderId } = filters;

    const where: Prisma.RouteWhereInput = {};
    if (hubId) where.hub_id = hubId;
    if (status) where.status = status;
    if (riderId) where.rider_id = riderId;

    return prisma.route.findMany({
      where,
      include: {
        rider: {
          include: { user: { select: { full_name: true, id: true } } }
        },
        hub: {
          select: { id: true, name: true, city: true }
        },
        stops: {
          orderBy: { stop_order: 'asc' },
          include: {
            shipment: { select: { cod_amount: true, status: true } }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  /**
   * Create a new route
   */
  async createRoute(data: { name: string, hubId: string, riderId?: string | null, vehicleId?: string, stops: any[], status?: string }) {
    return prisma.$transaction(async (tx) => {
      const routeStatus = data.status || 'draft';

      // 1. Create the route
      const route = await tx.route.create({
        data: {
          name: data.name,
          hub_id: data.hubId,
          rider_id: data.riderId || null,
          vehicle_id: data.vehicleId,
          status: routeStatus,
          stops: {
            create: data.stops.map((stop, index) => ({
              stop_order: index + 1,
              type: stop.type || 'delivery',
              shipment_id: stop.shipmentId,
              location: stop.location,
              latitude: stop.latitude,
              longitude: stop.longitude,
            }))
          }
        },
        include: { stops: true }
      });

      // 2. If rider is assigned, update shipments
      if (data.riderId && data.stops.length > 0) {
        const shipmentIds = data.stops
          .filter(s => s.shipmentId)
          .map(s => s.shipmentId);
          
        if (shipmentIds.length > 0) {
           const updateData: any = { rider_id: data.riderId };
           
           // If route is active, set shipments to assigned
           if (routeStatus === 'active') {
               updateData.status = 'assigned';
           }

           await tx.shipment.updateMany({
             where: { id: { in: shipmentIds } },
             data: updateData
           });
        }
      }
      
      return route;
    });
  }

  /**
   * Update an existing route
   */
  async updateRoute(id: string, data: { name: string, hubId: string, riderId?: string | null, vehicleId?: string, status?: string, stops: any[] }) {
    return prisma.$transaction(async (tx) => {
      // 1. Update basic route info
      const route = await tx.route.update({
        where: { id },
        data: {
          name: data.name,
          hub_id: data.hubId,
          rider_id: data.riderId || null,
          vehicle_id: data.vehicleId,
          status: data.status,
        }
      });

      // 2. Clear existing stops
      await tx.routeStop.deleteMany({
        where: { route_id: id }
      });

      // 3. Create new stops
      if (data.stops && data.stops.length > 0) {
        await tx.routeStop.createMany({
          data: data.stops.map((stop, index) => ({
            route_id: id,
            stop_order: index + 1,
            type: stop.type || 'delivery',
            shipment_id: stop.shipmentId,
            location: stop.location,
            latitude: stop.latitude,
            longitude: stop.longitude,
          }))
        });

        // 4. Update Shipments if rider assigned
        if (data.riderId) {
            const shipmentIds = data.stops
                .filter(s => s.shipmentId)
                .map(s => s.shipmentId);

            if (shipmentIds.length > 0) {
                // Always sync rider_id
                await tx.shipment.updateMany({
                    where: { id: { in: shipmentIds } },
                    data: { rider_id: data.riderId }
                });

                // If active, set pending shipments to assigned
                if (data.status === 'active') {
                    await tx.shipment.updateMany({
                        where: { 
                            id: { in: shipmentIds },
                            status: { in: ['pending', 'received_at_hub'] }
                        },
                        data: { status: 'assigned' }
                    });
                }
            }
        }
      }

      return tx.route.findUnique({
        where: { id },
        include: { stops: true }
      });
    });
  }

  /**
   * Update Route Status and sync shipments
   */
  async updateStatus(id: string, status: string) {
    return prisma.$transaction(async (tx) => {
      const route = await tx.route.update({
        where: { id },
        data: { status },
        include: { stops: true }
      });

      if (status === 'active' && route.rider_id) {
          const shipmentIds = route.stops
              .filter(s => s.shipment_id)
              .map(s => s.shipment_id as string);

          if (shipmentIds.length > 0) {
              await tx.shipment.updateMany({
                  where: { 
                      id: { in: shipmentIds },
                      status: { in: ['pending', 'received_at_hub'] }
                  },
                  data: { 
                      status: 'assigned',
                      rider_id: route.rider_id
                  }
              });
          }
      }

      return route;
    });
  }

  /**
   * Get Route Statistics
   */
  async getRouteStats() {
    const [activeRoutes, pendingRoutes, totalStops, pickupOrders, deliveryOrders] = await Promise.all([
      prisma.route.count({ where: { status: 'active' } }),
      prisma.route.count({ where: { status: { in: ['pending', 'draft'] } } }),
      prisma.routeStop.count(),
      prisma.routeStop.count({ where: { type: 'pickup' } }),
      prisma.routeStop.count({ where: { type: 'delivery' } })
    ]);

    // Calculate total COD value across all active/pending routes
    const stopsWithCod = await prisma.routeStop.findMany({
      where: {
        route: { status: { in: ['active', 'pending', 'draft'] } }
      },
      include: {
        shipment: { select: { cod_amount: true } }
      }
    });

    const totalCodValue = stopsWithCod.reduce((sum, stop) => {
      const amount = stop.shipment?.cod_amount ? Number(stop.shipment.cod_amount) : 0;
      return sum + amount;
    }, 0);

    // Count riders currently assigned to active routes
    const activeRiders = await prisma.route.groupBy({
      by: ['rider_id'],
      where: { 
        status: 'active', 
        rider_id: { not: null } 
      }
    });

    const activeRidersCount = activeRiders.length;

    return {
      activeRoutes,
      pendingRoutes,
      totalStops,
      pickupOrders,
      deliveryOrders,
      totalCodValue,
      activeRidersCount
    };
  }

  /**
   * Get Unassigned Shipments
   */
  async getUnassignedShipments(hubId?: string) {
    const where: Prisma.ShipmentWhereInput = {
      status: { in: ['pending', 'assigned', 'picked_up', 'in_transit', 'received_at_hub', 'scheduled'] }
    };

    if (hubId && hubId !== 'all') {
        where.hub_id = hubId;
    }

    const shipments = await prisma.shipment.findMany({
      where,
      include: {
        merchant: { 
          include: { 
            merchant: { select: { business_name: true } } 
          } 
        },
        route_stops: {
          where: {
            route: {
              status: { in: ['draft', 'active'] }
            }
          },
          include: {
            route: {
                select: { status: true, rider_id: true }
            }
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // In-memory filter to handle complex "Stale Route" logic
    return shipments.filter(s => {
        // If no active/draft routes involve this shipment, it's free.
        if (s.route_stops.length === 0) return true;

        // Check if any existing route stop is "blocking" (valid and pending)
        const hasBlockingStop = s.route_stops.some(stop => {
            // Completed stops never block
            if (stop.status === 'completed') return false;

            // Draft routes always block (planning in progress)
            if (stop.route.status === 'draft') return true;

            // Active routes block only if the rider matches (actively assigned)
            // If rider mismatches (e.g. s.rider_id is null/different), it's a stale/past connection
            if (stop.route.status === 'active') {
                return stop.route.rider_id === s.rider_id;
            }

            return false;
        });

        // If no blocking stops found, we can show it as unassigned
        return !hasBlockingStop;
    });
  }

  /**
   * Get Available Riders
   */
  async getAvailableRiders(hubId?: string) {
    const where: Prisma.RiderWhereInput = {
      is_online: true
    };

    if (hubId) where.hub_id = hubId;

    const riders = await prisma.rider.findMany({
      where,
      include: {
        user: { select: { full_name: true, phone: true } },
        routes: {
          where: { status: 'active' }
        }
      }
    });

    return riders;
  }

  /**
   * Auto-Optimize All: Global optimization engine
   */
  async autoOptimize() {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch Resources
      const [hubs, unassignedShipments, availableRiders] = await Promise.all([
        tx.hub.findMany({ where: { is_active: true } }),
        tx.shipment.findMany({
           where: { 
             status: { in: ['pending', 'received_at_hub'] },
             route_stops: { none: { route: { status: { in: ['draft', 'active'] } } } }
           }
        }),
        tx.rider.findMany({
          where: { is_online: true },
          include: { routes: { where: { status: 'active' } } }
        })
      ]);

      const riders = availableRiders.filter(r => r.routes.length === 0);
      
      if (unassignedShipments.length === 0) return { created: 0, message: 'No pending shipments found' };
      if (riders.length === 0) return { created: 0, message: 'No available riders found' };

      // 2. Cluster Shipments by Nearest Hub
      const hubPools: Record<string, typeof unassignedShipments> = {};
      hubs.forEach(h => hubPools[h.id] = []);

      unassignedShipments.forEach(s => {
        let nearestHub = hubs[0];
        let minDistance = Infinity;

        if (s.pickup_latitude && s.pickup_longitude) {
           hubs.forEach(h => {
             if (h.latitude && h.longitude) {
                const d = this.calculateDist(
                  Number(s.pickup_latitude), Number(s.pickup_longitude),
                  Number(h.latitude), Number(h.longitude)
                );
                if (d < minDistance) {
                  minDistance = d;
                  nearestHub = h;
                }
             }
           });
        }
        hubPools[nearestHub.id].push(s);
      });

      // 3. Process Each Hub
      let routesCreated = 0;
      for (const hub of hubs) {
        const hubShipments = hubPools[hub.id];
        const hubRiders = riders.filter(r => r.hub_id === hub.id);

        if (hubShipments.length === 0 || hubRiders.length === 0) continue;

        // Take up to 8 shipments per route
        const MAX_PER_ROUTE = 8;
        let shipmentIndex = 0;
        let riderIndex = 0;

        while (shipmentIndex < hubShipments.length && riderIndex < hubRiders.length) {
           const batch = hubShipments.slice(shipmentIndex, shipmentIndex + MAX_PER_ROUTE);
           const rider = hubRiders[riderIndex];

           // Prepare Waypoints for Google Maps
           // Origin: Hub (or first pickup) - keeping simpler: Hub -> Pickups -> Deliveries -> Hub? 
           // For now: First Pickup -> ... -> Last Delivery
           let distanceKm = 0;
           let durationMin = 0;

           if (config.googleMaps.apiKey && batch.length > 0) {
              const origin = `${batch[0].pickup_latitude},${batch[0].pickup_longitude}`;
              const dest = `${batch[batch.length - 1].delivery_latitude},${batch[batch.length - 1].delivery_longitude}`;
              
              // Waypoints: rest of pickups + deliveries
              const waypoints: string[] = [];
              // Add rest of pickups
              batch.slice(1).forEach(s => {
                  if (s.pickup_latitude && s.pickup_longitude) waypoints.push(`${s.pickup_latitude},${s.pickup_longitude}`);
              });
              // Add all deliveries (except last one which is dest)
              batch.slice(0, batch.length - 1).forEach(s => {
                  if (s.delivery_latitude && s.delivery_longitude) waypoints.push(`${s.delivery_latitude},${s.delivery_longitude}`);
              });

              const metrics = await this.calculateRouteMetrics(origin, dest, waypoints);
              distanceKm = metrics.distanceKm;
              durationMin = metrics.durationMin;
           } else {
               // Fallback if no API key or empty batch
               distanceKm = batch.length * 1.5;
               durationMin = batch.length * 10;
           }

           // Create the Route
           const route = await tx.route.create({
             data: {
               name: `${hub.name} - Automated Route #${routesCreated + 1}`,
               hub_id: hub.id,
               rider_id: rider.id,
               status: 'active', // Direct to active for automation
               distance_km: distanceKm > 0 ? distanceKm : batch.length * 1.5,
               duration_min: durationMin > 0 ? durationMin : batch.length * 10,
             }
           });

           // Create Stops: Pickups then Deliveries
           const stopsData: any[] = [];
           
           // Process Pickups
           batch.forEach((s, idx) => {
             const isAtHub = s.status === 'received_at_hub';
             stopsData.push({
                route_id: route.id,
                shipment_id: s.id,
                stop_order: idx + 1,
                type: 'pickup',
                location: isAtHub ? (hub.address || hub.name) : s.pickup_address,
                latitude: isAtHub ? hub.latitude : s.pickup_latitude,
                longitude: isAtHub ? hub.longitude : s.pickup_longitude
             });
           });

           // Process Deliveries
           batch.forEach((s, idx) => {
             const isFirstLeg = s.status !== 'received_at_hub';
             stopsData.push({
                route_id: route.id,
                shipment_id: s.id,
                stop_order: batch.length + idx + 1,
                type: 'delivery',
                // If it's Merchant -> Hub, delivery is at Hub. Otherwise, Customer.
                location: isFirstLeg ? (hub.address || hub.name) : s.delivery_address,
                latitude: isFirstLeg ? hub.latitude : s.delivery_latitude,
                longitude: isFirstLeg ? hub.longitude : s.delivery_longitude
             });
           });

           await tx.routeStop.createMany({ data: stopsData });

           // Update Shipments Status to Assigned
           const shipmentIds = batch.map(s => s.id);
           await tx.shipment.updateMany({
               where: { id: { in: shipmentIds } },
               data: { 
                   status: 'assigned',
                   rider_id: rider.id
               }
           });

           routesCreated++;
           shipmentIndex += MAX_PER_ROUTE;
           riderIndex++;
        }
      }

      return { 
        success: true, 
        created: routesCreated, 
        message: `Successfully optimized and deployed ${routesCreated} routes.` 
      };
    });
  }

  private async calculateRouteMetrics(origin: string, destination: string, waypoints: string[] = []): Promise<{ distanceKm: number, durationMin: number }> {
      try {
          const wpStr = waypoints.length > 0 ? `&waypoints=optimize:true|${waypoints.join('|')}` : '';
          const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${wpStr}&key=${config.googleMaps.apiKey}`;
          
          const response = await fetch(url);
          const data = await response.json() as any;

          if (data.status === 'OK' && data.routes.length > 0) {
              const legs = data.routes[0].legs;
              let totalDistMeters = 0;
              let totalDurationSeconds = 0;

              for (const leg of legs) {
                  totalDistMeters += leg.distance.value;
                  totalDurationSeconds += leg.duration.value;
              }

              return {
                  distanceKm: parseFloat((totalDistMeters / 1000).toFixed(1)),
                  durationMin: Math.round(totalDurationSeconds / 60)
              };
          } else {
              if (data.status !== 'OK') console.warn('Google Maps API Error:', data.status, data.error_message);
          }
      } catch (error) {
          console.error('Failed to calculate route metrics:', error);
      }
      return { distanceKm: 0, durationMin: 0 };
  }

  private calculateDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
  }
}

export const routeService = new RouteService();
