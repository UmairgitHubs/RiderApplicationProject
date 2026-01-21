import { Router } from 'express';
import multer from 'multer';
import {
  createShipment,
  getMerchantShipments,
  getShipmentDetails,
  trackShipment,
  updateShipmentStatus,
  cancelShipment,
  getShipmentStats,
} from '../controllers/shipment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateCreateShipment } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

const upload = multer({ storage: multer.memoryStorage() });
router.post('/', upload.single('excelFile'), validateCreateShipment, createShipment);
router.get('/stats', getShipmentStats);
router.get('/', getMerchantShipments);
router.get('/:id', getShipmentDetails);
router.get('/track/:trackingNumber', trackShipment);
router.patch('/:id/status', updateShipmentStatus);
router.post('/:id/cancel', cancelShipment);

export default router;

