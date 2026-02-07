import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import yaml from 'js-yaml';
import dotArchitectureParser from '../services/dotArchitectureParser';
import { AngularMicroFrontendGenerator } from '../generators/AngularMicroFrontendGenerator';
import { SpringBootServiceGenerator } from '../generators/SpringBootServiceGenerator';
import openshiftDeploymentService from '../services/openshiftDeploymentService';
import logger from '../utils/logger';

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.dot') || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only .dot files are allowed'));
    }
  }
});

/**
 * POST /api/dot-migration/upload
 * Upload and parse DOT architecture file
 */
router.post('/upload', upload.single('dotFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    logger.info('DOT file uploaded', { filePath, originalName: req.file.originalname });

    // Parse the DOT file
    const architecture = await dotArchitectureParser.parseDotFile(filePath);

    // Convert to migration plan
    const migrationPlan = dotArchitectureParser.architectureToMigrationPlan(architecture);

    // Clean up uploaded file
    await fs.remove(filePath);

    res.json({
      success: true,
      architecture,
      migrationPlan,
      message: 'DOT file parsed successfully'
    });

  } catch (error: any) {
    logger.error('Error parsing DOT file', { error: error.message });
    res.status(500).json({
      error: 'Failed to parse DOT file',
      details: error.message
    });
  }
});

/**
 * POST /api/dot-migration/generate
 * Generate microservices and micro-frontends from DOT architecture
 */
router.post('/generate', async (req, res) => {
  try {
    const { architecture, migrationPlan } = req.body;

    if (!architecture || !migrationPlan) {
      return res.status(400).json({ error: 'Missing architecture or migration plan' });
    }

    const migrationId = uuidv4();
    const workspaceDir = path.join(process.cwd(), 'workspace', migrationId, 'output');

    logger.info('Starting DOT-based migration', { migrationId });

    // Create workspace directories
    await fs.ensureDir(path.join(workspaceDir, 'microservices'));
    await fs.ensureDir(path.join(workspaceDir, 'micro-frontends'));

    // Generate microservices
    const serviceGenerator = new SpringBootServiceGenerator();
    for (const service of migrationPlan.microservices) {
      logger.info('Generating microservice', { serviceName: service.name });
      await serviceGenerator.generateService(
        path.join(workspaceDir, 'microservices'),
        {
          name: service.name,
          domain: service.name.replace(/-/g, ''),
          port: service.port,
          entities: service.entities || []
        }
      );
    }

    // Generate micro-frontends
    const mfeGenerator = new AngularMicroFrontendGenerator();
    for (const mfe of migrationPlan.microFrontends) {
      logger.info('Generating micro-frontend', { mfeName: mfe.name });
      await mfeGenerator.generateMicroFrontend(
        path.join(workspaceDir, 'micro-frontends'),
        {
          name: mfe.name,
          port: mfe.port,
          isHost: mfe.isHost || false,
          routes: mfe.routes || [],
          components: mfe.components || []
        }
      );
    }

    // Generate deployment files
    await generateDockerCompose(workspaceDir, migrationPlan);
    await generateReadme(workspaceDir, migrationPlan);

    res.json({
      success: true,
      migrationId,
      workspaceDir,
      generated: {
        microservices: migrationPlan.microservices.length,
        microFrontends: migrationPlan.microFrontends.length
      },
      message: 'Code generated successfully from DOT architecture'
    });

  } catch (error: any) {
    logger.error('Error generating from DOT', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate code',
      details: error.message
    });
  }
});

/**
 * POST /api/dot-migration/generate-and-deploy
 * Parse DOT file, generate code, and deploy
 */
