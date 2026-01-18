import { Router } from 'express';
import {
  createShipment,
  getMerchantShipments,
  getShipmentDetails,
  trackShipment,
  updateShipmentStatus,
  cancelShipment,
} from '../controllers/shipment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateCreateShipment } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', validateCreateShipment, createShipment);
router.get('/', getMerchantShipments);
router.get('/:id', getShipmentDetails);
router.get('/track/:trackingNumber', trackShipment);
router.patch('/:id/status', updateShipmentStatus);
router.post('/:id/cancel', cancelShipment);

export default router;

