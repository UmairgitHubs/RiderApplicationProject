import { Router } from 'express';
import {
  login,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifyTwoFactorLogin,
} from '../controllers/admin.controller';
import { getDashboardStats, getReports } from '../controllers/analytics.controller'; // Added import
import {
  validateLogin,
  validateForgotPassword,
  validateVerifyOTP,
  validateResetPassword,
} from '../middleware/validation.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// Auth routes (no authentication required)
router.post('/auth/login', validateLogin, login);
router.post('/auth/verify-2fa', verifyTwoFactorLogin);
router.post('/auth/forgot-password', validateForgotPassword, forgotPassword);
router.post('/auth/verify-otp', validateVerifyOTP, verifyOTP);
router.post('/auth/reset-password', validateResetPassword, resetPassword);

// Protected routes (require admin authentication)
router.get('/auth/me', requireAdmin, getMe);
router.get('/reports', requireAdmin, getReports);
router.get('/dashboard', requireAdmin, getDashboardStats); // Also adding dashboard here for convenience/consistency if needed, or just reports.

export default router;



