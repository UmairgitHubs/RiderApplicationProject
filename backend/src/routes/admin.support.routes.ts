import { Router } from 'express';
import * as supportController from '../controllers/admin.support.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(authenticate);
router.use(requireAdmin);

// Ticket management
router.get('/search-users', supportController.searchUsers);
router.get('/', supportController.getAllTickets);
router.post('/', supportController.createTicket);
router.get('/stats', supportController.getSupportStats);
router.get('/:id', supportController.getTicketById);
router.post('/:id/reply', supportController.replyToTicket);
router.patch('/:id/status', supportController.updateTicketStatus);

export default router;
