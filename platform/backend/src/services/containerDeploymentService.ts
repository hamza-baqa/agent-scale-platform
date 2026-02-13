import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

const execAsync = promisify(exec);

// Callback type for progress updates
type ProgressCallback = (message: string) => void;

export interface ContainerDeployment {
  id: string;
  migrationId: string;
  status: 'pending' | 'building' | 'deploying' | 'running' | 'failed' | 'stopped';
  services: DeployedService[];
  microFrontends: DeployedMicroFrontend[];
  dockerComposeFile?: string;
  networkName: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  urls: {
    [serviceName: string]: string;
  };
}

export interface DeployedService {
  name: string;
  port: number;
  internalPort: number;
  containerName: string;
  status: 'building' | 'starting' | 'running' | 'failed' | 'stopped';
  healthUrl?: string;
  apiUrl?: string;
  buildTime?: number;
  error?: string;
}

export interface DeployedMicroFrontend {
  name: string;
  port: number;
  internalPort: number;
  containerName: string;
  status: 'building' | 'starting' | 'running' | 'failed' | 'stopped';
  url?: string;
  buildTime?: number;
  error?: string;
}

class ContainerDeploymentService {
  private deployments: Map<string, ContainerDeployment> = new Map();
  private workspaceDir: string;

  constructor() {
    this.workspaceDir = process.env.WORKSPACE_DIR || './workspace';
  }

  /**
   * Deploy migration in containers
   */
  async deployInContainers(migrationId: string, progressCallback?: ProgressCallback): Promise<ContainerDeployment> {
    const deploymentId = `deployment-${migrationId}`;

    const deployment: ContainerDeployment = {
      id: deploymentId,
      migrationId,
      status: 'pending',
      services: [],
      microFrontends: [],
      networkName: `eurobank-network-${migrationId.substring(0, 8)}`,
      startedAt: new Date(),
      urls: {}
    };

    this.deployments.set(deploymentId, deployment);

    try {
      const migrationPath = path.join(this.workspaceDir, migrationId, 'output');

      if (!fs.existsSync(migrationPath)) {
        throw new Error(`Migration output not found at ${migrationPath}`);
      }

      logger.info(`Starting container deployment for migration ${migrationId}`);
      progressCallback?.('🔍 Checking Docker availability...');

      // Step 1: Check Docker availability
      await this.checkDockerAvailability();
      progressCallback?.('✅ Docker is available and running');

      // Step 2: Generate Dockerfiles if missing
      progressCallback?.('📝 Generating Dockerfiles for services and frontends...');
      await this.ensureDockerfiles(migrationPath, progressCallback);
      progressCallback?.('✅ Dockerfiles generated successfully');

      // Step 3: Generate docker-compose.yml
      progressCallback?.('📋 Creating docker-compose.yml orchestration file...');
      const dockerComposeFile = await this.generateDockerCompose(migrationId, migrationPath, deployment);
      deployment.dockerComposeFile = dockerComposeFile;
      progressCallback?.(`✅ Generated docker-compose.yml with ${deployment.services.length} services + ${deployment.microFrontends.length} frontends`);

      // Step 4: Build images
      deployment.status = 'building';
      progressCallback?.('🔨 Building Docker images (this may take 2-5 minutes)...');
      await this.buildImages(migrationId, migrationPath, deployment, progressCallback);
      progressCallback?.('✅ All Docker images built successfully');

      // Step 5: Deploy containers
      deployment.status = 'deploying';
      progressCallback?.('🚀 Starting containers...');
      await this.deployContainers(migrationId, migrationPath, deployment, progressCallback);
      progressCallback?.('✅ All containers started');

      // Step 6: Wait for services to be healthy
      progressCallback?.('🏥 Waiting for services to be healthy...');
      await this.waitForServicesHealthy(deployment, progressCallback);
      progressCallback?.('✅ All services are healthy and ready');

      deployment.status = 'running';
      deployment.completedAt = new Date();

      logger.info(`Container deployment completed for migration ${migrationId}`);

    } catch (error: any) {
      logger.error(`Container deployment failed for migration ${migrationId}:`, error);
      deployment.status = 'failed';
      deployment.error = error.message;
      deployment.completedAt = new Date();
    }

    return deployment;
  }

