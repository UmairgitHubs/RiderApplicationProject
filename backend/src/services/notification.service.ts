import firebaseAdmin from 'firebase-admin';
import { logger } from '../utils/logger';
import path from 'path';

// Note: In production, you should use environment variables or a secure secret manager
// and not commit the serviceAccountKey.json to version control.
// For now, we assume a file exists or we initialize with mock/env vars if typical setup.

let isInitialized = false;

export const initFirebase = () => {
    try {
        if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
             logger.warn('Firebase Service Account not provided in env. Push notifications will differ.');
             // Mock initialization or simplified for development
             return;
        }

        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccount)
        });
        
        isInitialized = true;
        logger.info('Firebase Admin initialized successfully.');
    } catch (error) {
        logger.error('Failed to initialize Firebase Admin:', error);
    }
};

export const sendPushNotification = async (
    fcmToken: string,
    title: string,
    body: string,
    data?: any
): Promise<boolean> => {
    if (!isInitialized) {
        logger.warn('Firebase not initialized. Cannot send push notification.');
        return false;
    }

    try {
        await firebaseAdmin.messaging().send({
            token: fcmToken,
            notification: {
                title,
                body
            },
            data: data || {}
        });
        logger.info(`Push notification sent to ${fcmToken}`);
        return true;
    } catch (error) {
        logger.error(`Failed to send push notification to ${fcmToken}:`, error);
        return false;
    }
};
