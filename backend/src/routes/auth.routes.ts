import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifyLoginTwoFactor,
} from '../controllers/auth.controller';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateVerifyOTP,
  validateResetPassword,
} from '../middleware/validation.middleware';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/verify-otp', validateVerifyOTP, verifyOTP);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/verify-2fa-login', verifyLoginTwoFactor);

export default router;


