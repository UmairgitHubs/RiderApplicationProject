import twilio from 'twilio';
import { config } from '../config/env';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export const generateVoiceToken = (identity: string) => {
  const { accountSid, apiKey, apiSecret, twimlAppSid } = config.twilio;

  if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
    throw new Error('Twilio configuration missing');
  }

  const accessToken = new AccessToken(accountSid, apiKey, apiSecret, { identity });
  
  const grant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });
  
  accessToken.addGrant(grant);
  
  return accessToken.toJwt();
};

export const generateTwiML = (to: string) => {
  const response = new twilio.twiml.VoiceResponse();
  
  if (to) {
    const dial = response.dial({
      timeout: 30,
      callerId: config.twilio.phoneNumber, // Use your Twilio number as callerId
    });
    
    // If 'to' contains alphabets or hyphens, it's likely a client identity
    if (/[a-zA-Z]/.test(to)) {
      dial.client(to);
    } else {
      // Otherwise, treat as a phone number
      dial.number(to);
    }
  } else {
    response.say('Invalid recipient');
  }
  
  return response.toString();
};
