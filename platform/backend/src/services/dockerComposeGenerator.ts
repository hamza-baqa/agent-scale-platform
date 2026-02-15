import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import logger from '../utils/logger';

/**
 * Docker Compose Generator
 *
 * Generates complete docker-compose.yml file to orchestrate:
 * - Backend microservices (Spring Boot)
 * - Frontend micro-frontends (Angular)
 * - PostgreSQL databases (one per service)
 * - Supporting infrastructure (Redis, RabbitMQ, API Gateway)
 */

interface ServiceConfig {
  name: string;
  port: number;
  database?: string;
}

interface MicroFrontendConfig {
  name: string;
  port: number;
}

interface DockerComposeConfig {
  services: ServiceConfig[];
  microFrontends: MicroFrontendConfig[];
  includeRedis?: boolean;
  includeRabbitMQ?: boolean;
  includeApiGateway?: boolean;
}

export class DockerComposeGenerator {

  async generateDockerCompose(outputPath: string, config: DockerComposeConfig): Promise<void> {
    logger.info('Generating docker-compose.yml', { services: config.services.length, mfes: config.microFrontends.length });

    const compose: any = {
      version: '3.8',
      services: {},
      networks: {
        'banque-network': {
          driver: 'bridge'
        }
      },
      volumes: {}
    };

    // Add PostgreSQL databases for each service
    config.services.forEach(service => {
      if (service.database) {
        const dbName = `postgres-${service.name}`;
        compose.services[dbName] = {
          image: 'postgres:15-alpine',
          container_name: dbName,
          environment: {
            POSTGRES_DB: service.database,
            POSTGRES_USER: 'banque',
            POSTGRES_PASSWORD: 'banque123'
          },
          ports: [`${5431 + (service.port - 8080)}:5432`],
          volumes: [`${dbName}-data:/var/lib/postgresql/data`],
          networks: ['banque-network'],
          healthcheck: {
            test: ['CMD-SHELL', 'pg_isready -U banque'],
            interval: '10s',
            timeout: '5s',
            retries: 5
          }
        };
        compose.volumes[`${dbName}-data`] = {};
      }
    });

    // Add Redis if enabled
    if (config.includeRedis) {
      compose.services['redis'] = {
        image: 'redis:7-alpine',
        container_name: 'redis',
        ports: ['6379:6379'],
        networks: ['banque-network'],
        command: 'redis-server --appendonly yes',
        volumes: ['redis-data:/data'],
        healthcheck: {
          test: ['CMD', 'redis-cli', 'ping'],
          interval: '10s',
          timeout: '5s',
          retries: 5
        }
      };
      compose.volumes['redis-data'] = {};
    }

    // Add RabbitMQ if enabled
    if (config.includeRabbitMQ) {
      compose.services['rabbitmq'] = {
        image: 'rabbitmq:3-management-alpine',
        container_name: 'rabbitmq',
        ports: ['5672:5672', '15672:15672'],
        networks: ['banque-network'],
        environment: {
          RABBITMQ_DEFAULT_USER: 'banque',
          RABBITMQ_DEFAULT_PASS: 'banque123'
        },
        volumes: ['rabbitmq-data:/var/lib/rabbitmq'],
        healthcheck: {
          test: ['CMD', 'rabbitmq-diagnostics', 'ping'],
          interval: '10s',
          timeout: '5s',
          retries: 5
        }
      };
      compose.volumes['rabbitmq-data'] = {};
    }

    // Add backend microservices
    config.services.forEach(service => {
      const dbHost = service.database ? `postgres-${service.name}` : undefined;

      compose.services[service.name] = {
        build: {
          context: `./backend/${service.name}`,
          dockerfile: 'Dockerfile'
        },
        container_name: service.name,
        ports: [`${service.port}:${service.port}`],
        environment: {
          SPRING_PROFILES_ACTIVE: 'docker',
          SERVER_PORT: service.port.toString(),
          ...(dbHost && {
            DB_HOST: dbHost,
            DB_PORT: '5432',
            DB_NAME: service.database,
            DB_USER: 'banque',
            DB_PASSWORD: 'banque123'
          }),
          ...(config.includeRedis && { REDIS_HOST: 'redis', REDIS_PORT: '6379' }),
          ...(config.includeRabbitMQ && {
            RABBITMQ_HOST: 'rabbitmq',
            RABBITMQ_PORT: '5672',
            RABBITMQ_USER: 'banque',
            RABBITMQ_PASS: 'banque123'
          })
        },
        networks: ['banque-network'],
        depends_on: this.generateDependsOn(service, config),
        healthcheck: {
          test: ['CMD', 'curl', '-f', `http://localhost:${service.port}/actuator/health`],
          interval: '30s',
          timeout: '10s',
          retries: 5,
          start_period: '60s'
        },
        restart: 'on-failure'
      };
    });

    // Add API Gateway if enabled
    if (config.includeApiGateway) {
      compose.services['api-gateway'] = {
        build: {
          context: './api-gateway',
          dockerfile: 'Dockerfile'
        },
        container_name: 'api-gateway',
        ports: ['8080:8080'],
        environment: {
          SPRING_PROFILES_ACTIVE: 'docker',
          SERVER_PORT: '8080'
        },
        networks: ['banque-network'],
        depends_on: config.services.map(s => s.name),
        healthcheck: {
          test: ['CMD', 'curl', '-f', 'http://localhost:8080/actuator/health'],
          interval: '30s',
          timeout: '10s',
          retries: 5,
          start_period: '60s'
        },
        restart: 'on-failure'
      };
    }

    // Add frontend micro-frontends
    config.microFrontends.forEach(mfe => {
      compose.services[mfe.name] = {
        build: {
          context: `./frontend/${mfe.name}`,
          dockerfile: 'Dockerfile'
        },
        container_name: mfe.name,
        ports: [`${mfe.port}:80`],
        networks: ['banque-network'],
        environment: {
          API_URL: config.includeApiGateway ? 'http://api-gateway:8080/api' : 'http://localhost:8080/api'
        },
        depends_on: config.includeApiGateway ? ['api-gateway'] : config.services.map(s => s.name),
        restart: 'on-failure'
      };
    });

    // Write docker-compose.yml
    const composeYaml = yaml.dump(compose, { indent: 2, lineWidth: 120 });
    await fs.writeFile(path.join(outputPath, 'docker-compose.yml'), composeYaml, 'utf-8');

    logger.info('docker-compose.yml generated successfully');

    // Also generate .env file for easy configuration
    await this.generateEnvFile(outputPath, config);

    // Generate docker-compose.dev.yml for development
    await this.generateDevCompose(outputPath, config);
  }

