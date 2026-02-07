import { Router } from 'express';
import migrationService from '../services/migrationService';
import openshiftDeploymentService from '../services/openshiftDeploymentService';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/migrations
 * Create a new migration
 */
router.post('/', async (req, res, next) => {
  try {
    const { repoUrl, repoPath, options } = req.body;

    if (!repoUrl && !repoPath) {
      return res.status(400).json({ error: 'Repository URL or path is required' });
    }

    const migration = await migrationService.createMigration({
      repoUrl: repoUrl || repoPath,
      repoPath,
      options
    });

    res.status(201).json(migration);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migrations
 * Get all migrations
 */
router.get('/', async (req, res, next) => {
  try {
    const migrations = migrationService.getAllMigrations();
    res.json(migrations);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migrations/:id
 * Get migration by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const migration = migrationService.getMigration(id);

    if (!migration) {
      return res.status(404).json({ error: 'Migration not found' });
    }

    res.json(migration);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/migrations/:id/status
 * Update migration status (called by n8n)
 */
router.post('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agent, status, output, error } = req.body;

    migrationService.updateAgentProgress(id, { agent, status, output, error, timestamp: new Date().toISOString() });

    // Broadcast update via WebSocket
    const io = req.app.locals.io;
    if (io) {
      io.emit('agent-' + (status === 'started' ? 'started' : status === 'completed' ? 'completed' : 'progress'), {
        migrationId: id,
        agent,
        status,
        output,
        error,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/migrations/:id/complete
 * Mark migration as complete
 */
router.post('/:id/complete', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { validationReport } = req.body;

    await migrationService.completeMigration(id, validationReport);

    // Broadcast completion via WebSocket
    const io = req.app.locals.io;
    if (io) {
      io.emit('migration-completed', {
        migrationId: id,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/migrations/:id/error
 * Mark migration as failed
 */
router.post('/:id/error', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = req.body;

    migrationService.updateMigrationStatus(id, 'failed', error);

    // Broadcast error via WebSocket
    const io = req.app.locals.io;
    if (io) {
      io.emit('error', {
        migrationId: id,
        error,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migrations/:id/files
 * Get list of output files
 */
router.get('/:id/files', async (req, res, next) => {
  try {
    const { id } = req.params;
    const files = await migrationService.listOutputFiles(id);
    res.json(files);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migrations/:id/file
 * Read a specific file
 */
router.get('/:id/file', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { path } = req.query;

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'File path is required' });
    }

    const content = await migrationService.readOutputFile(id, path);
    res.send(content);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migrations/:id/download
 * Download migration output as ZIP
 */
router.get('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;
    const downloadPath = migrationService.getDownloadPath(id);

    if (!downloadPath) {
      return res.status(404).json({ error: 'Migration output not found' });
    }

    res.download(downloadPath, `migration-${id}.zip`);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/migrations/:id/deploy
 * Deploy migration to OpenShift
 */
router.post('/:id/deploy', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { namespace, services, microFrontends } = req.body;

    // Check if migration exists and is completed
    const migration = migrationService.getMigration(id);
    if (!migration) {
      return res.status(404).json({ error: 'Migration not found' });
    }

    if (migration.status !== 'completed') {
      return res.status(400).json({ error: 'Migration must be completed before deployment' });
    }

    // Check if OpenShift CLI is available
    const hasOc = await openshiftDeploymentService.checkOcCli();
    const demoMode = !hasOc; // Use demo mode if oc CLI is not available

    if (!hasOc) {
      logger.info('OpenShift CLI not found, running in DEMO MODE', { migrationId: id });
    }

    // Start deployment (demo mode if oc not available)
    const deployment = await openshiftDeploymentService.startDeployment({
      migrationId: id,
      namespace: namespace || `eurobank-${id.substring(0, 8)}`,
      services: services || ['auth-service', 'client-service', 'account-service', 'transaction-service', 'card-service'],
      microFrontends: microFrontends || ['shell', 'auth-mfe', 'dashboard-mfe', 'transfers-mfe', 'cards-mfe'],
      demoMode
    });

    res.status(202).json(deployment);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migrations/:id/deployment
 * Get deployment status
 */
router.get('/:id/deployment', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deployment = openshiftDeploymentService.getDeploymentStatus(id);

    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(deployment);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/deployments
 * Get all deployments
 */
router.get('/deployments/all', async (req, res, next) => {
  try {
    const deployments = openshiftDeploymentService.getAllDeployments();
    res.json(deployments);
  } catch (error) {
    next(error);
  }
});

export default router;
