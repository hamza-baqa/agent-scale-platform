import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs-extra';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import migrationRoutes from './routes/migrationRoutes';
import dotMigrationRoutes from './routes/dotMigrationRoutes';
import repoMigrationRoutes from './routes/repoMigrationRoutes';
import chatRoutes from './routes/chatRoutes';
import { setupWebSocket } from './websocket/websocketHandler';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// API Documentation (Swagger)
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Routes
app.use('/api/migrations', migrationRoutes);
app.use('/api/dot-migration', dotMigrationRoutes);
app.use('/api/repo-migration', repoMigrationRoutes);
app.use('/api', chatRoutes);

// WebSocket setup
setupWebSocket(io);

// Make io available to routes via app.locals
app.locals.io = io;

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Ensure directories exist
const ensureDirectories = async () => {
  const dirs = [
    process.env.WORKSPACE_DIR || './workspace',
    process.env.OUTPUT_DIR || './outputs',
    './logs'
  ];

  for (const dir of dirs) {
    await fs.ensureDir(dir);
    logger.info(`Ensured directory exists: ${dir}`);
  }
};

// Start server
const startServer = async () => {
  try {
    await ensureDirectories();

    httpServer.listen(PORT, () => {
      logger.info(`Server: Server running on port ${PORT}`);
      logger.info(`Docs: API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`Health: Health Check: http://localhost:${PORT}/health`);
      logger.info(`Environment: Environment: ${process.env.NODE_ENV}`);
      logger.info(`WebSocket: WebSocket enabled`);
    });

    // Handle port already in use error
    httpServer.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use. Another instance may be running.`);
        logger.error('Please stop the other instance or use a different port.');
        process.exit(1);
      } else {
        logger.error('Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

export { app, io };
