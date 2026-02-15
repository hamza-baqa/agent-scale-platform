import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

const execAsync = promisify(exec);

/**
 * Build Validator Service
 *
 * Validates that generated code builds and runs successfully:
 * 1. Builds all Docker images
 * 2. Runs docker-compose up
 * 3. Checks health of all services
 * 4. Returns detailed error report if any failures
 */

export interface BuildError {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'Build' | 'Runtime' | 'Configuration' | 'Dependency' | 'Network';
  service: string;
  location: string;
  description: string;
  impact: string;
  recommendation: string;
  fullLog?: string;
}

export interface BuildValidationResult {
  success: boolean;
  totalErrors: number;
  errors: BuildError[];
  servicesBuilt: string[];
  servicesFailed: string[];
  servicesRunning: string[];
  servicesUnhealthy: string[];
  buildTime: number;
  startupTime: number;
}

export class BuildValidator {

  /**
   * Validate that generated code builds and runs successfully
   */
  async validateBuild(outputPath: string, projectName: string = 'banque-app'): Promise<BuildValidationResult> {
    const startTime = Date.now();
    const errors: BuildError[] = [];
    const servicesBuilt: string[] = [];
    const servicesFailed: string[] = [];
    const servicesRunning: string[] = [];
    const servicesUnhealthy: string[] = [];

    logger.info('🔨 Starting build validation', { outputPath });

    try {
      // Step 1: Verify docker-compose.yml exists
      const composeFile = path.join(outputPath, 'docker-compose.yml');
      if (!await fs.pathExists(composeFile)) {
        errors.push({
          id: 'ERR-BUILD-001',
          severity: 'CRITICAL',
          category: 'Configuration',
          service: 'infrastructure',
          location: 'docker-compose.yml',
          description: 'docker-compose.yml file not found',
          impact: 'Cannot orchestrate services',
          recommendation: 'Ensure docker-compose.yml is generated during infrastructure phase'
        });

        return {
          success: false,
          totalErrors: 1,
          errors,
          servicesBuilt: [],
          servicesFailed: [],
          servicesRunning: [],
          servicesUnhealthy: [],
          buildTime: 0,
          startupTime: 0
        };
      }

      // Step 2: Check Docker daemon is running
      try {
        await execAsync('docker info');
        logger.info('✅ Docker daemon is running');
      } catch (error: any) {
        errors.push({
          id: 'ERR-BUILD-002',
          severity: 'CRITICAL',
          category: 'Runtime',
          service: 'infrastructure',
          location: 'Docker',
          description: 'Docker daemon is not running',
          impact: 'Cannot build or run containers',
          recommendation: 'Start Docker Desktop or Docker daemon before building',
          fullLog: error.message
        });

        return {
          success: false,
          totalErrors: 1,
          errors,
          servicesBuilt: [],
          servicesFailed: [],
          servicesRunning: [],
          servicesUnhealthy: [],
          buildTime: 0,
          startupTime: 0
        };
      }

      // Step 3: Stop any existing containers from previous attempts
      await this.cleanupPreviousRun(outputPath, projectName);

      // Step 4: Build all Docker images
      logger.info('📦 Building Docker images...');
      const buildStart = Date.now();

      const buildResult = await this.buildDockerImages(outputPath, projectName);
      servicesBuilt.push(...buildResult.built);
      servicesFailed.push(...buildResult.failed);
      errors.push(...buildResult.errors);

      const buildTime = Date.now() - buildStart;
      logger.info(`✅ Build completed in ${buildTime}ms`, { built: servicesBuilt.length, failed: servicesFailed.length });

      // If any builds failed, stop here
      if (servicesFailed.length > 0) {
        return {
          success: false,
          totalErrors: errors.length,
          errors,
          servicesBuilt,
          servicesFailed,
          servicesRunning: [],
          servicesUnhealthy: [],
          buildTime,
          startupTime: 0
        };
      }

      // Step 5: Start services with docker-compose up
      logger.info('🚀 Starting services with docker-compose...');
      const startupStart = Date.now();

      const startupResult = await this.startServices(outputPath, projectName);
      errors.push(...startupResult.errors);

      // Step 6: Wait for services to be ready (health checks)
      logger.info('⏳ Waiting for services to be healthy...');
      await this.waitForHealthChecks(outputPath, projectName, 120); // 2 minutes timeout

      // Step 7: Check health of all services
      const healthResult = await this.checkServiceHealth(outputPath, projectName);
      servicesRunning.push(...healthResult.running);
      servicesUnhealthy.push(...healthResult.unhealthy);
      errors.push(...healthResult.errors);

      const startupTime = Date.now() - startupStart;
      logger.info(`✅ Startup completed in ${startupTime}ms`, { running: servicesRunning.length, unhealthy: servicesUnhealthy.length });

      // Success if all services are running and healthy
      const success = servicesFailed.length === 0 && servicesUnhealthy.length === 0 && errors.length === 0;

      return {
        success,
        totalErrors: errors.length,
        errors,
        servicesBuilt,
        servicesFailed,
        servicesRunning,
        servicesUnhealthy,
        buildTime,
        startupTime
      };

    } catch (error: any) {
      logger.error('❌ Build validation failed with unexpected error', error);

      errors.push({
        id: 'ERR-BUILD-999',
        severity: 'CRITICAL',
        category: 'Runtime',
        service: 'infrastructure',
        location: 'buildValidator',
        description: `Unexpected error during build validation: ${error.message}`,
        impact: 'Build validation could not complete',
        recommendation: 'Check logs for details and retry',
        fullLog: error.stack
      });

      return {
        success: false,
        totalErrors: errors.length,
        errors,
        servicesBuilt,
        servicesFailed,
        servicesRunning,
        servicesUnhealthy,
        buildTime: Date.now() - startTime,
        startupTime: 0
      };
    }
  }

