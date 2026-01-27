import admin from 'firebase-admin';
import { config } from '../config/env';
import { logger } from '../utils/logger';
require("dotenv").config();

if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey.replace(/\\n/g, "\n"),
      }),
    });
    logger.info('Firebase Admin initialized successfully');
  } catch (error) {
    logger.error('Firebase Admin initialization failed:', error);
  }
} else {
  logger.warn('Firebase configuration missing, push notifications will not work');
}

export const sendPushNotification = async (token: string, title: string, body: string, data?: any) => {
  if (!token) return;

  try {
    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: token,
    };

    const response = await admin.messaging().send(message);
    logger.info('Successfully sent push notification:', response);
    return response;
  } catch (error) {
    logger.error('Error sending push notification:', error);
  }
};

export default admin;
