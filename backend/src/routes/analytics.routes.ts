import { Router } from 'express';
import { getDashboardStats, getOrderTrend, getCalendarData } from '../controllers/analytics.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Analytics routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', getDashboardStats);
router.get('/orders-trend', getOrderTrend);
router.get('/calendar', getCalendarData);

export default router;