  private generateDependsOn(service: ServiceConfig, config: DockerComposeConfig): any {
    const deps: any = {};

    if (service.database) {
      deps[`postgres-${service.name}`] = { condition: 'service_healthy' };
    }

    if (config.includeRedis) {
      deps['redis'] = { condition: 'service_healthy' };
    }

    if (config.includeRabbitMQ) {
      deps['rabbitmq'] = { condition: 'service_healthy' };
    }

    return Object.keys(deps).length > 0 ? deps : undefined;
  }

  private async generateEnvFile(outputPath: string, config: DockerComposeConfig): Promise<void> {
    const envContent = `# Environment Configuration
# Generated by Agent@Scale Platform

# Database Configuration
DB_USER=banque
DB_PASSWORD=banque123

# Redis Configuration
${config.includeRedis ? 'REDIS_HOST=redis\nREDIS_PORT=6379' : ''}

# RabbitMQ Configuration
${config.includeRabbitMQ ? `RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=banque
RABBITMQ_PASS=banque123` : ''}

# API Gateway
${config.includeApiGateway ? 'API_GATEWAY_URL=http://api-gateway:8080' : ''}

# Frontend URLs
${config.microFrontends.map(mfe => `${mfe.name.toUpperCase().replace(/-/g, '_')}_URL=http://localhost:${mfe.port}`).join('\n')}

# Backend Service URLs
${config.services.map(s => `${s.name.toUpperCase().replace(/-/g, '_')}_URL=http://localhost:${s.port}`).join('\n')}
`;

    await fs.writeFile(path.join(outputPath, '.env.example'), envContent, 'utf-8');
  }

  private async generateDevCompose(outputPath: string, config: DockerComposeConfig): Promise<void> {
    const devCompose: any = {
      version: '3.8',
      services: {}
    };

    // In dev mode, mount source code as volumes for hot reload
    config.services.forEach(service => {
      devCompose.services[service.name] = {
        volumes: [
          `./${service.name}/src:/app/src`,
          `./${service.name}/target:/app/target`
        ],
        environment: {
          SPRING_DEVTOOLS_RESTART_ENABLED: 'true'
        }
      };
    });

    config.microFrontends.forEach(mfe => {
      devCompose.services[mfe.name] = {
        volumes: [
          `./${mfe.name}/src:/app/src`,
          `./${mfe.name}/node_modules:/app/node_modules`
        ],
        command: 'npm run start'
      };
    });

    const devYaml = yaml.dump(devCompose, { indent: 2, lineWidth: 120 });
    await fs.writeFile(path.join(outputPath, 'docker-compose.dev.yml'), devYaml, 'utf-8');
  }

  /**
   * Generate startup script for easy execution
   */
  async generateStartupScript(outputPath: string): Promise<void> {
    const scriptContent = `#!/bin/bash

# Startup script for Banque Application
# Generated by Agent@Scale Platform

set -e

echo "🚀 Starting Banque Application..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Detect Docker Compose command (v1 uses docker-compose, v2 uses docker compose)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

echo "📦 Using: \$DOCKER_COMPOSE"

# Build images
echo "📦 Building Docker images..."
\$DOCKER_COMPOSE build

# Start services
echo "🔧 Starting services..."
\$DOCKER_COMPOSE up -d

# Wait for health checks
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "✅ Checking service health..."
\$DOCKER_COMPOSE ps

echo ""
echo "✨ Application started successfully!"
echo ""
echo "🌐 Access URLs:"
echo "   - Shell App: http://localhost:4200"
echo "   - Auth MFE: http://localhost:4201"
echo "   - Dashboard MFE: http://localhost:4202"
echo "   - Transfers MFE: http://localhost:4203"
echo "   - Cards MFE: http://localhost:4204"
echo "   - API Gateway: http://localhost:8080"
echo "   - API Docs: http://localhost:8080/swagger-ui.html"
echo ""
echo "📊 View logs:"
echo "   \$DOCKER_COMPOSE logs -f [service-name]"
echo ""
echo "🛑 Stop application:"
echo "   \$DOCKER_COMPOSE down"
`;

    await fs.writeFile(path.join(outputPath, 'start.sh'), scriptContent, 'utf-8');
    await fs.chmod(path.join(outputPath, 'start.sh'), '755');

    logger.info('Startup script generated successfully');
  }

  /**
   * Generate stop script
   */
  async generateStopScript(outputPath: string): Promise<void> {
    const scriptContent = `#!/bin/bash

# Stop script for Banque Application

echo "🛑 Stopping Banque Application..."

# Detect Docker Compose command (v1 uses docker-compose, v2 uses docker compose)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

\$DOCKER_COMPOSE down

echo "✅ Application stopped successfully!"
`;

    await fs.writeFile(path.join(outputPath, 'stop.sh'), scriptContent, 'utf-8');
    await fs.chmod(path.join(outputPath, 'stop.sh'), '755');
  }
}

export default new DockerComposeGenerator();
