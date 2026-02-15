import { Router } from 'express';
import migrationService from '../services/migrationService';
import openshiftDeploymentService from '../services/openshiftDeploymentService';
import containerDeploymentService from '../services/containerDeploymentService';
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
 * GET /api/migrations/:id/validation-report
 * Get validation report for a migration
 */
router.get('/:id/validation-report', async (req, res, next) => {
  try {
    const { id } = req.params;
    const migration = migrationService.getMigration(id);

    if (!migration) {
      return res.status(404).json({ error: 'Migration not found' });
    }

    const validationReport = (migration as any).validationReport;

    if (!validationReport) {
      return res.status(404).json({
        error: 'Validation report not available',
        message: 'The migration has not completed validation yet'
      });
    }

    res.json(validationReport);
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
 * Generates code on-demand if not already generated
 */
router.get('/:id/download', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get migration
    const migration = migrationService.getMigration(id);

    if (!migration) {
      return res.status(404).json({ error: 'Migration not found' });
    }

    // Check if migration is completed (analysis + planning done)
    // Allow download for: completed, validated, OR completed_with_errors
    if (migration.status !== 'completed' && migration.status !== 'validated' && migration.status !== 'completed_with_errors') {
      // Special handling for retrying state
      if (migration.status === 'retrying') {
        return res.status(400).json({
          error: 'Migration is retrying',
          message: 'Critical errors found. System is automatically retrying with adjusted parameters.',
          retryAttempt: (migration as any).retryAttempt || 1,
          maxRetries: 3
        });
      }

      return res.status(400).json({
        error: 'Migration not ready',
        message: 'Please wait for migration to complete before downloading code',
        currentStatus: migration.status
      });
    }

    // Log warning if downloading code with errors
    if (migration.status === 'completed_with_errors') {
      logger.warn(`⚠️ Allowing download despite errors for migration ${id}`, {
        totalErrors: (migration as any).errorAnalysis?.totalErrors || 0,
        retriesAttempted: (migration as any).errorAnalysis?.retriesAttempted || 0
      });
    }

    // CRITICAL: Validate NO critical errors before download (SKIP for completed_with_errors)
    if (migration.status !== 'completed_with_errors' && (migration as any).errorAnalysis) {
      const criticalIssues = (migration as any).errorAnalysis.analysis?.criticalIssues || [];
      if (criticalIssues.length > 0) {
        logger.warn(`🚫 Download blocked: ${criticalIssues.length} critical issues remain`);
        return res.status(400).json({
          error: 'Download blocked - critical errors remain',
          message: 'Code has critical errors that must be resolved.',
          criticalIssues: criticalIssues.length,
          summary: (migration as any).errorAnalysis.analysis?.summary
        });
      }
    }

    logger.info(`✅ Validation passed - allowing download for ${id}`);

    // Check if code has already been generated
    let downloadPath = migrationService.getDownloadPath(id);

    if (!downloadPath) {
      // Code not generated yet - generate it now!
      logger.info(`📦 [ON-DEMAND] Generating code for migration ${id}...`);

      try {
        // Import the code generation function
        const { generateCodeOnDemand } = require('./repoMigrationRoutes');

        // Generate code (this will create microservices + micro-frontends + infrastructure)
        await generateCodeOnDemand(id, migration);

        // Get download path after generation
        downloadPath = migrationService.getDownloadPath(id);

        if (!downloadPath) {
          throw new Error('Code generation completed but output file not found');
        }

        logger.info(`✅ [ON-DEMAND] Code generated successfully for ${id}`);
      } catch (genError: any) {
        logger.error(`❌ [ON-DEMAND] Code generation failed for ${id}:`, genError);
        return res.status(500).json({
          error: 'Code generation failed',
          message: genError.message,
          details: 'Please check migration logs for more information'
        });
      }
    }

    // Download the ZIP file
    logger.info(`📥 Downloading migration ${id}: ${downloadPath}`);
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

/**
 * POST /api/migrations/:id/containers/deploy
 * Deploy migration in Docker containers
 */
router.post('/:id/containers/deploy', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if migration exists and is completed
    const migration = migrationService.getMigration(id);
    if (!migration) {
      return res.status(404).json({ error: 'Migration not found' });
    }

    if (migration.status !== 'completed') {
      return res.status(400).json({ error: 'Migration must be completed before container deployment' });
    }

    // Start container deployment
    const deployment = await containerDeploymentService.deployInContainers(id);

    res.status(202).json(deployment);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migrations/:id/containers
 * Get container deployment status
 */
router.get('/:id/containers', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deploymentId = `deployment-${id}`;
    const deployment = containerDeploymentService.getDeployment(deploymentId);

    if (!deployment) {
      return res.status(404).json({ error: 'Container deployment not found' });
    }

    res.json(deployment);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/migrations/:id/containers/stop
 * Stop container deployment
 */
router.post('/:id/containers/stop', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deploymentId = `deployment-${id}`;

    await containerDeploymentService.stopDeployment(deploymentId);

    res.json({ success: true, message: 'Containers stopped successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/migrations/:id/containers
 * Remove container deployment (stop and remove volumes)
 */
router.delete('/:id/containers', async (req, res, next) => {
  try {
    const { id } = req.params;
    const deploymentId = `deployment-${id}`;

    await containerDeploymentService.removeDeployment(deploymentId);

    res.json({ success: true, message: 'Containers removed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/migrations/:id/containers/logs/:serviceName
 * Get logs for a specific service
 */
router.get('/:id/containers/logs/:serviceName', async (req, res, next) => {
  try {
    const { id, serviceName } = req.params;
    const { tail = '100' } = req.query;
    const deploymentId = `deployment-${id}`;

    const logs = await containerDeploymentService.getServiceLogs(
      deploymentId,
      serviceName,
      parseInt(tail as string)
    );

    res.json({ serviceName, logs });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/containers
 * Get all container deployments
 */
router.get('/containers/all', async (req, res, next) => {
  try {
    const deployments = containerDeploymentService.getAllDeployments();
    res.json(deployments);
  } catch (error) {
    next(error);
  }
});

export default router;
