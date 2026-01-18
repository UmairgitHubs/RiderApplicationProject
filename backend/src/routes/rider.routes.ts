import { Router } from 'express';
import {
  getAvailableOrders,
  acceptOrder,
  updateLocation,
  getActiveOrders,
  completeDelivery,
  toggleOnlineStatus,
  getEarnings,
  getCompletedOrders,
} from '../controllers/rider.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/available-orders', getAvailableOrders);
router.post('/accept-order', acceptOrder);
router.post('/update-location', updateLocation);
router.get('/active-orders', getActiveOrders);
router.get('/completed-orders', getCompletedOrders);
router.post('/complete-delivery', completeDelivery);
router.post('/toggle-online', toggleOnlineStatus);
router.get('/earnings', getEarnings);

export default router;

