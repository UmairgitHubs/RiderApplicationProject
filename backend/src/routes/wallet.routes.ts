import { Router } from 'express';
import {
  getWallet,
  addMoney,
  withdrawMoney,
  getTransactionDetails,
} from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getWallet);
router.post('/add-money', addMoney);
router.post('/withdraw', withdrawMoney);
router.get('/transactions/:id', getTransactionDetails);

export default router;

