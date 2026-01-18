import { Router } from 'express';
import { getWallets, getWalletDetails, updatePaymentStatus } from '../controllers/admin.wallet.controller';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// Apply admin check to all routes
router.use(requireAdmin);

router.get('/', getWallets);
router.get('/:userId', getWalletDetails);
router.patch('/transactions/:transactionId/status', updatePaymentStatus);

export default router;
