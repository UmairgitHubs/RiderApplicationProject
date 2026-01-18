import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  getSessions,
  toggleTwoFactor,
  getActivityLogs,
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/change-password', changePassword);
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.patch('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);
router.get('/sessions', getSessions);
router.post('/2fa/toggle', toggleTwoFactor);
router.get('/activity-logs', getActivityLogs);

export default router;

