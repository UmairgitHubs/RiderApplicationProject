import { Router } from 'express';
import * as chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Send message
router.post('/messages', chatController.sendMessage);

// Get messages for a shipment
router.get('/conversations/:shipmentId', chatController.getMessagesByShipment);

// Mark as read
router.patch('/conversations/:shipmentId/read', chatController.markAsRead);

// Support Chat Routes
router.get('/support/conversation', chatController.getSupportConversation);
router.get('/conversations/:conversationId/messages', chatController.getSupportMessages);
router.post('/support/messages', chatController.sendSupportMessage);

export default router;
