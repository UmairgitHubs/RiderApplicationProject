import { Router } from 'express';
import { getAllMerchants, getMerchantStats, getMerchantDetails, updateMerchant, createMerchant } from '../controllers/admin.merchant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.post('/', createMerchant);
router.get('/', getAllMerchants);
router.get('/stats', getMerchantStats);
router.get('/:id', getMerchantDetails);
router.patch('/:id', updateMerchant);

export default router;
