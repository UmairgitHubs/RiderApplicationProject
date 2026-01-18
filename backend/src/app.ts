// Polyfill for BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';
import { setupSocket } from './socket/socket.handler';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: config.nodeEnv === 'production' 
      ? config.frontendUrl 
      : true, // Allow all origins in development (for mobile devices)
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));


// Root endpoint - helpful message
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'COD Express Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      test: '/api/v1/test',
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Test endpoint for mobile connectivity (no auth required)
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is reachable from mobile device!',
    timestamp: new Date().toISOString(),
    ip: req.ip,
  });
});

// API Routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.io
setupSocket(io);

export { app, httpServer, io };


