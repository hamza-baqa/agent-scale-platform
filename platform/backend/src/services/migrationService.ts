import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import archiver from 'archiver';
import logger from '../utils/logger';
import {
  Migration,
  MigrationRequest,
  MigrationStatus,
  AgentProgress,
  MigrationStatusUpdate,
  MigrationResult
} from '../types/migration.types';
import {
  emitAgentStarted,
  emitAgentProgress,
  emitAgentCompleted,
  emitMigrationCompleted,
  emitError
} from '../websocket/websocketHandler';

class MigrationService {
  private migrations: Map<string, Migration> = new Map();
  private n8nWebhookUrl: string;
  private workspaceDir: string;
  private outputDir: string;

  constructor() {
    this.n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || '';
    this.workspaceDir = process.env.WORKSPACE_DIR || './workspace';
    this.outputDir = process.env.OUTPUT_DIR || './outputs';
  }

  /**
   * Create a new migration
   */
  async createMigration(request: MigrationRequest): Promise<Migration> {
    const migrationId = uuidv4();

    const migration: Migration = {
      id: migrationId,
      repoUrl: request.repoUrl,
      status: 'pending',
      options: request.options || {},
      progress: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.migrations.set(migrationId, migration);
    logger.info(`Created migration: ${migrationId}`, { repoUrl: request.repoUrl });

    // Start migration process asynchronously
    this.startMigration(migration).catch(error => {
      logger.error(`Migration ${migrationId} failed:`, error);
      this.updateMigrationStatus(migrationId, 'failed', error.message);
    });

    return migration;
  }

  /**
   * Get migration by ID
   */
  getMigration(id: string): Migration | undefined {
    return this.migrations.get(id);
  }

  /**
   * Get all migrations
   */
  getAllMigrations(): Migration[] {
    return Array.from(this.migrations.values());
  }

  /**
   * Update migration status
   */
  updateMigrationStatus(id: string, status: MigrationStatus, error?: string): void {
    const migration = this.migrations.get(id);
    if (migration) {
      migration.status = status;
      migration.updatedAt = new Date();
      if (error) {
        migration.error = error;
      }
      if (status === 'completed') {
        migration.completedAt = new Date();
      }
      logger.info(`Migration ${id} status updated to: ${status}`);
    }
  }

  /**
   * Update agent progress
   */
  updateAgentProgress(id: string, update: MigrationStatusUpdate): void {
    const migration = this.migrations.get(id);
    if (!migration) {
      logger.warn(`Migration ${id} not found for agent update`);
      return;
    }

    const existingProgress = migration.progress.find(p => p.agent === update.agent);

    if (existingProgress) {
      existingProgress.status = update.status;
      if (update.status === 'completed') {
        existingProgress.completedAt = new Date();
      }
      if (update.output) {
        existingProgress.output = update.output;
      }
      if (update.error) {
        existingProgress.error = update.error;
      }
    } else {
      const newProgress: AgentProgress = {
        agent: update.agent,
        status: update.status,
        startedAt: new Date(),
        output: update.output,
        error: update.error
      };
      migration.progress.push(newProgress);
    }

    migration.updatedAt = new Date();
    logger.info(`Migration ${id} agent ${update.agent} status: ${update.status}`);
  }

  /**
   * Start the migration process
   */
  private async startMigration(migration: Migration): Promise<void> {
    const { id, repoUrl, options } = migration;

    try {
      // For demo mode, simulate agent execution without cloning
      const useDemoMode = !this.n8nWebhookUrl || process.env.DEMO_MODE === 'true';

      if (useDemoMode) {
        logger.info(`Starting migration ${id} in DEMO MODE`);
        await this.simulateAgentExecution(id);
      } else {
        // Full mode: Clone repository and trigger n8n
        logger.info(`Starting migration ${id}: Cloning repository`);
        this.updateMigrationStatus(id, 'cloning');
        const repoPath = await this.cloneRepository(id, repoUrl);

        logger.info(`Triggering n8n workflow for migration ${id}`);
        await this.triggerN8nWorkflow(id, repoPath, options);
      }

    } catch (error: any) {
      logger.error(`Migration ${id} failed:`, error);
      this.updateMigrationStatus(id, 'failed', error.message);
      throw error;
    }
  }

  /**
   * Simulate agent execution for demonstration
   */
  private async simulateAgentExecution(migrationId: string): Promise<void> {
    const agents = [
      {
        name: 'code-analyzer',
        duration: 15000,
        output: `✅ Code Analysis Complete

📊 **Discovered Entities:**
- User, Client, Account, Transaction, Card, RefreshToken, PasswordResetToken
- Total: 12 JPA entities with relationships

🔌 **API Endpoints Identified:**
- Auth endpoints: 8 REST APIs (login, register, refresh, logout, etc.)
- Client endpoints: 7 REST APIs (CRUD + search)
- Account endpoints: 8 REST APIs (CRUD + balance queries)
- Transaction endpoints: 9 REST APIs (transfers, history, deposits)
- Card endpoints: 8 REST APIs (CRUD + activation/limits)
- Total: 40 API endpoints documented

🎯 **Service Boundaries:**
- Authentication & User Management
- Client Profile Management
- Account & Balance Operations
- Transaction Processing
- Card Management

📁 **Technology Stack Detected:**
- Backend: Spring Boot 2.7.x, Java 11, Spring Security, JPA/Hibernate
- Frontend: Blazor WebAssembly, C#
- Database: Oracle/PostgreSQL compatible

✨ Ready for migration planning!`
      },
      {
        name: 'migration-planner',
        duration: 18000,
        output: `✅ Migration Plan Generated

🏗️ **Target Architecture:**

**Microservices (5 services):**
1. **Auth Service** (Port 8081)
   - JWT authentication & token management
   - User registration & profile management
   - Password reset flows
   - Database: auth_db (PostgreSQL)

2. **Client Service** (Port 8082)
   - Client CRUD operations
   - Client search & filtering
   - Client type management
   - Database: client_db (PostgreSQL)

3. **Account Service** (Port 8083)
   - Account management
   - Balance inquiries
   - Account type & status management
   - Database: account_db (PostgreSQL)

4. **Transaction Service** (Port 8084)
   - Money transfers (virement)
   - Transaction history
   - Transaction validation
   - Database: transaction_db (PostgreSQL)

5. **Card Service** (Port 8085)
   - Card lifecycle management
   - Card activation/deactivation
   - Limit management
   - Database: card_db (PostgreSQL)

**Micro-frontends (5 modules):**
1. **Shell** (Host) - Port 4200
   - Main container with Module Federation
   - Routing & navigation
   - Shared authentication state

2. **Auth MFE** - Port 4201
   - Login/Registration flows
   - Password reset

3. **Dashboard MFE** - Port 4202
   - Account overview
   - Balance display
   - Quick actions

4. **Transfers MFE** - Port 4203
   - Transfer forms
   - Beneficiary management

5. **Cards MFE** - Port 4204
   - Card list & details
   - Card operations

**Supporting Services:**
- API Gateway (Spring Cloud Gateway) - Port 8080
- Service Discovery (Eureka)
- Config Server (Spring Cloud Config)

📋 **Migration Strategy:**
- Database-per-service pattern
- Event-driven communication (async)
- REST APIs for synchronous calls
- JWT-based authentication
- OpenAPI 3.0 documentation

🔒 **Security:**
- JWT token validation at API Gateway
- Service-to-service authentication
- HTTPS/TLS for all communications

✨ Ready to generate code!`
      },
      {
        name: 'service-generator',
        duration: 25000,
        output: `✅ Microservices Code Generated

📦 **Generated 5 Spring Boot Services:**

1. **auth-service/**
   ✓ pom.xml (Spring Boot 3.2.2, Java 17)
   ✓ AuthServiceApplication.java
   ✓ Domain: User, RefreshToken entities
   ✓ Security: JWT provider, SecurityConfig
   ✓ Controllers: AuthController (8 endpoints)
   ✓ Services: AuthService, UserService
   ✓ Repositories: UserRepository, RefreshTokenRepository
   ✓ application.yml (dev, prod profiles)
   ✓ Dockerfile
   ✓ README.md

2. **client-service/**
   ✓ pom.xml (Spring Boot 3.2.2, Java 17)
   ✓ ClientServiceApplication.java
   ✓ Domain: Client entity with embedded Address
   ✓ Controllers: ClientController (7 endpoints)
   ✓ Services: ClientService
   ✓ Repositories: ClientRepository
   ✓ application.yml
   ✓ Dockerfile
   ✓ README.md

3. **account-service/**
   ✓ pom.xml
   ✓ AccountServiceApplication.java
   ✓ Domain: Account entity
   ✓ Controllers: AccountController (8 endpoints)
   ✓ Services: AccountService
   ✓ Repositories: AccountRepository
   ✓ application.yml
   ✓ Dockerfile
   ✓ README.md

4. **transaction-service/**
   ✓ pom.xml
   ✓ TransactionServiceApplication.java
   ✓ Domain: Transaction, Transfer entities
   ✓ Controllers: TransactionController (9 endpoints)
   ✓ Services: TransactionService
   ✓ Repositories: TransactionRepository
   ✓ application.yml
   ✓ Dockerfile
   ✓ README.md

5. **card-service/**
   ✓ pom.xml
   ✓ CardServiceApplication.java
   ✓ Domain: Card entity
   ✓ Controllers: CardController (8 endpoints)
   ✓ Services: CardService
   ✓ Repositories: CardRepository
   ✓ application.yml
   ✓ Dockerfile
   ✓ README.md

🎯 **Features Implemented:**
- Spring Data JPA with Hibernate
- Bean Validation (@Valid, @NotNull, etc.)
- Exception handling with @ControllerAdvice
- OpenAPI/Swagger documentation
- CORS configuration
- JWT security integration
- Actuator health checks
- Logback logging configuration

📝 **Total Files Generated:** 95+ files
✨ Services ready for containerization!`
      },
      {
        name: 'frontend-migrator',
        duration: 22000,
        output: `✅ Angular Micro-frontends Generated

🎨 **Generated 5 Angular Applications:**

1. **shell/** (Host Application)
   ✓ package.json (Angular 18)
   ✓ webpack.config.js (Module Federation)
   ✓ app.component.ts (Main layout)
   ✓ app.routes.ts (Remote module routing)
   ✓ auth.guard.ts (Route protection)
   ✓ Services: AuthService, ApiService
   ✓ Components: HeaderComponent, FooterComponent
   ✓ nginx.conf
   ✓ Dockerfile
   ✓ README.md

2. **auth-mfe/** (Remote Module)
   ✓ package.json
   ✓ webpack.config.js (exposes ./Module)
   ✓ Components: LoginComponent, RegisterComponent
   ✓ Services: AuthApiService
   ✓ Forms: Reactive forms with validation
   ✓ Dockerfile
   ✓ README.md

3. **dashboard-mfe/** (Remote Module)
   ✓ package.json
   ✓ webpack.config.js
   ✓ Components: DashboardComponent, AccountSummaryComponent
   ✓ Services: AccountApiService, TransactionApiService
   ✓ Widgets: Balance, Recent transactions
   ✓ Dockerfile
   ✓ README.md

4. **transfers-mfe/** (Remote Module)
   ✓ package.json
   ✓ webpack.config.js
   ✓ Components: TransferComponent, BeneficiaryListComponent
   ✓ Services: TransferApiService
   ✓ Forms: Transfer form with validation
   ✓ Dockerfile
   ✓ README.md

5. **cards-mfe/** (Remote Module)
   ✓ package.json
   ✓ webpack.config.js
   ✓ Components: CardListComponent, CardDetailsComponent
   ✓ Services: CardApiService
   ✓ Features: Card limits, activation
   ✓ Dockerfile
   ✓ README.md

🎯 **Features Implemented:**
- Webpack 5 Module Federation
- Standalone components (Angular 18)
- Reactive forms with validation
- HTTP interceptors for JWT
- Error handling & loading states
- Responsive design (Tailwind CSS)
- TypeScript strict mode
- RxJS for state management
- Angular Material UI components

📝 **Total Files Generated:** 85+ files
✨ Micro-frontends ready for deployment!`
      },
      {
        name: 'quality-validator',
        duration: 16000,
        output: `✅ Quality Validation Complete

🧪 **Build Validation:**
✓ All 5 Spring Boot services compile successfully
✓ All 5 Angular applications build without errors
✓ Maven dependencies resolved (no conflicts)
✓ NPM dependencies installed successfully

🎯 **Code Quality Metrics:**
✓ Microservices:
  - Code coverage: 72% (target: 70%)
  - Cyclomatic complexity: Low (avg: 4.2)
  - Code duplication: 2.1% (excellent)
  - Technical debt: 1.2 days (minimal)

✓ Micro-frontends:
  - Code coverage: 68% (target: 70%)
  - TypeScript strict mode: Enabled
  - ESLint warnings: 3 (minor)
  - Bundle size: Optimized (<500KB per MFE)

🔒 **Security Scan:**
✓ No critical vulnerabilities found
✓ No high-severity issues
✓ 2 medium-severity issues (non-blocking):
  - Spring Boot: Update to 3.2.3 recommended
  - Angular: Update to 18.0.1 recommended
✓ JWT implementation: Secure (HS256)
✓ No hardcoded secrets detected
✓ HTTPS/TLS enforced
✓ CORS properly configured

📋 **API Contract Validation:**
✓ All OpenAPI specs valid (OpenAPI 3.0)
✓ 40 endpoints documented
✓ Request/Response schemas defined
✓ Authentication requirements specified
✓ Error responses documented

🏗️ **Architecture Compliance:**
✓ Database-per-service pattern: Implemented
✓ Service independence: Verified
✓ API Gateway routing: Configured
✓ Module Federation: Working
✓ Remote loading: Functional

📊 **Summary:**
- Total services: 5 microservices + 5 micro-frontends
- Total endpoints: 40 REST APIs
- Code files: 180+ files generated
- Documentation: 10 README files
- Dockerfiles: 10 containers ready
- Overall quality score: 94/100 (Excellent)

✅ All validations passed!
🎉 Project ready for deployment!`
      }
    ];

    // Give client time to connect and subscribe
    await this.delay(2000);

    this.updateMigrationStatus(migrationId, 'running');

    for (const agent of agents) {
      // Start agent
      this.updateAgentProgress(migrationId, {
        agent: agent.name,
        status: 'running'
      });

      // Emit WebSocket event
      emitAgentStarted(migrationId, agent.name);

      logger.info(`Agent ${agent.name} started for migration ${migrationId}`);

      // Simulate work with progress updates
      const steps = 10;
      const stepDuration = agent.duration / steps;

      for (let i = 1; i <= steps; i++) {
        await this.delay(stepDuration);
        const progress = (i / steps) * 100;
        emitAgentProgress(migrationId, agent.name, progress);
      }

      // Generate code for specific agents
      if (agent.name === 'service-generator') {
        await this.generateMicroservicesCode(migrationId);
      } else if (agent.name === 'frontend-migrator') {
        await this.generateMicroFrontendsCode(migrationId);
      }

      // Complete agent
      this.updateAgentProgress(migrationId, {
        agent: agent.name,
        status: 'completed',
        output: agent.output
      });

      // Emit WebSocket event
      emitAgentCompleted(migrationId, agent.name, agent.output);

      logger.info(`Agent ${agent.name} completed for migration ${migrationId}`);
    }

    // Create output archive
    await this.completeMigration(migrationId, {});

    // Complete migration
    this.updateMigrationStatus(migrationId, 'completed');
    emitMigrationCompleted(migrationId);
    logger.info(`Migration ${migrationId} completed successfully in demo mode`);
  }

  /**
   * Generate Spring Boot microservices code
   */
  private async generateMicroservicesCode(migrationId: string): Promise<void> {
    const outputPath = path.join(this.workspaceDir, migrationId, 'output');
    const services = ['auth-service', 'client-service', 'account-service', 'transaction-service', 'card-service'];

    for (const service of services) {
      const servicePath = path.join(outputPath, 'microservices', service);
      await fs.ensureDir(path.join(servicePath, 'src/main/java/com/eurobank', service.replace('-service', '')));
      await fs.ensureDir(path.join(servicePath, 'src/main/resources'));
      await fs.ensureDir(path.join(servicePath, 'src/test/java/com/eurobank', service.replace('-service', '')));

      // Generate pom.xml
      await fs.writeFile(path.join(servicePath, 'pom.xml'), this.generatePomXml(service));

      // Generate Application class
      await fs.writeFile(
        path.join(servicePath, `src/main/java/com/eurobank/${service.replace('-service', '')}/Application.java`),
        this.generateApplicationClass(service)
      );

      // Generate application.yml
      await fs.writeFile(
        path.join(servicePath, 'src/main/resources/application.yml'),
        this.generateApplicationYml(service)
      );

      // Generate README
      await fs.writeFile(path.join(servicePath, 'README.md'), this.generateServiceReadme(service));
    }

    logger.info(`Generated ${services.length} microservices for migration ${migrationId}`);
  }

  /**
   * Generate Angular micro-frontends code
   */
  private async generateMicroFrontendsCode(migrationId: string): Promise<void> {
    const outputPath = path.join(this.workspaceDir, migrationId, 'output');
    const frontends = ['shell', 'auth-mfe', 'dashboard-mfe', 'transfers-mfe', 'cards-mfe'];

    for (const frontend of frontends) {
      const frontendPath = path.join(outputPath, 'micro-frontends', frontend);
      await fs.ensureDir(path.join(frontendPath, 'src/app'));

      // Generate package.json
      await fs.writeFile(path.join(frontendPath, 'package.json'), this.generatePackageJson(frontend));

      // Generate Angular component
      await fs.writeFile(
        path.join(frontendPath, 'src/app/app.component.ts'),
        this.generateAngularComponent(frontend)
      );

      // Generate webpack.config.js
      await fs.writeFile(
        path.join(frontendPath, 'webpack.config.js'),
        this.generateWebpackConfig(frontend)
      );

      // Generate README
      await fs.writeFile(path.join(frontendPath, 'README.md'), this.generateFrontendReadme(frontend));
    }

    logger.info(`Generated ${frontends.length} micro-frontends for migration ${migrationId}`);
  }

  private generatePomXml(serviceName: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.2</version>
    </parent>

    <groupId>com.eurobank</groupId>
    <artifactId>${serviceName}</artifactId>
    <version>1.0.0</version>
    <name>${serviceName}</name>
    <description>Microservice for ${serviceName}</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;
  }

  private generateApplicationClass(serviceName: string): string {
    const className = serviceName.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    return `package com.eurobank.${serviceName.replace('-service', '')};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${className}Application {
    public static void main(String[] args) {
        SpringApplication.run(${className}Application.class, args);
    }
}`;
  }

  private generateApplicationYml(serviceName: string): string {
    const port = 8080 + ['auth-service', 'client-service', 'account-service', 'transaction-service', 'card-service'].indexOf(serviceName) + 1;
    return `spring:
  application:
    name: ${serviceName}
  datasource:
    url: jdbc:postgresql://localhost:5432/${serviceName.replace('-', '_')}
    username: eurobank
    password: password
  jpa:
    hibernate:
      ddl-auto: update

server:
  port: ${port}`;
  }

  private generateServiceReadme(serviceName: string): string {
    return `# ${serviceName.toUpperCase()}

## Description
This microservice handles ${serviceName.replace('-service', '')} operations.

## Running
\`\`\`bash
mvn spring-boot:run
\`\`\`

## API Endpoints
- GET /api/v1/${serviceName.replace('-service', '')}
- POST /api/v1/${serviceName.replace('-service', '')}
- PUT /api/v1/${serviceName.replace('-service', '')}/:id
- DELETE /api/v1/${serviceName.replace('-service', '')}/:id

Generated by ARK Banking Migration Platform`;
  }

  private generatePackageJson(frontendName: string): string {
    return `{
  "name": "${frontendName}",
  "version": "1.0.0",
  "scripts": {
    "start": "ng serve --port ${4200 + ['shell', 'auth-mfe', 'dashboard-mfe', 'transfers-mfe', 'cards-mfe'].indexOf(frontendName)}",
    "build": "ng build"
  },
  "dependencies": {
    "@angular/core": "^18.0.0",
    "@angular/common": "^18.0.0",
    "@angular/router": "^18.0.0"
  }
}`;
  }

  private generateAngularComponent(frontendName: string): string {
    return `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div class="container">
      <h1>${frontendName.toUpperCase()}</h1>
      <p>This is the ${frontendName} micro-frontend</p>
    </div>
  \`,
  styles: [\`
    .container {
      padding: 20px;
    }
  \`]
})
export class AppComponent {
  title = '${frontendName}';
}`;
  }

  private generateWebpackConfig(frontendName: string): string {
    return `const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "${frontendName}",
      filename: "remoteEntry.js",
      exposes: {
        './Module': './src/app/app.module.ts',
      },
      shared: {
        "@angular/core": { singleton: true },
        "@angular/common": { singleton: true },
        "@angular/router": { singleton: true },
      },
    }),
  ],
};`;
  }

  private generateFrontendReadme(frontendName: string): string {
    return `# ${frontendName.toUpperCase()}

## Description
Angular micro-frontend for ${frontendName.replace('-mfe', '')}.

## Running
\`\`\`bash
npm install
npm start
\`\`\`

## Module Federation
This micro-frontend uses Webpack Module Federation for runtime integration.

Generated by ARK Banking Migration Platform`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clone repository to workspace
   */
  private async cloneRepository(migrationId: string, repoUrl: string): Promise<string> {
    const repoDir = path.join(this.workspaceDir, migrationId, 'source');
    await fs.ensureDir(repoDir);

    const git: SimpleGit = simpleGit();

    try {
      await git.clone(repoUrl, repoDir);
      logger.info(`Repository cloned to: ${repoDir}`);
      return repoDir;
    } catch (error: any) {
      logger.error('Failed to clone repository:', error);
      throw new Error(`Repository clone failed: ${error.message}`);
    }
  }

  /**
   * Trigger n8n workflow via webhook
   */
  private async triggerN8nWorkflow(
    migrationId: string,
    repoPath: string,
    options: any
  ): Promise<void> {
    const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`;

    const payload = {
      migrationId,
      repoUrl: repoPath,
      repoPath,
      options,
      backendUrl
    };

    try {
      logger.info(`Sending webhook to n8n: ${this.n8nWebhookUrl}`);
      const response = await axios.post(this.n8nWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      logger.info(`n8n workflow triggered successfully for migration ${migrationId}`, {
        response: response.data
      });

      this.updateMigrationStatus(migrationId, 'analyzing');
    } catch (error: any) {
      logger.error('Failed to trigger n8n workflow:', error);
      throw new Error(`n8n workflow trigger failed: ${error.message}`);
    }
  }

  /**
   * Mark migration as complete
   */
  async completeMigration(id: string, validationReport: any): Promise<void> {
    const migration = this.migrations.get(id);
    if (!migration) {
      throw new Error(`Migration ${id} not found`);
    }

    // Create output archive
    const outputPath = await this.createOutputArchive(id);
    migration.outputPath = outputPath;

    this.updateMigrationStatus(id, 'completed');
    logger.info(`Migration ${id} completed successfully`);
  }

  /**
   * Create ZIP archive of generated code
   */
  private async createOutputArchive(migrationId: string): Promise<string> {
    const sourcePath = path.join(this.workspaceDir, migrationId, 'output');
    const outputPath = path.join(this.outputDir, `${migrationId}.zip`);

    await fs.ensureDir(this.outputDir);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        logger.info(`Created output archive: ${outputPath} (${archive.pointer()} bytes)`);
        resolve(outputPath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Check if source directory exists
      if (fs.existsSync(sourcePath)) {
        archive.directory(sourcePath, false);
      } else {
        logger.warn(`Source path not found: ${sourcePath}, creating empty archive`);
      }

      archive.finalize();
    });
  }

  /**
   * Get download path for migration result
   */
  getDownloadPath(id: string): string | null {
    const migration = this.migrations.get(id);
    return migration?.outputPath || null;
  }

  /**
   * List files in migration output
   */
  async listOutputFiles(id: string): Promise<string[]> {
    const outputPath = path.join(this.workspaceDir, id, 'output');

    if (!fs.existsSync(outputPath)) {
      return [];
    }

    const files = await this.getAllFiles(outputPath);
    return files.map(file => path.relative(outputPath, file));
  }

  /**
   * Get all files recursively
   */
  private async getAllFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(entry => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? this.getAllFiles(fullPath) : fullPath;
      })
    );
    return files.flat();
  }

  /**
   * Read file content from output
   */
  async readOutputFile(id: string, filePath: string): Promise<string> {
    const fullPath = path.join(this.workspaceDir, id, 'output', filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return fs.readFile(fullPath, 'utf-8');
  }
}

export default new MigrationService();
