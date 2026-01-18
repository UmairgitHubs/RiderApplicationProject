import { Router } from 'express';
import * as cmsController from '../controllers/admin.cms.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All CMS routes require admin privileges
router.use(authenticate);
router.use(requireAdmin);

router.get('/', cmsController.getAllCMS);
router.get('/stats', cmsController.getCMSStats);
router.post('/', cmsController.createCMS);
router.patch('/:id', cmsController.updateCMS);
router.delete('/:id', cmsController.deleteCMS);

export default router;
