import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAgents, getAgentStats, createAgent, getAgentDetails } from '../controllers/admin.agent.controller';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'hub_manager'));

router.get('/stats', getAgentStats); // Specific routes first

router.route('/')
    .get(getAgents)
    .post(createAgent);

router.get('/:id', getAgentDetails); // Dynamic routes last

export default router;
