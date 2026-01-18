import { Router } from 'express';
import * as supportController from '../controllers/support.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/create', supportController.createTicket);
router.get('/my-tickets', supportController.getMyTickets);
router.post('/:id/reply', supportController.replyToTicket);

export default router;
