import { Router } from 'express';
import { getVoiceToken, handleVoiceCall } from '../controllers/voice.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/token', authenticate, getVoiceToken);
router.post('/make-call', handleVoiceCall);

export default router;
