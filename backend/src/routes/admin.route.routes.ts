import { Router } from 'express';
import {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteStats,
  autoOptimize,
  getUnassignedShipments,
  getAvailableRiders,
  updateRouteStatus
} from '../controllers/admin.route.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { validateCreateRoute } from '../middleware/validation.middleware';


const router = Router();

router.use(requireAdmin);

router.get('/stats', getRouteStats);
router.get('/unassigned-shipments', getUnassignedShipments);
router.get('/available-riders', getAvailableRiders);
router.post('/optimize', autoOptimize);
router.get('/', getAllRoutes);
router.get('/:id', getRouteById);
router.post('/', validateCreateRoute, createRoute);
router.patch('/:id/status', updateRouteStatus);
router.patch('/:id', validateCreateRoute, updateRoute);

router.delete('/:id', deleteRoute);

export default router;
