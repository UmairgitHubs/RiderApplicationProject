import { Router } from 'express';
import { getAllRiders, getRiderStats, getRiderDetails, updateRider, assignOrders, deleteRider, suspendRider, createRider } from '../controllers/admin.rider.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/', createRider);
router.get('/', getAllRiders);
router.get('/stats', getRiderStats);
router.get('/:id', getRiderDetails);
router.patch('/:id', updateRider);
router.post('/:id/assign-orders', assignOrders);
router.post('/:id/suspend', suspendRider);
router.delete('/:id', deleteRider);

export default router;
