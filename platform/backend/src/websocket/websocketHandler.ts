import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger';

let ioInstance: SocketIOServer | null = null;

export const setupWebSocket = (io: SocketIOServer) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    logger.info('WebSocket client connected', { socketId: socket.id });

    // Handle migration subscription
    socket.on('subscribe', (data: { migrationId: string }) => {
      const { migrationId } = data;
      socket.join(`migration-${migrationId}`);
      logger.info('✅ Client subscribed to migration', { socketId: socket.id, migrationId, room: `migration-${migrationId}` });

      // Send confirmation
      socket.emit('subscribed', { migrationId, message: 'Successfully subscribed to migration updates' });
    });

    // Handle migration unsubscription
    socket.on('unsubscribe', (data: { migrationId: string }) => {
      const { migrationId } = data;
      socket.leave(`migration-${migrationId}`);
      logger.info('Client unsubscribed from migration', { socketId: socket.id, migrationId });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', { socketId: socket.id });
    });
  });

  logger.info('WebSocket server initialized');
};

/**
 * Emit agent started event
 */
export const emitAgentStarted = (migrationId: string, agent: string) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('agent-started', {
      migrationId,
      agent,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted agent-started event`, { migrationId, agent });
  }
};

/**
 * Emit agent progress event
 */
export const emitAgentProgress = (migrationId: string, agent: string, progress: number) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('agent-progress', {
      migrationId,
      agent,
      progress,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Emit agent completed event
 */
export const emitAgentCompleted = (migrationId: string, agent: string, output?: string) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('agent-completed', {
      migrationId,
      agent,
      output,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted agent-completed event`, { migrationId, agent });
  }
};

/**
 * Emit agent reset event (status reset to pending for retry)
 */
export const emitAgentReset = (migrationId: string, agent: string) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('agent-reset', {
      migrationId,
      agent,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted agent-reset event`, { migrationId, agent });
  }
};

/**
 * Emit migration completed event
 */
export const emitMigrationCompleted = (migrationId: string) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('migration-completed', {
      migrationId,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted migration-completed event`, { migrationId });
  }
};

/**
 * Emit error event
 */
export const emitError = (migrationId: string, error: string) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('error', {
      migrationId,
      error,
      timestamp: new Date().toISOString()
    });
    logger.error(`Emitted error event`, { migrationId, error });
  }
};

/**
 * Emit deployment progress event
 */
export const emitDeploymentProgress = (migrationId: string, deployment: any) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('deployment-progress', {
      migrationId,
      deployment,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted deployment-progress event`, { migrationId, progress: deployment.progress });
  }
};

/**
 * Emit deployment completed event
 */
export const emitDeploymentCompleted = (migrationId: string, deployment: any) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('deployment-completed', {
      migrationId,
      deployment,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted deployment-completed event`, { migrationId });
  }
};

/**
 * Emit deployment failed event
 */
export const emitDeploymentFailed = (migrationId: string, error: string) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('deployment-failed', {
      migrationId,
      error,
      timestamp: new Date().toISOString()
    });
    logger.error(`Emitted deployment-failed event`, { migrationId, error });
  }
};

/**
 * Emit agent log event for real-time log streaming
 */
export const emitAgentLog = (
  migrationId: string,
  agent: string,
  level: 'info' | 'warn' | 'error' | 'debug' | 'success',
  message: string,
  data?: any
) => {
  // Always log to winston
  logger.info(message, { migrationId, agent, level, ...(data || {}) });

  // Emit to WebSocket if available
  if (ioInstance) {
    logger.info(`📡 Emitting agent-log event`, { migrationId, agent, level, messagePreview: message.substring(0, 50) });
    ioInstance.to(`migration-${migrationId}`).emit('agent-log', {
      migrationId,
      agent,
      level,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  } else {
    logger.warn(`⚠️ Cannot emit agent-log - ioInstance is null`);
  }
};

/**
 * Emit retry loop started event
 */
export const emitRetryLoopStarted = (
  migrationId: string,
  attempt: number,
  maxRetries: number,
  totalErrors: number
) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('retry-loop-started', {
      migrationId,
      attempt,
      maxRetries,
      totalErrors,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted retry-loop-started event`, { migrationId, attempt, totalErrors });
  }
};

/**
 * Emit retry loop progress event
 */
export const emitRetryLoopProgress = (
  migrationId: string,
  attempt: number,
  phase: 'analyzing' | 'improving-plan' | 'regenerating' | 'validating',
  message: string,
  data?: any
) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('retry-loop-progress', {
      migrationId,
      attempt,
      phase,
      message,
      data,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted retry-loop-progress event`, { migrationId, attempt, phase });
  }
};

/**
 * Emit retry loop iteration completed event
 */
export const emitRetryLoopIterationCompleted = (
  migrationId: string,
  attempt: number,
  errorsRemaining: number,
  errorsFixed: number
) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('retry-loop-iteration-completed', {
      migrationId,
      attempt,
      errorsRemaining,
      errorsFixed,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted retry-loop-iteration-completed event`, { migrationId, attempt, errorsRemaining });
  }
};

/**
 * Emit retry loop success event (0 errors)
 */
export const emitRetryLoopSuccess = (
  migrationId: string,
  totalAttempts: number
) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('retry-loop-success', {
      migrationId,
      totalAttempts,
      timestamp: new Date().toISOString()
    });
    logger.info(`Emitted retry-loop-success event`, { migrationId, totalAttempts });
  }
};

/**
 * Emit retry loop failed event (max retries reached)
 */
export const emitRetryLoopFailed = (
  migrationId: string,
  totalAttempts: number,
  errorsRemaining: number
) => {
  if (ioInstance) {
    ioInstance.to(`migration-${migrationId}`).emit('retry-loop-failed', {
      migrationId,
      totalAttempts,
      errorsRemaining,
      timestamp: new Date().toISOString()
    });
    logger.error(`Emitted retry-loop-failed event`, { migrationId, totalAttempts, errorsRemaining });
  }
};