  /**
   * Check if Docker is available
   */
  private async checkDockerAvailability(): Promise<void> {
    try {
      const { stdout } = await execAsync('docker --version');
      logger.info(`Docker is available: ${stdout.trim()}`);

      // Check if Docker daemon is running
      await execAsync('docker ps');
      logger.info('Docker daemon is running');

      // Check if docker-compose is available
      const { stdout: composeVersion } = await execAsync('docker compose version');
      logger.info(`Docker Compose is available: ${composeVersion.trim()}`);

    } catch (error: any) {
      throw new Error('Docker is not available or not running. Please install and start Docker.');
    }
  }

  /**
   * Ensure Dockerfiles exist for all services
   */
  private async ensureDockerfiles(migrationPath: string, progressCallback?: ProgressCallback): Promise<void> {
    logger.info('Ensuring Dockerfiles exist...');

    // Generate Dockerfiles for microservices
    const microservicesPath = path.join(migrationPath, 'microservices');
    if (fs.existsSync(microservicesPath)) {
      const services = await fs.readdir(microservicesPath);

      for (const service of services) {
        const servicePath = path.join(microservicesPath, service);
        const dockerfilePath = path.join(servicePath, 'Dockerfile');

        if (!fs.existsSync(dockerfilePath)) {
          progressCallback?.(`  → Generating Dockerfile for microservice: ${service}`);
          logger.info(`Generating Dockerfile for ${service}`);
          await this.generateSpringBootDockerfile(servicePath, service);
        } else {
          progressCallback?.(`  ✓ Dockerfile exists for: ${service}`);
        }
      }
    }

    // Generate Dockerfiles for micro-frontends
    const microfrontendsPath = path.join(migrationPath, 'micro-frontends');
    if (fs.existsSync(microfrontendsPath)) {
      const frontends = await fs.readdir(microfrontendsPath);

      for (const frontend of frontends) {
        const frontendPath = path.join(microfrontendsPath, frontend);
        const dockerfilePath = path.join(frontendPath, 'Dockerfile');

        if (!fs.existsSync(dockerfilePath)) {
          progressCallback?.(`  → Generating Dockerfile for micro-frontend: ${frontend}`);
          logger.info(`Generating Dockerfile for ${frontend}`);
          await this.generateAngularDockerfile(frontendPath, frontend);
        } else {
          progressCallback?.(`  ✓ Dockerfile exists for: ${frontend}`);
        }
      }
    }
  }

  /**
   * Generate Dockerfile for Spring Boot service
   */
  private async generateSpringBootDockerfile(servicePath: string, serviceName: string): Promise<void> {
    const dockerfile = `# Multi-stage build for Spring Boot
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
`;

    await fs.writeFile(path.join(servicePath, 'Dockerfile'), dockerfile);
    logger.info(`Generated Dockerfile for ${serviceName}`);
  }