  /**
   * Cleanup previous run (stop and remove containers)
   */
  private async cleanupPreviousRun(outputPath: string, projectName: string): Promise<void> {
    try {
      logger.info('🧹 Cleaning up previous run...');

      const composeCommand = await this.getDockerComposeCommand();
      await execAsync(`${composeCommand} -p ${projectName} down -v`, {
        cwd: outputPath,
        timeout: 60000 // 1 minute timeout
      });

      logger.info('✅ Previous containers cleaned up');
    } catch (error: any) {
      // Ignore errors - may not have previous containers
      logger.debug('No previous containers to clean up');
    }
  }

  /**
   * Build all Docker images
   */
  private async buildDockerImages(outputPath: string, projectName: string): Promise<{
    built: string[];
    failed: string[];
    errors: BuildError[];
  }> {
    const built: string[] = [];
    const failed: string[] = [];
    const errors: BuildError[] = [];

    try {
      const composeCommand = await this.getDockerComposeCommand();

      // Build with --no-cache to ensure fresh build
      const { stdout, stderr } = await execAsync(
        `${composeCommand} -p ${projectName} build --no-cache --progress=plain`,
        {
          cwd: outputPath,
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large build logs
          timeout: 600000 // 10 minutes timeout
        }
      );

      // Parse build output to extract built services
      const buildLog = stdout + stderr;
      const serviceMatches = buildLog.matchAll(/Building\s+(\S+)/gi);

      for (const match of serviceMatches) {
        const serviceName = match[1];

        // Check if build succeeded for this service
        const successPattern = new RegExp(`\\[.*${serviceName}.*\\].*done`, 'i');
        const errorPattern = new RegExp(`ERROR.*${serviceName}`, 'i');

        if (successPattern.test(buildLog)) {
          built.push(serviceName);
          logger.info(`✅ Built: ${serviceName}`);
        } else if (errorPattern.test(buildLog)) {
          failed.push(serviceName);

          // Extract error details
          const errorDetails = this.extractBuildError(buildLog, serviceName);
          errors.push({
            id: `ERR-BUILD-${String(errors.length + 1).padStart(3, '0')}`,
            severity: 'CRITICAL',
            category: 'Build',
            service: serviceName,
            location: errorDetails.location,
            description: errorDetails.description,
            impact: `Service ${serviceName} cannot be deployed`,
            recommendation: errorDetails.recommendation,
            fullLog: errorDetails.fullLog
          });

          logger.error(`❌ Build failed: ${serviceName}`, errorDetails.description);
        }
      }

      // If no services were detected, assume all built successfully
      if (built.length === 0 && failed.length === 0) {
        logger.info('✅ All services built successfully (no individual service logs found)');
      }

    } catch (error: any) {
      logger.error('❌ Docker build failed', error.message);

      // Parse error message to identify which service(s) failed
      const failedService = this.extractServiceFromError(error.message);
      failed.push(failedService || 'unknown-service');

      errors.push({
        id: `ERR-BUILD-${String(errors.length + 1).padStart(3, '0')}`,
        severity: 'CRITICAL',
        category: 'Build',
        service: failedService || 'unknown',
        location: 'Dockerfile',
        description: this.extractErrorMessage(error.message),
        impact: 'Build process failed',
        recommendation: this.suggestBuildFix(error.message),
        fullLog: error.message
      });
    }

    return { built, failed, errors };
  }