router.post('/generate-and-deploy', upload.single('dotFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No DOT file uploaded' });
    }

    const filePath = req.file.path;
    const migrationId = uuidv4();

    logger.info('Starting full DOT migration pipeline', { migrationId });

    // Step 1: Parse DOT file
    const architecture = await dotArchitectureParser.parseDotFile(filePath);
    const migrationPlan = dotArchitectureParser.architectureToMigrationPlan(architecture);

    // Step 2: Generate code
    const workspaceDir = path.join(process.cwd(), 'workspace', migrationId, 'output');
    await fs.ensureDir(path.join(workspaceDir, 'microservices'));
    await fs.ensureDir(path.join(workspaceDir, 'micro-frontends'));

    const serviceGenerator = new SpringBootServiceGenerator();
    for (const service of migrationPlan.microservices) {
      await serviceGenerator.generateService(
        path.join(workspaceDir, 'microservices'),
        {
          name: service.name,
          domain: service.name.replace(/-/g, ''),
          port: service.port,
          entities: service.entities || []
        }
      );
    }

    const mfeGenerator = new AngularMicroFrontendGenerator();
    for (const mfe of migrationPlan.microFrontends) {
      await mfeGenerator.generateMicroFrontend(
        path.join(workspaceDir, 'micro-frontends'),
        {
          name: mfe.name,
          port: mfe.port,
          isHost: mfe.isHost || false,
          routes: mfe.routes || [],
          components: mfe.components || []
        }
      );
    }

    await generateDockerCompose(workspaceDir, migrationPlan);
    await generateReadme(workspaceDir, migrationPlan);

    // Step 3: Deploy
    const deployment = await openshiftDeploymentService.startDeployment({
      migrationId,
      namespace: `eurobank-${migrationId.substring(0, 8)}`,
      services: migrationPlan.microservices.map(s => s.name),
      microFrontends: migrationPlan.microFrontends.map(m => m.name),
      demoMode: true
    });

    // Clean up
    await fs.remove(filePath);

    res.json({
      success: true,
      migrationId,
      deployment,
      architecture: {
        appName: migrationPlan.appName,
        microservices: migrationPlan.microservices.length,
        microFrontends: migrationPlan.microFrontends.length
      },
      message: 'Migration completed successfully'
    });

  } catch (error: any) {
    logger.error('Error in DOT migration pipeline', { error: error.message });
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
});

/**
 * Generate docker-compose.yml
 */
async function generateDockerCompose(workspaceDir: string, plan: any): Promise<void> {
  const services: any = {};

  // Add databases
  plan.microservices.forEach((service: any, index: number) => {
    const dbName = `postgres-${service.name}`;
    services[dbName] = {
      image: 'postgres:15-alpine',
      environment: {
        POSTGRES_DB: service.database || `${service.name}_db`,
        POSTGRES_USER: 'eurobank',
        POSTGRES_PASSWORD: 'eurobank123'
      },
      ports: [`${5432 + index}:5432`]
    };
  });

  // Add microservices
  plan.microservices.forEach((service: any) => {
    services[service.name] = {
      build: `./microservices/${service.name}`,
      ports: [`${service.port}:8080`],
      environment: {
        SPRING_DATASOURCE_URL: `jdbc:postgresql://postgres-${service.name}:5432/${service.database}`,
        SPRING_DATASOURCE_USERNAME: 'eurobank',
        SPRING_DATASOURCE_PASSWORD: 'eurobank123'
      },
      depends_on: [`postgres-${service.name}`]
    };
  });

  // Add micro-frontends
  plan.microFrontends.forEach((mfe: any) => {
    services[mfe.name] = {
      build: `./micro-frontends/${mfe.name}`,
      ports: [`${mfe.port}:80`]
    };
  });

  const compose = {
    version: '3.8',
    services
  };

  await fs.writeFile(
    path.join(workspaceDir, 'docker-compose.yml'),
    `# Generated from DOT architecture\n` +
    yaml.dump(compose),
    'utf-8'
  );
}

/**
 * Generate README
 */
async function generateReadme(workspaceDir: string, plan: any): Promise<void> {
  const readme = `# ${plan.appName} - Generated Architecture

## Overview

This application was automatically generated from a DOT architecture file.

## Architecture

- **Microservices**: ${plan.microservices.length}
- **Micro-Frontends**: ${plan.microFrontends.length}
- **Databases**: ${plan.databases?.length || plan.microservices.length}

## Microservices

${plan.microservices.map((s: any) => `- **${s.displayName}**: Port ${s.port}`).join('\n')}

## Micro-Frontends

${plan.microFrontends.map((m: any) => `- **${m.displayName}**: Port ${m.port}`).join('\n')}

## Getting Started

### Using Docker Compose

\`\`\`bash
docker-compose up -d
\`\`\`

### Access Applications

- Shell: http://localhost:4200
${plan.microFrontends.filter((m: any) => !m.isHost).map((m: any) =>
  `- ${m.displayName}: http://localhost:${m.port}`
).join('\n')}

## API Endpoints

${plan.microservices.map((s: any) => `
### ${s.displayName}
Base URL: http://localhost:${s.port}

${s.endpoints?.map((e: any) => `- ${e.method} ${e.path}`).join('\n') || ''}
`).join('\n')}

---

Generated by Banking Migration Platform
`;

  await fs.writeFile(path.join(workspaceDir, 'README.md'), readme, 'utf-8');
}

export default router;
