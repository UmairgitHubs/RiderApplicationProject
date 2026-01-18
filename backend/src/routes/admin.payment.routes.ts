import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAllPayments, getPaymentStats, getPaymentDetails, markPaymentAsSubmitted, reconcilePayment } from '../controllers/admin.payment.controller';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'hub_manager'));

router.route('/stats')
  .get(getPaymentStats);

router.route('/')
  .get(getAllPayments);


router.route('/:id/submit-to-hub')
  .post(markPaymentAsSubmitted);

router.route('/:id/reconcile')
  .post(reconcilePayment);


router.route('/:id')
  .get(getPaymentDetails);

export default router;
