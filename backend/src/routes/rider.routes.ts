import { Router } from 'express';
import {
  getAvailableOrders,
  acceptOrder,
  pickupOrder,
  updateLocation,
  getActiveOrders,
  completeDelivery,
  toggleOnlineStatus,
  getEarnings,
  getCompletedOrders,
  getRiderRoutes,
  getPerformanceStats,
} from '../controllers/rider.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/available-orders', getAvailableOrders);
router.post('/accept-order', acceptOrder);
router.post('/pickup-order', pickupOrder);
router.post('/update-location', updateLocation);
router.get('/active-orders', getActiveOrders);
router.get('/completed-orders', getCompletedOrders);
router.post('/complete-delivery', completeDelivery);
router.post('/toggle-online', toggleOnlineStatus);
router.get('/earnings', getEarnings);
router.get('/routes', getRiderRoutes);
router.get('/performance-stats', getPerformanceStats);

export default router;

