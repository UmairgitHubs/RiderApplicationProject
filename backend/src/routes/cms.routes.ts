import { Router } from 'express';
import * as cmsController from '../controllers/admin.cms.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public CMS routes (still requires authentication as a user)
router.use(authenticate);

router.get('/', cmsController.getPublicContent);

export default router;
