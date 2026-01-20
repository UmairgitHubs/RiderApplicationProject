import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/async.middleware';
import { generateVoiceToken, generateTwiML } from '../services/twilio.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

export const getVoiceToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = generateVoiceToken(userId);
  
  res.json({
    success: true,
    data: { token, identity: userId }
  });
});

export const handleVoiceCall = asyncHandler(async (req: Request, res: Response) => {
  // Twilio sends 'To' as the client identity we want to dial.
  // In our case, this is the userId of the recipient.
  const { To } = req.body;
  
  logger.info(`Incoming voice call request to: ${To}`);
  
  const twiml = generateTwiML(To);
  
  res.type('text/xml');
  res.send(twiml);
});