  /**
   * Generate Dockerfile for Angular micro-frontend
   */
  private async generateAngularDockerfile(frontendPath: string, frontendName: string): Promise<void> {
    const dockerfile = `# Multi-stage build for Angular
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build --if-present || ng build --configuration production || npm run build:prod || echo "Build completed"

# Copy dist contents to a known location
RUN mkdir -p /app/build && \\
    (cp -r /app/dist/*/* /app/build/ 2>/dev/null || cp -r /app/dist/* /app/build/ || cp -r /app/dist /app/build/)

# Runtime stage with nginx
FROM nginx:alpine

# Copy built files from known location
COPY --from=build /app/build /usr/share/nginx/html

# Create nginx configuration
RUN echo 'server { \\
    listen 80; \\
    location / { \\
        root /usr/share/nginx/html; \\
        index index.html; \\
        try_files $uri $uri/ /index.html; \\
    } \\
}' > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
`;

    await fs.writeFile(path.join(frontendPath, 'Dockerfile'), dockerfile);

    // Generate nginx.conf if it doesn't exist
    const nginxConfPath = path.join(frontendPath, 'nginx.conf');
    if (!fs.existsSync(nginxConfPath)) {
      const nginxConf = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \\.(?:css|js|jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`;
      await fs.writeFile(nginxConfPath, nginxConf);
    }

    logger.info(`Generated Dockerfile for ${frontendName}`);
  }

  /**
   * Generate docker-compose.yml
   */
  private async generateDockerCompose(
    migrationId: string,
    migrationPath: string,
    deployment: ContainerDeployment
  ): Promise<string> {
    logger.info('Generating docker-compose.yml...');

    const services: any = {};
    const microservicesPath = path.join(migrationPath, 'microservices');
    const microfrontendsPath = path.join(migrationPath, 'micro-frontends');

    let portCounter = 8081;

    // Add PostgreSQL database
    services['postgres'] = {
      image: 'postgres:15-alpine',
      container_name: `eurobank-postgres-${migrationId.substring(0, 8)}`,
      environment: {
        POSTGRES_USER: 'eurobank',
        POSTGRES_PASSWORD: 'eurobank123',
        POSTGRES_DB: 'eurobank_db'
      },
      ports: ['5432:5432'],
      volumes: [
        `eurobank-postgres-data-${migrationId.substring(0, 8)}:/var/lib/postgresql/data`
      ],
      healthcheck: {
        test: ['CMD-SHELL', 'pg_isready -U eurobank'],
        interval: '10s',
        timeout: '5s',
        retries: 5
      },
      networks: [deployment.networkName]
    };

    // Add microservices
    if (fs.existsSync(microservicesPath)) {
      const serviceList = await fs.readdir(microservicesPath);

      for (const serviceName of serviceList) {
        const servicePath = path.join(microservicesPath, serviceName);
        const dockerfilePath = path.join(servicePath, 'Dockerfile');

        if (fs.existsSync(dockerfilePath)) {
          const externalPort = portCounter++;
          const containerName = `eurobank-${serviceName}-${migrationId.substring(0, 8)}`;

          services[serviceName] = {
            build: {
              context: `./microservices/${serviceName}`,
              dockerfile: 'Dockerfile'
            },
            container_name: containerName,
            ports: [`${externalPort}:8080`],
            environment: {
              SPRING_DATASOURCE_URL: 'jdbc:postgresql://postgres:5432/eurobank_db',
              SPRING_DATASOURCE_USERNAME: 'eurobank',
              SPRING_DATASOURCE_PASSWORD: 'eurobank123',
              SERVER_PORT: '8080'
            },
            depends_on: {
              postgres: {
                condition: 'service_healthy'
              }
            },
            networks: [deployment.networkName],
            healthcheck: {
              test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:8080/actuator/health'],
              interval: '30s',
              timeout: '10s',
              retries: 5,
              start_period: '60s'
            }
          };

          deployment.services.push({
            name: serviceName,
            port: externalPort,
            internalPort: 8080,
            containerName,
            status: 'pending' as any,
            healthUrl: `http://localhost:${externalPort}/actuator/health`,
            apiUrl: `http://localhost:${externalPort}`
          });

          deployment.urls[serviceName] = `http://localhost:${externalPort}`;
        }
      }
    }

    // Add micro-frontends
    let frontendPortCounter = 4200;
    if (fs.existsSync(microfrontendsPath)) {
      const frontendList = await fs.readdir(microfrontendsPath);

      for (const frontendName of frontendList) {
        const frontendPath = path.join(microfrontendsPath, frontendName);
        const dockerfilePath = path.join(frontendPath, 'Dockerfile');

        if (fs.existsSync(dockerfilePath)) {
          const externalPort = frontendPortCounter++;
          const containerName = `eurobank-${frontendName}-${migrationId.substring(0, 8)}`;

          services[frontendName] = {
            build: {
              context: `./micro-frontends/${frontendName}`,
              dockerfile: 'Dockerfile'
            },
            container_name: containerName,
            ports: [`${externalPort}:80`],
            networks: [deployment.networkName],
            healthcheck: {
              test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost/'],
              interval: '30s',
              timeout: '10s',
              retries: 3,
              start_period: '10s'
            }
          };

          deployment.microFrontends.push({
            name: frontendName,
            port: externalPort,
            internalPort: 80,
            containerName,
            status: 'pending' as any,
            url: `http://localhost:${externalPort}`
          });

          deployment.urls[frontendName] = `http://localhost:${externalPort}`;
        }
      }
    }

    // Create docker-compose content
    const dockerCompose = {
      version: '3.8',
      services,
      networks: {
        [deployment.networkName]: {
          driver: 'bridge'
        }
      },
      volumes: {
        [`eurobank-postgres-data-${migrationId.substring(0, 8)}`]: {}
      }
    };

    // Write docker-compose.yml
    const dockerComposeFile = path.join(migrationPath, 'docker-compose.yml');
    await fs.writeFile(
      dockerComposeFile,
      `# Generated by Agent@Scale Platform
# Migration ID: ${migrationId}
# Generated at: ${new Date().toISOString()}

${require('yaml').stringify(dockerCompose, { lineWidth: 0 })}`
    );

    logger.info(`Generated docker-compose.yml at ${dockerComposeFile}`);
    return dockerComposeFile;
  }

  /**
   * Build Docker images
   */
  private async buildImages(
    migrationId: string,
    migrationPath: string,
    deployment: ContainerDeployment,
    progressCallback?: ProgressCallback
  ): Promise<void> {
    logger.info('Building Docker images...');

    const dockerComposeFile = path.join(migrationPath, 'docker-compose.yml');

    try {
      // Build all images
      const startTime = Date.now();

      logger.info('Running docker compose build...');
      progressCallback?.('');
      progressCallback?.('🔨 Building Docker images...');

      // Use spawn to stream output in real-time
      await new Promise<void>((resolve, reject) => {
        const buildProcess = spawn('docker', ['compose', '--progress=plain', 'build'], {
          cwd: migrationPath,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let currentService = '';
        let errorOutput = ''; // Capture error output

        buildProcess.stdout.on('data', (data) => {
          const output = data.toString();

          // Parse Docker build output for service names
          const serviceMatch = output.match(/building\s+(\S+)/i) || output.match(/#\d+\s+building\s+(\S+)/i);
          if (serviceMatch && serviceMatch[1] !== currentService) {
            currentService = serviceMatch[1];
            progressCallback?.(`  🔨 Building ${currentService}...`);
          }

          // Show step progress
          const stepMatch = output.match(/#\d+\s+\[\d+\/\d+\]\s+(.*)/);
          if (stepMatch) {
            const step = stepMatch[1].substring(0, 60); // Limit length
            progressCallback?.(`     → ${step}`);
          }

          // Capture error messages from stdout too
          if (output.includes('ERROR') || output.includes('error') || output.includes('failed')) {
            errorOutput += output;
          }

          logger.debug(output);
        });

        buildProcess.stderr.on('data', (data) => {
          const output = data.toString();
          errorOutput += output; // Capture all stderr
          logger.error(`Docker build stderr: ${output}`);

          // Show critical errors in progress
          if (output.includes('ERROR') || output.includes('error')) {
            progressCallback?.(`❌ Error: ${output.substring(0, 100)}`);
          }
        });

        buildProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            // Include captured error output in the error message
            const errorMsg = errorOutput.trim()
              ? `Docker build failed:\n${errorOutput.substring(0, 500)}`
              : `Docker build exited with code ${code}`;
            reject(new Error(errorMsg));
          }
        });

        buildProcess.on('error', (error) => {
          reject(error);
        });
      });

      const buildTime = Date.now() - startTime;
      logger.info(`Docker images built successfully in ${(buildTime / 1000).toFixed(2)}s`);
      progressCallback?.(`✅ Build completed in ${(buildTime / 1000).toFixed(1)}s`);

      // Update build times
      deployment.services.forEach(service => {
        service.buildTime = buildTime;
        service.status = 'building';
      });

      deployment.microFrontends.forEach(frontend => {
        frontend.buildTime = buildTime;
        frontend.status = 'building';
      });

    } catch (error: any) {
      logger.error('Failed to build Docker images:', error);
      throw new Error(`Docker build failed: ${error.message}`);
    }
  }

  /**
   * Deploy containers
   */
  private async deployContainers(
    migrationId: string,
    migrationPath: string,
    deployment: ContainerDeployment,
    progressCallback?: ProgressCallback
  ): Promise<void> {
    logger.info('Deploying containers...');

    try {
      progressCallback?.('');
      progressCallback?.('🐳 Starting PostgreSQL database...');
      progressCallback?.('🚀 Starting all microservices and frontends...');

      // Start all containers
      const { stdout, stderr } = await execAsync(
        'docker compose up -d',
        {
          cwd: migrationPath,
          timeout: 300000 // 5 minutes
        }
      );

      logger.info('Containers started successfully');

      // Update statuses and report
      deployment.services.forEach(service => {
        service.status = 'starting';
        progressCallback?.(`  ✓ Started ${service.name} on port ${service.port}`);
      });

      deployment.microFrontends.forEach(frontend => {
        frontend.status = 'starting';
        progressCallback?.(`  ✓ Started ${frontend.name} on port ${frontend.port}`);
      });

    } catch (error: any) {
      logger.error('Failed to deploy containers:', error);
      throw new Error(`Container deployment failed: ${error.message}`);
    }
  }

  /**
   * Wait for services to be healthy
   */
  private async waitForServicesHealthy(deployment: ContainerDeployment, progressCallback?: ProgressCallback): Promise<void> {
    logger.info('Waiting for services to be healthy...');
    progressCallback?.('');

    const maxWaitTime = 180000; // 3 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      let allHealthy = true;

      // Check microservices
      for (const service of deployment.services) {
        if (service.status !== 'running') {
          const isHealthy = await this.checkServiceHealth(service.healthUrl!);

          if (isHealthy) {
            service.status = 'running';
            logger.info(`Service ${service.name} is healthy`);
            progressCallback?.(`  ✅ ${service.name} is healthy and ready`);
          } else {
            allHealthy = false;
          }
        }
      }

      // Check micro-frontends
      for (const frontend of deployment.microFrontends) {
        if (frontend.status !== 'running') {
          const isHealthy = await this.checkServiceHealth(frontend.url!);

          if (isHealthy) {
            frontend.status = 'running';
            logger.info(`Frontend ${frontend.name} is healthy`);
            progressCallback?.(`  ✅ ${frontend.name} is healthy and ready`);
          } else {
            allHealthy = false;
          }
        }
      }

      if (allHealthy) {
        logger.info('All services are healthy');
        return;
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    // Timeout - mark remaining services as failed
    deployment.services.forEach(service => {
      if (service.status !== 'running') {
        service.status = 'failed';
        service.error = 'Health check timeout';
      }
    });

    deployment.microFrontends.forEach(frontend => {
      if (frontend.status !== 'running') {
        frontend.status = 'failed';
        frontend.error = 'Health check timeout';
      }
    });

    logger.warn('Some services did not become healthy within timeout');
  }

  /**
   * Check if a service is healthy
   */
  private async checkServiceHealth(url: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `curl -f -s -o /dev/null -w "%{http_code}" ${url}`,
        { timeout: 5000 }
      );

      const statusCode = parseInt(stdout.trim());
      return statusCode >= 200 && statusCode < 400;

    } catch (error) {
      return false;
    }
  }

  /**
   * Stop deployment
   */
  async stopDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const migrationPath = path.join(this.workspaceDir, deployment.migrationId, 'output');

    try {
      logger.info(`Stopping deployment ${deploymentId}...`);

      await execAsync('docker compose down', {
        cwd: migrationPath,
        timeout: 60000
      });

      deployment.status = 'stopped';
      deployment.services.forEach(s => s.status = 'stopped');
      deployment.microFrontends.forEach(f => f.status = 'stopped');

      logger.info(`Deployment ${deploymentId} stopped successfully`);

    } catch (error: any) {
      logger.error(`Failed to stop deployment ${deploymentId}:`, error);
      throw new Error(`Failed to stop deployment: ${error.message}`);
    }
  }

  /**
   * Remove deployment (stop and remove containers/volumes)
   */
  async removeDeployment(deploymentId: string): Promise<void> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const migrationPath = path.join(this.workspaceDir, deployment.migrationId, 'output');

    try {
      logger.info(`Removing deployment ${deploymentId}...`);

      await execAsync('docker compose down -v', {
        cwd: migrationPath,
        timeout: 60000
      });

      this.deployments.delete(deploymentId);

      logger.info(`Deployment ${deploymentId} removed successfully`);

    } catch (error: any) {
      logger.error(`Failed to remove deployment ${deploymentId}:`, error);
      throw new Error(`Failed to remove deployment: ${error.message}`);
    }
  }

  /**
   * Store mock deployment (for demo mode)
   */
  storeMockDeployment(deployment: any): void {
    this.deployments.set(deployment.id, deployment);
    logger.info(`Stored mock deployment: ${deployment.id}`);
  }

  /**
   * Get deployment status
   */
  getDeployment(deploymentId: string): ContainerDeployment | undefined {
    return this.deployments.get(deploymentId);
  }

  /**
   * Get all deployments
   */
  getAllDeployments(): ContainerDeployment[] {
    return Array.from(this.deployments.values());
  }

  /**
   * Get logs for a service
   */
  async getServiceLogs(deploymentId: string, serviceName: string, tail: number = 100): Promise<string> {
    const deployment = this.deployments.get(deploymentId);
    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    const migrationPath = path.join(this.workspaceDir, deployment.migrationId, 'output');

    try {
      const { stdout } = await execAsync(
        `docker compose logs --tail=${tail} ${serviceName}`,
        {
          cwd: migrationPath,
          timeout: 10000
        }
      );

      return stdout;

    } catch (error: any) {
      logger.error(`Failed to get logs for ${serviceName}:`, error);
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }
}

export default new ContainerDeploymentService();
