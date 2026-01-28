import { Router } from 'express';
import { 
  getAllShipments, 
  getShipmentById, 
  updateShipment,
  adminCancelShipment,
  addShipmentNote,
  getHubList,
  assignShipmentToRider
} from '../controllers/admin.shipment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All routes require Admin privileges
router.use(authenticate);
router.use(requireAdmin);

router.get('/', getAllShipments);
router.get('/hubs', getHubList);
router.get('/:id', getShipmentById);
router.patch('/:id', updateShipment);
router.post('/:id/cancel', adminCancelShipment);
router.post('/:id/note', addShipmentNote);
router.post('/:id/assign', assignShipmentToRider);

export default router;
