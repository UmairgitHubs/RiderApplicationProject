
import { Router } from 'express';
import { getSettings, updateSettings, verifyFeature } from '../controllers/settings.controller';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();
console.log('✅ Admin Settings Routes Loaded!');


router.get('/', requireAdmin, getSettings);
router.put('/', requireAdmin, updateSettings);
router.get('/verify/:feature', requireAdmin, verifyFeature);

export default router;