  /**
   * Start services with docker-compose up
   */
  private async startServices(outputPath: string, projectName: string): Promise<{
    errors: BuildError[];
  }> {
    const errors: BuildError[] = [];

    try {
      const composeCommand = await this.getDockerComposeCommand();

      // Start services in detached mode
      await execAsync(`${composeCommand} -p ${projectName} up -d`, {
        cwd: outputPath,
        timeout: 120000 // 2 minutes timeout
      });

      logger.info('✅ Services started in background');

    } catch (error: any) {
      logger.error('❌ Failed to start services', error.message);

      errors.push({
        id: `ERR-RUN-${String(errors.length + 1).padStart(3, '0')}`,
        severity: 'HIGH',
        category: 'Runtime',
        service: 'docker-compose',
        location: 'docker-compose.yml',
        description: `Failed to start services: ${error.message}`,
        impact: 'Services cannot start',
        recommendation: 'Check docker-compose.yml configuration and service dependencies',
        fullLog: error.message
      });
    }

    return { errors };
  }

  /**
   * Wait for health checks to complete
   */
  private async waitForHealthChecks(outputPath: string, projectName: string, timeoutSeconds: number): Promise<void> {
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;

    while (Date.now() - startTime < timeoutMs) {
      try {
        const composeCommand = await this.getDockerComposeCommand();
        const { stdout } = await execAsync(`${composeCommand} -p ${projectName} ps --format json`, {
          cwd: outputPath
        });

        // Parse service status
        const services = JSON.parse(`[${stdout.trim().replace(/}\s*{/g, '},{')}]`);
        const allHealthy = services.every((service: any) =>
          service.Health === 'healthy' || service.State === 'running'
        );

        if (allHealthy) {
          logger.info('✅ All services are healthy');
          return;
        }

        // Wait 5 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error: any) {
        logger.debug('Health check in progress...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    logger.warn(`⚠️ Health check timeout after ${timeoutSeconds}s`);
  }

  /**
   * Check health of all services
   */
  private async checkServiceHealth(outputPath: string, projectName: string): Promise<{
    running: string[];
    unhealthy: string[];
    errors: BuildError[];
  }> {
    const running: string[] = [];
    const unhealthy: string[] = [];
    const errors: BuildError[] = [];

    try {
      const composeCommand = await this.getDockerComposeCommand();
      const { stdout } = await execAsync(`${composeCommand} -p ${projectName} ps --format json`, {
        cwd: outputPath
      });

      // Parse service status
      const services = JSON.parse(`[${stdout.trim().replace(/}\s*{/g, '},{')}]`);

      for (const service of services) {
        const serviceName = service.Service || service.Name;
        const state = service.State;
        const health = service.Health;

        if (state === 'running' && (health === 'healthy' || !health)) {
          running.push(serviceName);
          logger.info(`✅ ${serviceName}: running & healthy`);
        } else {
          unhealthy.push(serviceName);
          logger.warn(`⚠️ ${serviceName}: ${state} (health: ${health || 'unknown'})`);

          // Get logs for unhealthy service
          const logs = await this.getServiceLogs(outputPath, projectName, serviceName);

          errors.push({
            id: `ERR-HEALTH-${String(errors.length + 1).padStart(3, '0')}`,
            severity: 'HIGH',
            category: 'Runtime',
            service: serviceName,
            location: 'Container',
            description: `Service is ${state} (health: ${health || 'unknown'})`,
            impact: `Service ${serviceName} is not available`,
            recommendation: this.suggestHealthFix(logs),
            fullLog: logs
          });
        }
      }

    } catch (error: any) {
      logger.error('❌ Failed to check service health', error.message);

      errors.push({
        id: `ERR-HEALTH-999`,
        severity: 'HIGH',
        category: 'Runtime',
        service: 'docker-compose',
        location: 'docker-compose.yml',
        description: `Failed to check service health: ${error.message}`,
        impact: 'Cannot verify service status',
        recommendation: 'Check docker-compose ps output manually',
        fullLog: error.message
      });
    }

    return { running, unhealthy, errors };
  }

  /**
   * Get logs for a specific service
   */
  private async getServiceLogs(outputPath: string, projectName: string, serviceName: string): Promise<string> {
    try {
      const composeCommand = await this.getDockerComposeCommand();
      const { stdout, stderr } = await execAsync(
        `${composeCommand} -p ${projectName} logs --tail=50 ${serviceName}`,
        {
          cwd: outputPath,
          timeout: 10000
        }
      );
      return stdout + stderr;
    } catch (error: any) {
      return error.message;
    }
  }

  /**
   * Stop all services and cleanup
   */
  async cleanup(outputPath: string, projectName: string): Promise<void> {
    try {
      logger.info('🧹 Stopping services...');
      const composeCommand = await this.getDockerComposeCommand();
      await execAsync(`${composeCommand} -p ${projectName} down -v`, {
        cwd: outputPath,
        timeout: 60000
      });
      logger.info('✅ Services stopped and cleaned up');
    } catch (error: any) {
      logger.error('❌ Cleanup failed', error.message);
    }
  }

  /**
   * Get docker-compose command (v1 or v2)
   */
  private async getDockerComposeCommand(): Promise<string> {
    try {
      await execAsync('docker-compose --version');
      return 'docker-compose';
    } catch {
      try {
        await execAsync('docker compose version');
        return 'docker compose';
      } catch {
        throw new Error('Docker Compose not found. Please install Docker Compose.');
      }
    }
  }

  /**
   * Extract build error details from build log
   */
  private extractBuildError(buildLog: string, serviceName: string): {
    location: string;
    description: string;
    recommendation: string;
    fullLog: string;
  } {
    // Common build error patterns
    const patterns = [
      { regex: /ERROR.*pom\.xml.*dependency/i, location: 'pom.xml', desc: 'Maven dependency error', rec: 'Check pom.xml dependencies and Maven Central availability' },
      { regex: /ERROR.*package.*does not exist/i, location: 'Java source', desc: 'Missing Java package import', rec: 'Add missing import statements in Java files' },
      { regex: /ERROR.*cannot find symbol/i, location: 'Java source', desc: 'Undefined Java symbol', rec: 'Check class names, method names, and variable declarations' },
      { regex: /ERROR.*npm.*not found/i, location: 'package.json', desc: 'NPM package not found', rec: 'Check package.json dependencies and npm registry' },
      { regex: /ERROR.*compilation failed/i, location: 'Source code', desc: 'Compilation error', rec: 'Fix syntax errors in source code' },
      { regex: /ERROR.*Failed to execute goal/i, location: 'pom.xml', desc: 'Maven goal execution failed', rec: 'Check Maven configuration and plugins' }
    ];

    for (const pattern of patterns) {
      if (pattern.regex.test(buildLog)) {
        return {
          location: pattern.location,
          description: pattern.desc,
          recommendation: pattern.rec,
          fullLog: buildLog.substring(Math.max(0, buildLog.length - 2000)) // Last 2000 chars
        };
      }
    }

    // Default error
    return {
      location: 'Dockerfile',
      description: 'Build failed with unknown error',
      recommendation: 'Review full build logs for details',
      fullLog: buildLog.substring(Math.max(0, buildLog.length - 2000))
    };
  }

  /**
   * Extract service name from error message
   */
  private extractServiceFromError(errorMessage: string): string | null {
    const match = errorMessage.match(/service\s+['"]?(\S+)['"]?/i);
    return match ? match[1] : null;
  }

  /**
   * Extract clean error message
   */
  private extractErrorMessage(rawError: string): string {
    // Remove Docker command output noise
    const lines = rawError.split('\n').filter(line =>
      !line.includes('Command failed:') &&
      !line.includes('docker-compose') &&
      line.trim().length > 0
    );
    return lines.slice(0, 5).join('\n'); // First 5 meaningful lines
  }

  /**
   * Suggest build fix based on error
   */
  private suggestBuildFix(errorMessage: string): string {
    if (errorMessage.includes('port') && errorMessage.includes('already allocated')) {
      return 'Port conflict detected. Stop conflicting services or change ports in docker-compose.yml';
    }
    if (errorMessage.includes('network') || errorMessage.includes('connection refused')) {
      return 'Network issue detected. Check Docker network configuration';
    }
    if (errorMessage.includes('memory') || errorMessage.includes('OOM')) {
      return 'Out of memory. Increase Docker memory limit in Docker Desktop settings';
    }
    if (errorMessage.includes('timeout')) {
      return 'Build timeout. Increase timeout or optimize build process';
    }
    return 'Review build logs and fix compilation/configuration errors';
  }

  /**
   * Suggest health fix based on logs
   */
  private suggestHealthFix(logs: string): string {
    if (logs.includes('Connection refused') || logs.includes('Failed to connect')) {
      return 'Database or dependency service not ready. Check service dependencies and health checks';
    }
    if (logs.includes('Port') && logs.includes('already in use')) {
      return 'Port conflict. Change service port or stop conflicting process';
    }
    if (logs.includes('permission denied') || logs.includes('access denied')) {
      return 'Permission issue. Check file permissions and user configuration';
    }
    if (logs.includes('OOM') || logs.includes('Out of memory')) {
      return 'Out of memory. Increase container memory limits';
    }
    if (logs.includes('404') || logs.includes('Not Found')) {
      return 'Resource not found. Check file paths and URLs';
    }
    return 'Review service logs and fix runtime errors';
  }
}

export default new BuildValidator();
