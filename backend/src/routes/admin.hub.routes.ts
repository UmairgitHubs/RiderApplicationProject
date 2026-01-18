import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAllHubs, createHub, updateHub, deleteHub, getHubStats, getHubById, getPotentialManagers } from '../controllers/admin.hub.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'ADMIN', 'hub_manager', 'HUB_MANAGER')); // Allow admins and managers


router.route('/stats')
  .get(getHubStats);

router.route('/managers')
  .get(getPotentialManagers);

router.route('/')
  .get(getAllHubs)
  .post(createHub);

router.route('/:id')
  .get(getHubById)
  .patch(updateHub)
  .delete(deleteHub);

export default router;
