import { httpServer } from './app';
import { config } from './config/env';
import { logger } from './utils/logger';

import { initWeeklyReports } from './jobs/weeklyReport.job';

import { initFirebase } from './services/notification.service';

const PORT = config.port;

// Initialize Cron Jobs
initWeeklyReports();
// Initialize Firebase
initFirebase();

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📱 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 API URL: ${config.apiUrl}`);
  logger.info(`🌐 Frontend URL: ${config.frontendUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});


