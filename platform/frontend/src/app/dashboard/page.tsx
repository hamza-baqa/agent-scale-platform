'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import migrationService from '@/services/migrationService';
import websocketService from '@/services/websocketService';
import { Migration, AgentProgress } from '@/types/migration.types';
import { formatRelativeTime } from '@/utils/formatting';
import AgentOutputVisualizer from '@/components/AgentOutputVisualizer';

export const dynamic = 'force-dynamic';

interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: 'agent-started' | 'agent-progress' | 'agent-completed' | 'migration-completed' | 'info';
  agent?: string;
  message: string;
  progress?: number;
}

interface AgentLog {
  id: string;
  timestamp: Date;
  agent: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface WorkflowNode {
  id: string;
  agentName?: string;
  type: 'trigger' | 'agent' | 'success';
  title: string;
  subtitle?: string;
  team?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  position: { x: number; y: number };
  label?: string;
  systemPrompt?: string;
  tools?: string[];
}

// Agent configurations with full details
const AGENT_CONFIGS: Record<string, any> = {
  'code-analyzer': {
    title: 'Code Analyzer',
    description: 'AI-powered code analysis using ARK agent',
    label: 'ANALYZE',
    team: 'Step 1: Reverse-engineer',
    tools: ['ARK Agent', 'AI Analysis', 'Source Code Parser', 'Annotation Extractor'],
    systemPrompt: `📡 Chargement du prompt système depuis l'agent ARK Kubernetes...

✅ Ce prompt analyse BACKEND + FRONTEND en français

Le prompt analyse :
• Backend : Java, C#, Spring Boot, ASP.NET Core
  - Entités JPA, endpoints REST, services
  - Schéma de base de données
  - Configuration de sécurité

• Frontend : TypeScript, Angular, React, Vue, Blazor
  - Structure des composants et hiérarchie
  - Configuration du routing
  - Gestion d'état (NgRx, Redux, Context)
  - Composants UI/UX
  - Intégration frontend-backend

Format de sortie :
• Markdown professionnel en français
• Diagrammes Mermaid (ERD, Architecture)
• Rapport complet avec recommandations

Source : GET /api/repo-migration/code-analyzer-prompt
(Chargé depuis Kubernetes agent 'code-analyzer')`,
  },
  'migration-planner': {
    title: 'Migration Planner',
    description: 'Create migration blueprint and architecture',
    label: 'PLAN',
    team: 'Step 2: Shape',
    tools: ['openapi-generator', 'jpa-schema-generator', 'architecture-validator'],
    systemPrompt: `You are a software architect specializing in microservices and micro-frontends.
Given the code analysis report, create a detailed migration plan that includes:

1. Microservices Decomposition:
   - Auth Service: JWT authentication, user management
   - Client Service: Client CRUD, client profiles
   - Account Service: Account management, balance operations
   - Transaction Service: Transaction history, transaction processing
   - Card Service: Card management, card operations

2. Micro-frontend Modules:
   - Shell: Main container, routing, shared state
   - Auth: Login, registration, password reset
   - Dashboard: Account overview, summary widgets
   - Transfers: Money transfers, beneficiary management
   - Cards: Card management, card operations

3. API Contracts (OpenAPI 3.0 specifications)
4. Database schemas (JPA entities per service)
5. Shared libraries and common code

Output a comprehensive migration blueprint in JSON format.`,
  },
  'service-generator': {
    title: 'Service Generator',
    description: 'Generate Spring Boot microservices',
    label: 'BUILD',
    team: 'Step 3: Modernize',
    tools: ['spring-initializr', 'code-generator', 'file-writer', 'maven-validator'],
    systemPrompt: `You are a Spring Boot expert. Generate production-ready microservices code.

For each service, generate:
1. Maven pom.xml with Spring Boot 3.2.x, Java 17
2. Application class with @SpringBootApplication
3. JPA entities with proper relationships
4. Repository interfaces (Spring Data JPA)
5. Service layer with business logic
6. REST controllers with OpenAPI annotations
7. Security configuration (JWT validation)
8. application.yml with profiles (dev, prod)
9. Dockerfile for containerization
10. Unit and integration tests

Use Spring Boot best practices: Constructor injection, proper exception handling, validation.`,
  },
  'frontend-migrator': {
    title: 'Frontend Migrator',
    description: 'Convert to Angular micro-frontends',
    label: 'FRONTEND',
    team: 'Step 3: Modernize',
    tools: ['angular-cli', 'code-converter', 'module-federation', 'npm-validator'],
    systemPrompt: `You are an Angular and Webpack Module Federation expert.

Migrate the Blazor WebAssembly application to Angular micro-frontends:

1. Shell Application (Host):
   - Angular 18+ with standalone components
   - Module Federation configuration (webpack.config.js)
   - Routing to remote modules
   - Shared state management
   - Authentication guard

2. Remote Modules (Auth, Dashboard, Transfers, Cards):
   - Standalone Angular applications
   - Expose components via Module Federation
   - Independent routing
   - API service integration

Convert Blazor Razor components to Angular TypeScript components.`,
  },
  'unit-test-validator': {
    title: 'Unit Test Validator',
    description: 'Validate unit tests (Backend & Frontend)',
    label: 'UNIT TESTS',
    team: 'Step 4: Testing',
    tools: ['JUnit 5', 'Mockito', 'Jasmine/Jest', 'TestBed'],
    systemPrompt: `You are a Unit Testing expert specializing in Java and TypeScript/Angular applications.

Your mission: Validate unit test coverage and quality for the generated code.

1. Backend Unit Tests (Java/Spring Boot):
   - Run: mvn test
   - Verify all JUnit 5 tests pass
   - Check @SpringBootTest, @WebMvcTest, @DataJpaTest annotations
   - Validate Mockito mocks and service layer tests

2. Frontend Unit Tests (Angular/TypeScript):
   - Run: npm test
   - Verify component tests pass
   - Check service tests with mocked HttpClient
   - Validate pipe and directive tests

3. Code Coverage Analysis:
   - Backend: Target minimum 70% coverage
   - Frontend: Target minimum 70% coverage

Generate a comprehensive report with Error Report section listing all errors in table format.`,
  },
  'integration-test-validator': {
    title: 'Integration Test Validator',
    description: 'Validate API, Database & Service integration',
    label: 'INTEGRATION',
    team: 'Step 4: Testing',
    tools: ['Spring Boot Test', 'RestAssured', 'TestContainers', 'PostgreSQL'],
    systemPrompt: `You are an Integration Testing expert specializing in microservices and API testing.

Your mission: Validate integration tests between services, databases, and APIs.

1. Backend Integration Tests:
   - Run: mvn verify -P integration-tests
   - Test API endpoints with real HTTP calls
   - Validate database integration
   - Verify transaction management and rollback

2. Database Integration:
   - Test PostgreSQL connection and queries
   - Validate JPA entity mappings and relationships
   - Check flyway/liquibase migrations

3. API Contract Testing:
   - Validate OpenAPI/Swagger specifications
   - Test request/response schemas
   - Check HTTP status codes
   - Verify authentication and authorization

Generate a comprehensive report with Error Report section listing all errors in table format.`,
  },
  'e2e-test-validator': {
    title: 'E2E Test Validator',
    description: 'Validate complete user workflows & security',
    label: 'E2E TESTS',
    team: 'Step 4: Testing',
    tools: ['Cypress', 'Playwright', 'Lighthouse', 'OWASP ZAP'],
    systemPrompt: `You are an End-to-End Testing expert specializing in web application testing.

Your mission: Validate the complete user workflow from frontend to backend.

1. Frontend E2E Tests (Cypress/Playwright):
   - Test complete user journeys
   - Validate authentication flow
   - Test critical business workflows (registration, transfers, cards)

2. Performance Testing:
   - Measure page load times
   - Check API response times
   - Validate lazy loading

3. Security Testing:
   - Validate HTTPS enforcement
   - Check CORS configuration
   - Test XSS protection
   - Verify CSRF tokens

4. Accessibility Testing:
   - WCAG 2.1 compliance
   - Keyboard navigation
   - Screen reader compatibility

Generate a comprehensive report with Error Report section listing all errors in table format.`,
  },
  'retry-planner': {
    title: 'Retry Planner',
    description: 'Analyze validation errors and improve migration plan',
    label: 'RETRY',
    team: 'Step 2: Shape',
    tools: ['error-analyzer', 'plan-improver', 'ark-agent', 'ai-analysis'],
    systemPrompt: `You are an expert migration retry planner and error analysis specialist.

Your mission: Analyze validation errors from all test validators and generate an improved migration plan.

Input Analysis:
1. Original migration plan (microservices + micro-frontends)
2. Unit Test Validation Report (errors with ERR-UT-XXX codes)
3. Integration Test Validation Report (errors with ERR-IT-XXX codes)
4. E2E Test Validation Report (errors with ERR-E2E-XXX codes)
5. Current retry attempt number

Error Analysis Process:
1. Categorize errors by type (build, test, config, security, code quality)
2. Identify root causes for each error
3. Determine if errors are related or independent
4. Prioritize fixes by severity (CRITICAL > HIGH > MEDIUM > LOW)

Improvement Strategy:
1. For each error, provide specific fix instructions
2. Update service generator prompts with corrections
3. Update frontend migrator prompts with corrections
4. Add missing dependencies, configurations, or code
5. Ensure fixes don't introduce new errors

Output Format:
- Error Summary (total errors, breakdown by category)
- Root Cause Analysis
- Improvement Plan with specific fixes
- Updated prompts for service-generator
- Updated prompts for frontend-migrator
- Confidence level for zero-error achievement

Goal: Achieve ZERO ERRORS through intelligent iteration.`,
  },
  'container-deployer': {
    title: 'Container Deployer',
    description: 'Deploy after quality validation passes',
    label: 'DEPLOY',
    team: 'Step 4: Deploy & Test',
    tools: ['docker', 'docker-compose', 'container-orchestration', 'health-checker'],
    systemPrompt: `You are a DevOps and containerization expert. Deploy the generated application:

1. Container Setup:
   - Generate Dockerfiles for all services
   - Create docker-compose.yml configuration
   - Set up PostgreSQL database container
   - Configure container networking

2. Image Building:
   - Build Docker images for microservices
   - Build Docker images for micro-frontends
   - Optimize image sizes with multi-stage builds
   - Tag images appropriately

3. Deployment:
   - Start all containers with proper dependencies
   - Configure environment variables
   - Set up health checks
   - Ensure service discovery

4. Verification:
   - Verify all containers are running
   - Check health endpoints
   - Test database connectivity
   - Provide access URLs

Deploy the complete application stack and provide URLs for immediate testing.`,
  },
  'build-validator': {
    title: 'Build Validator',
    description: 'Verify code builds & runs successfully',
    label: 'BUILD & RUN',
    team: 'Step 5: Production Ready',
    tools: ['Docker', 'docker-compose', 'Build Validation', 'Health Checks'],
    systemPrompt: `You are a Build Validation expert ensuring generated code is 100% production-ready.

Your mission: Validate that the generated code builds successfully with Docker and runs without errors.

Validation Process:
1. Build all Docker images from generated code
2. Run docker-compose up to start all services
3. Check health endpoints for all services
4. Verify database connections
5. Test service-to-service communication

Build Validation:
- Backend: Maven builds succeed (mvn clean package)
- Frontend: NPM builds succeed (npm run build)
- Docker: All images build without errors
- Compose: All services start and become healthy

Runtime Validation:
- Database connections established
- Spring Boot actuator health checks pass
- Angular apps serve correctly
- API endpoints respond
- No critical errors in logs

Error Reporting:
If build or runtime errors occur, generate a detailed error report with:
- Error ID (ERR-BUILD-XXX)
- Severity (CRITICAL, HIGH, MEDIUM, LOW)
- Category (Build, Runtime, Configuration, Docker)
- Service name
- Error description
- Fix recommendations

Goal: Ensure ./start.sh works perfectly on first try - 100% working code guaranteed!`,
  }
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const migrationId = searchParams.get('id');

  const [migration, setMigration] = useState<Migration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<'overview' | 'agents' | 'activity'>('overview');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [deploymentData, setDeploymentData] = useState<any>(null);
  const [codeAnalyzerPrompt, setCodeAnalyzerPrompt] = useState<string | null>(null);
  const [retryingValidation, setRetryingValidation] = useState(false);
  const [restartingMigration, setRestartingMigration] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [selectedTab, setSelectedTab] = useState<'prompt' | 'output' | 'logs'>('prompt');

  // Retry Loop State
  const [retryLoopState, setRetryLoopState] = useState<{
    isActive: boolean;
    currentAttempt: number;
    maxRetries: number;
    phase: 'analyzing' | 'improving-plan' | 'regenerating' | 'validating' | 'idle';
    totalErrors: number;
    errorsHistory: Array<{
      attempt: number;
      errors: number;
      errorsFixed: number;
    }>;
    status: 'in-progress' | 'success' | 'failed' | 'idle';
  }>({
    isActive: false,
    currentAttempt: 0,
    maxRetries: 3,
    phase: 'idle',
    totalErrors: 0,
    errorsHistory: [],
    status: 'idle'
  });

  const addActivity = (type: ActivityEvent['type'], agent: string | undefined, message: string, progress?: number) => {
    const event: ActivityEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      type,
      agent,
      message,
      progress
    };
    setActivityFeed(prev => [event, ...prev].slice(0, 50));
  };

  // Fetch the real prompt for code-analyzer when selected
  useEffect(() => {
    if (selectedAgent === 'code-analyzer' && !codeAnalyzerPrompt) {
      const fetchPrompt = async () => {
        try {
          console.log('Fetching code-analyzer ACTUAL system prompt from ARK agent...');
          const response = await fetch('http://localhost:4000/api/repo-migration/code-analyzer-prompt');
          if (response.ok) {
            const data = await response.json();
            // Backend now returns systemPrompt (not promptTemplate)
            const prompt = data.systemPrompt || data.promptTemplate;
            console.log('System prompt fetched successfully from:', data.source, '- Length:', prompt?.length);
            setCodeAnalyzerPrompt(prompt);
          } else {
            console.error('Failed to fetch prompt:', response.status);
          }
        } catch (error) {
          console.error('Error fetching code-analyzer prompt:', error);
        }
      };

      fetchPrompt();
    }
  }, [selectedAgent, codeAnalyzerPrompt]);

  // Fetch deployment data when selectedAgent is 'container-deployer'
  useEffect(() => {
    if (selectedAgent === 'container-deployer' && migrationId) {
      const fetchDeployment = async () => {
        try {
          const response = await fetch(`http://localhost:4000/api/migrations/${migrationId}/containers`);
          if (response.ok) {
            const data = await response.json();
            setDeploymentData(data);
          }
        } catch (error) {
          console.error('Failed to fetch deployment data:', error);
        }
      };

      // Initial fetch
      fetchDeployment();

      // Poll every 3 seconds if deployment is not complete
      const pollInterval = setInterval(() => {
        if (deploymentData?.status && deploymentData.status !== 'running') {
          fetchDeployment();
        }
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [selectedAgent, migrationId, deploymentData?.status]);

  useEffect(() => {
    if (!migrationId) {
      router.push('/');
      return;
    }

    const fetchMigration = async () => {
      try {
        addActivity('info', undefined, 'Loading migration data...');
        const data = await migrationService.getMigration(migrationId);
        setMigration(data);
        setLoading(false);
        addActivity('info', undefined, `Migration loaded: ${data.repoUrl}`);
      } catch (err: any) {
        setError('Failed to load migration');
        setLoading(false);
      }
    };

    fetchMigration();

    const connectWebSocket = async () => {
      try {
        console.log('🔌 Connecting to WebSocket...');
        addActivity('info', undefined, 'Connecting to real-time updates...');
        await websocketService.connect();
        console.log('✅ WebSocket connected');
        addActivity('info', undefined, 'Connected! Subscribing to migration...');
        console.log('📡 Subscribing to migration:', migrationId);
        websocketService.subscribeMigration(migrationId);
        addActivity('info', undefined, '✅ Ready! Waiting for agent updates...');
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        addActivity('info', undefined, '❌ WebSocket connection failed');
      }
    };

    connectWebSocket();

    const handleAgentStarted = (data: any) => {
      if (data.migrationId === migrationId) {
        addActivity('agent-started', data.agent, `Agent ${data.agent} started`);
        setMigration((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            progress: updateAgentProgress(prev.progress, data.agent, 'running'),
          };
        });
      }
    };

    const handleAgentProgress = (data: any) => {
      if (data.migrationId === migrationId) {
        addActivity('agent-progress', data.agent, `Progress: ${Math.round(data.progress)}%`, data.progress);
      }
    };

    const handleAgentCompleted = (data: any) => {
      if (data.migrationId === migrationId) {
        addActivity('agent-completed', data.agent, `Agent ${data.agent} completed`);
        setMigration((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            progress: updateAgentProgress(prev.progress, data.agent, 'completed', data.output),
          };
        });
      }
    };

    const handleAgentReset = (data: any) => {
      if (data.migrationId === migrationId) {
        console.log('🔄 Agent reset to pending:', data.agent);
        addActivity('info', data.agent, `🔄 Agent ${data.agent} reset to pending - restarting fresh`);
        setMigration((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            progress: updateAgentProgress(prev.progress, data.agent, 'pending', ''),
          };
        });
      }
    };

    const handleMigrationCompleted = (data: any) => {
      if (data.migrationId === migrationId) {
        addActivity('migration-completed', undefined, '🎉 Migration completed successfully!');
        setMigration((prev) => {
          if (!prev) return prev;
          return { ...prev, status: 'completed', completedAt: new Date().toISOString() };
        });
      }
    };

    const handleMigrationRestarted = (data: any) => {
      if (data.migrationId === migrationId) {
        addActivity('info', undefined, '🔄 Migration restarted! Starting from Code Analyzer...');
        setMigration((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'analyzing',
            progress: [],
            validationReport: undefined,
            deploymentResult: undefined,
            completedAt: undefined,
          };
        });
        setActivityFeed([{
          id: `${Date.now()}-restart`,
          timestamp: new Date(),
          type: 'info',
          message: '🔄 Migration restarted! Starting fresh from Step 1: Code Analyzer'
        }]);
        // Clear logs on restart
        setAgentLogs([]);
      }
    };

    const handleAgentLog = (data: any) => {
      console.log('📜 Received agent-log event:', data);
      if (data.migrationId === migrationId) {
        console.log('✅ Log matches migration ID, adding to state');
        const log: AgentLog = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date(data.timestamp),
          agent: data.agent,
          level: data.level,
          message: data.message,
          data: data.data
        };
        setAgentLogs(prev => {
          const newLogs = [...prev, log].slice(-500);
          console.log('📊 Total logs now:', newLogs.length);
          return newLogs;
        });
      } else {
        console.log('❌ Log migration ID does not match:', data.migrationId, '!==', migrationId);
      }
    };

    // Retry Loop Event Handlers
    const handleRetryLoopStarted = (data: any) => {
      if (data.migrationId === migrationId) {
        console.log('🔄 Retry loop started:', data);
        setRetryLoopState(prev => ({
          ...prev,
          isActive: true,
          currentAttempt: data.attempt,
          maxRetries: data.maxRetries,
          totalErrors: data.totalErrors,
          status: 'in-progress',
          phase: 'analyzing'
        }));
        addActivity('info', undefined, `🔄 Retry ${data.attempt}/${data.maxRetries} started - ${data.totalErrors} errors to fix`);
      }
    };

    const handleRetryLoopProgress = (data: any) => {
      if (data.migrationId === migrationId) {
        console.log('📊 Retry loop progress:', data);
        setRetryLoopState(prev => ({
          ...prev,
          phase: data.phase
        }));
        addActivity('info', undefined, data.message);
      }
    };

    const handleRetryLoopIterationCompleted = (data: any) => {
      if (data.migrationId === migrationId) {
        console.log('✅ Retry iteration completed:', data);
        setRetryLoopState(prev => ({
          ...prev,
          errorsHistory: [
            ...prev.errorsHistory,
            {
              attempt: data.attempt,
              errors: data.errorsRemaining,
              errorsFixed: data.errorsFixed
            }
          ],
          totalErrors: data.errorsRemaining
        }));
        addActivity('info', undefined, `✅ Retry ${data.attempt} complete - ${data.errorsRemaining} errors remaining (${data.errorsFixed} fixed)`);
      }
    };

    const handleRetryLoopSuccess = (data: any) => {
      if (data.migrationId === migrationId) {
        console.log('🎉 Retry loop success!', data);
        setRetryLoopState(prev => ({
          ...prev,
          status: 'success',
          isActive: false,
          totalErrors: 0,
          phase: 'idle'
        }));
        addActivity('info', undefined, `🎉 SUCCESS! Zero errors achieved after ${data.totalAttempts} attempt(s)`);
      }
    };

    const handleRetryLoopFailed = (data: any) => {
      if (data.migrationId === migrationId) {
        console.log('❌ Retry loop failed:', data);
        setRetryLoopState(prev => ({
          ...prev,
          status: 'failed',
          isActive: false,
          phase: 'idle'
        }));
        addActivity('info', undefined, `❌ Max retries reached - ${data.errorsRemaining} errors remain`);
      }
    };

    websocketService.on('agent-started', handleAgentStarted);
    websocketService.on('agent-progress', handleAgentProgress);
    websocketService.on('agent-completed', handleAgentCompleted);
    websocketService.on('agent-reset', handleAgentReset);
    websocketService.on('migration-completed', handleMigrationCompleted);
    websocketService.on('migration-restarted', handleMigrationRestarted);
    websocketService.on('agent-log', handleAgentLog);

    // Subscribe to retry loop events
    websocketService.onRetryLoopStarted(handleRetryLoopStarted);
    websocketService.onRetryLoopProgress(handleRetryLoopProgress);
    websocketService.onRetryLoopIterationCompleted(handleRetryLoopIterationCompleted);
    websocketService.onRetryLoopSuccess(handleRetryLoopSuccess);
    websocketService.onRetryLoopFailed(handleRetryLoopFailed);

    return () => {
      websocketService.off('agent-started', handleAgentStarted);
      websocketService.off('agent-progress', handleAgentProgress);
      websocketService.off('agent-completed', handleAgentCompleted);
      websocketService.off('agent-reset', handleAgentReset);
      websocketService.off('migration-completed', handleMigrationCompleted);
      websocketService.off('migration-restarted', handleMigrationRestarted);
      websocketService.off('agent-log', handleAgentLog);

      // Cleanup retry loop event listeners
      websocketService.offRetryLoopStarted(handleRetryLoopStarted);
      websocketService.offRetryLoopProgress(handleRetryLoopProgress);
      websocketService.offRetryLoopIterationCompleted(handleRetryLoopIterationCompleted);
      websocketService.offRetryLoopSuccess(handleRetryLoopSuccess);
      websocketService.offRetryLoopFailed(handleRetryLoopFailed);

      websocketService.unsubscribeMigration(migrationId);
    };
  }, [migrationId, router]);

  const updateAgentProgress = (
    progress: AgentProgress[],
    agent: string,
    status: string,
    output?: any
  ): AgentProgress[] => {
    const existing = progress.find((p) => p.agent === agent);
    if (existing) {
      return progress.map((p) =>
        p.agent === agent
          ? {
              ...p,
              status: status as any,
              completedAt: status === 'completed' ? new Date().toISOString() : p.completedAt,
              output,
            }
          : p
      );
    } else {
      return [
        ...progress,
        {
          agent: agent as any,
          status: status as any,
          startedAt: new Date().toISOString(),
          output,
        },
      ];
    }
  };

  const getAgentProgress = (agentName: string): AgentProgress | undefined => {
    return migration?.progress.find(p => p.agent === agentName);
  };

  const handleDownload = () => {
    if (migrationId) {
      migrationService.downloadOutput(migrationId);
    }
  };

  const handleRetryValidation = async () => {
    if (!migrationId) return;

    setRetryingValidation(true);
    try {
      const response = await fetch(`http://localhost:4000/api/repo-migration/${migrationId}/retry-validation`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        addActivity('info', 'quality-validator', '✅ Validation passed! Deployment starting...');
        setMigration(prev => prev ? { ...prev, status: 'deploying' } : prev);
      } else {
        addActivity('info', 'quality-validator', `❌ Validation still failing: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to retry validation:', error);
      addActivity('info', 'quality-validator', '❌ Failed to retry validation');
    } finally {
      setRetryingValidation(false);
    }
  };

  const handleRestartMigration = async () => {
    console.log('🚨 handleRestartMigration CALLED!');
    console.log('   migrationId:', migrationId);
    console.log('   migration status:', migration?.status);

    if (!migrationId) {
      console.log('❌ No migrationId, returning');
      return;
    }

    console.log('✅ Showing confirmation dialog...');
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to restart this migration?\n\nThis will:\n- Reset all progress\n- Clear all agent outputs\n- Start fresh from Code Analyzer\n\nContinue?'
    );

    console.log('   User confirmed:', confirmed);
    if (!confirmed) {
      console.log('❌ User cancelled');
      return;
    }

    console.log('✅ Starting restart process...');
    setRestartingMigration(true);
    try {
      // Immediately reset the visual state for better UX
      setMigration(prev => prev ? {
        ...prev,
        status: 'analyzing',
        progress: [],
        validationReport: undefined,
        deploymentResult: undefined,
        completedAt: undefined,
      } : prev);
      setActivityFeed([{
        id: `${Date.now()}-restart-init`,
        timestamp: new Date(),
        type: 'info',
        message: '🔄 Restarting migration... Please wait.'
      }]);

      const url = `http://localhost:4000/api/repo-migration/${migrationId}/restart`;
      console.log('🌐 Making fetch request to:', url);

      const response = await fetch(url, {
        method: 'POST',
      });

      console.log('📥 Response received:', response.status, response.statusText);

      const result = await response.json();
      console.log('📊 Result:', result);

      if (result.success) {
        addActivity('info', undefined, '✅ Migration restarted successfully! Code Analyzer will start shortly...');

        // Refresh migration data from server after a short delay
        setTimeout(async () => {
          try {
            const data = await migrationService.getMigration(migrationId);
            setMigration(data);
            addActivity('info', undefined, '📊 Migration state refreshed. Watching for agent updates...');
          } catch (err) {
            console.error('Failed to refresh migration:', err);
          }
        }, 1000);
      } else {
        addActivity('info', undefined, `❌ Failed to restart migration: ${result.error}`);
        // Restore previous state on error
        const data = await migrationService.getMigration(migrationId);
        setMigration(data);
      }
    } catch (error) {
      console.error('Failed to restart migration:', error);
      addActivity('info', undefined, '❌ Failed to restart migration - Network error');
      // Try to restore state
      try {
        const data = await migrationService.getMigration(migrationId);
        setMigration(data);
      } catch (err) {
        console.error('Failed to restore migration state:', err);
      }
    } finally {
      setRestartingMigration(false);
    }
  };

  // Build workflow nodes with all agents
  const buildWorkflowNodes = (): WorkflowNode[] => {
    const nodes: WorkflowNode[] = [];

    // Trigger node
    nodes.push({
      id: 'trigger',
      type: 'trigger',
      title: 'Repository Input',
      subtitle: migration?.repoUrl || '',
      status: migration ? 'completed' : 'pending',
      position: { x: 100, y: 300 },
      label: 'START'
    });

    // Step 1: Code Analyzer
    const codeAnalyzer = getAgentProgress('code-analyzer');
    nodes.push({
      id: 'code-analyzer',
      agentName: 'code-analyzer',
      type: 'agent',
      title: AGENT_CONFIGS['code-analyzer'].title,
      subtitle: AGENT_CONFIGS['code-analyzer'].description,
      team: AGENT_CONFIGS['code-analyzer'].team,
      status: codeAnalyzer?.status || 'pending',
      position: { x: 400, y: 300 },
      label: AGENT_CONFIGS['code-analyzer'].label,
      systemPrompt: AGENT_CONFIGS['code-analyzer'].systemPrompt,
      tools: AGENT_CONFIGS['code-analyzer'].tools
    });

    // Step 2: Migration Planner
    const migrationPlanner = getAgentProgress('migration-planner');
    nodes.push({
      id: 'migration-planner',
      agentName: 'migration-planner',
      type: 'agent',
      title: AGENT_CONFIGS['migration-planner'].title,
      subtitle: AGENT_CONFIGS['migration-planner'].description,
      team: AGENT_CONFIGS['migration-planner'].team,
      status: migrationPlanner?.status || 'pending',
      position: { x: 700, y: 300 },
      label: AGENT_CONFIGS['migration-planner'].label,
      systemPrompt: AGENT_CONFIGS['migration-planner'].systemPrompt,
      tools: AGENT_CONFIGS['migration-planner'].tools
    });

    // Step 2.5: Retry Planner (positioned below migration-planner)
    const retryPlanner = getAgentProgress('retry-planner');
    nodes.push({
      id: 'retry-planner',
      agentName: 'retry-planner',
      type: 'agent',
      title: AGENT_CONFIGS['retry-planner'].title,
      subtitle: AGENT_CONFIGS['retry-planner'].description,
      team: AGENT_CONFIGS['retry-planner'].team,
      status: retryPlanner?.status || 'pending',
      position: { x: 700, y: 500 },
      label: AGENT_CONFIGS['retry-planner'].label,
      systemPrompt: AGENT_CONFIGS['retry-planner'].systemPrompt,
      tools: AGENT_CONFIGS['retry-planner'].tools
    });

    // Step 3: Service Generator (top)
    const serviceGen = getAgentProgress('service-generator');
    nodes.push({
      id: 'service-generator',
      agentName: 'service-generator',
      type: 'agent',
      title: AGENT_CONFIGS['service-generator'].title,
      subtitle: AGENT_CONFIGS['service-generator'].description,
      team: AGENT_CONFIGS['service-generator'].team,
      status: serviceGen?.status || 'pending',
      position: { x: 1000, y: 100 },
      label: AGENT_CONFIGS['service-generator'].label,
      systemPrompt: AGENT_CONFIGS['service-generator'].systemPrompt,
      tools: AGENT_CONFIGS['service-generator'].tools
    });

    // Step 3: Frontend Migrator (middle)
    const frontendMig = getAgentProgress('frontend-migrator');
    nodes.push({
      id: 'frontend-migrator',
      agentName: 'frontend-migrator',
      type: 'agent',
      title: AGENT_CONFIGS['frontend-migrator'].title,
      subtitle: AGENT_CONFIGS['frontend-migrator'].description,
      team: AGENT_CONFIGS['frontend-migrator'].team,
      status: frontendMig?.status || 'pending',
      position: { x: 1000, y: 300 },
      label: AGENT_CONFIGS['frontend-migrator'].label,
      systemPrompt: AGENT_CONFIGS['frontend-migrator'].systemPrompt,
      tools: AGENT_CONFIGS['frontend-migrator'].tools
    });

    // Step 4: Unit Test Validator (top)
    const unitTestVal = getAgentProgress('unit-test-validator');
    nodes.push({
      id: 'unit-test-validator',
      agentName: 'unit-test-validator',
      type: 'agent',
      title: AGENT_CONFIGS['unit-test-validator'].title,
      subtitle: AGENT_CONFIGS['unit-test-validator'].description,
      team: AGENT_CONFIGS['unit-test-validator'].team,
      status: unitTestVal?.status || 'pending',
      position: { x: 1350, y: 50 },
      label: AGENT_CONFIGS['unit-test-validator'].label,
      systemPrompt: AGENT_CONFIGS['unit-test-validator'].systemPrompt,
      tools: AGENT_CONFIGS['unit-test-validator'].tools
    });

    // Step 4: Integration Test Validator (middle)
    const integrationTestVal = getAgentProgress('integration-test-validator');
    nodes.push({
      id: 'integration-test-validator',
      agentName: 'integration-test-validator',
      type: 'agent',
      title: AGENT_CONFIGS['integration-test-validator'].title,
      subtitle: AGENT_CONFIGS['integration-test-validator'].description,
      team: AGENT_CONFIGS['integration-test-validator'].team,
      status: integrationTestVal?.status || 'pending',
      position: { x: 1350, y: 250 },
      label: AGENT_CONFIGS['integration-test-validator'].label,
      systemPrompt: AGENT_CONFIGS['integration-test-validator'].systemPrompt,
      tools: AGENT_CONFIGS['integration-test-validator'].tools
    });

    // Step 4: E2E Test Validator (bottom)
    const e2eTestVal = getAgentProgress('e2e-test-validator');
    nodes.push({
      id: 'e2e-test-validator',
      agentName: 'e2e-test-validator',
      type: 'agent',
      title: AGENT_CONFIGS['e2e-test-validator'].title,
      subtitle: AGENT_CONFIGS['e2e-test-validator'].description,
      team: AGENT_CONFIGS['e2e-test-validator'].team,
      status: e2eTestVal?.status || 'pending',
      position: { x: 1350, y: 450 },
      label: AGENT_CONFIGS['e2e-test-validator'].label,
      systemPrompt: AGENT_CONFIGS['e2e-test-validator'].systemPrompt,
      tools: AGENT_CONFIGS['e2e-test-validator'].tools
    });

    // Step 5: Build Validator (NEW!)
    const buildVal = getAgentProgress('build-validator');
    nodes.push({
      id: 'build-validator',
      agentName: 'build-validator',
      type: 'agent',
      title: AGENT_CONFIGS['build-validator'].title,
      subtitle: AGENT_CONFIGS['build-validator'].description,
      team: AGENT_CONFIGS['build-validator'].team,
      status: buildVal?.status || 'pending',
      position: { x: 1650, y: 250 },
      label: AGENT_CONFIGS['build-validator'].label,
      systemPrompt: AGENT_CONFIGS['build-validator'].systemPrompt,
      tools: AGENT_CONFIGS['build-validator'].tools
    });

    // Step 6: Container Deployer
    const containerDep = getAgentProgress('container-deployer');
    nodes.push({
      id: 'container-deployer',
      agentName: 'container-deployer',
      type: 'agent',
      title: AGENT_CONFIGS['container-deployer'].title,
      subtitle: AGENT_CONFIGS['container-deployer'].description,
      team: AGENT_CONFIGS['container-deployer'].team,
      status: containerDep?.status || 'pending',
      position: { x: 1950, y: 250 },
      label: AGENT_CONFIGS['container-deployer'].label,
      systemPrompt: AGENT_CONFIGS['container-deployer'].systemPrompt,
      tools: AGENT_CONFIGS['container-deployer'].tools
    });

    return nodes;
  };

  const workflowNodes = buildWorkflowNodes();

  // Define connections - WITH RETRY FEEDBACK LOOP + BUILD VALIDATION
  const connections = [
    { from: 'trigger', to: 'code-analyzer' },
    { from: 'code-analyzer', to: 'migration-planner' },
    { from: 'migration-planner', to: 'service-generator' },
    { from: 'service-generator', to: 'frontend-migrator' },
    // Test Validators run AFTER code is generated
    { from: 'frontend-migrator', to: 'unit-test-validator' },
    { from: 'unit-test-validator', to: 'integration-test-validator' },
    { from: 'integration-test-validator', to: 'e2e-test-validator' },
    // Retry Loop: E2E test validator → retry-planner → migration-planner (feedback)
    { from: 'e2e-test-validator', to: 'retry-planner' },
    { from: 'retry-planner', to: 'migration-planner' },
    // Build Validator runs AFTER all tests pass to ensure code builds & runs
    { from: 'e2e-test-validator', to: 'build-validator' },
    // Container Deployer ONLY runs after build validation passes
    { from: 'build-validator', to: 'container-deployer' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Loading workflow...</p>
          <p className="text-sm text-slate-500 mt-2">Preparing your migration dashboard</p>
        </div>
      </div>
    );
  }

  if (error || !migration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
        <div className="relative group max-w-lg">
          <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl blur opacity-25"></div>
          <div className="relative bg-white p-8 rounded-2xl shadow-xl border-2 border-red-200">
            <div className="mb-6 text-center">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold rounded-full mb-4">ERROR</span>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-2">Something Went Wrong</h2>
              <p className="text-sm text-slate-600">Unable to load migration</p>
            </div>
            <p className="text-slate-700 text-center mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">{error || 'Migration not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedNode = selectedAgent ? workflowNodes.find(n => n.agentName === selectedAgent) : null;
  const selectedAgentProgress = selectedAgent ? getAgentProgress(selectedAgent) : null;

  // Full screen agent output view
  if (fullScreenMode && selectedAgent && selectedNode) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-white">
        {/* Full Screen Header */}
        <header className="bg-white border-b-2 border-violet-200 px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setFullScreenMode(false);
                setSelectedAgent(null);
              }}
              className="p-2 hover:bg-violet-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg">
                <span className="text-white text-sm font-bold">{selectedNode.label}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedNode.title}</h1>
                <p className="text-sm text-gray-600">{selectedNode.team}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-5 py-2 rounded-full text-sm font-bold shadow-lg ${
              selectedAgentProgress?.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
              selectedAgentProgress?.status === 'running' ? 'bg-blue-100 text-blue-700 animate-pulse' :
              selectedAgentProgress?.status === 'failed' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {selectedAgentProgress?.status === 'completed' && '✓ '}
              {selectedAgentProgress?.status === 'running' && '⚡ '}
              {selectedAgentProgress?.status === 'failed' && '✗ '}
              {selectedAgentProgress?.status || 'pending'}
            </span>
          </div>
        </header>

        {/* Full Screen Content */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Tabs for Prompt, Output, Logs */}
            <div className="bg-white rounded-2xl shadow-2xl border-2 border-violet-200">
              {/* Tab Headers */}
              <div className="border-b border-gray-200">
                <nav className="flex gap-2 px-6 pt-4">
                  <button
                    onClick={() => setSelectedTab('prompt')}
                    className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                      selectedTab === 'prompt'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    📝 System Prompt
                  </button>
                  {selectedAgentProgress?.output && (
                    <button
                      onClick={() => setSelectedTab('output')}
                      className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                        selectedTab === 'output'
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      📊 Agent Output
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTab('logs')}
                    className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-all ${
                      selectedTab === 'logs'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    📜 Logs {agentLogs.filter(log => log.agent === selectedAgent).length > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-violet-500 text-white text-xs rounded-full">
                        {agentLogs.filter(log => log.agent === selectedAgent).length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* System Prompt Tab */}
                {selectedTab === 'prompt' && (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">System Prompt</h3>
                      <p className="text-sm text-gray-600 mt-1">The exact instructions sent to the AI agent</p>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-6 max-h-[600px] overflow-y-auto">
                      <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                        {selectedAgent === 'code-analyzer' && codeAnalyzerPrompt
                          ? codeAnalyzerPrompt
                          : selectedNode.systemPrompt}
                      </pre>
                    </div>
                    {selectedAgent === 'code-analyzer' && !codeAnalyzerPrompt && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-violet-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                        <p className="text-sm font-medium">Loading real prompt from ARK agent...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Agent Output Tab */}
                {selectedTab === 'output' && selectedAgentProgress?.output && (
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900">Agent Output</h3>
                      <p className="text-sm text-gray-600 mt-1">Results from the agent execution</p>
                    </div>
                    <AgentOutputVisualizer
                      agentName={selectedAgent}
                      output={typeof selectedAgentProgress.output === 'string'
                        ? selectedAgentProgress.output
                        : JSON.stringify(selectedAgentProgress.output, null, 2)}
                      migrationId={migrationId || ''}
                    />
                  </div>
                )}

                {/* Logs Tab */}
                {selectedTab === 'logs' && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Real-time Agent Logs</h3>
                        <p className="text-sm text-gray-600 mt-1">Backend logs for {selectedNode.title}</p>
                      </div>
                      <button
                        onClick={() => setAgentLogs([])}
                        className="px-3 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Clear Logs
                      </button>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 max-h-[600px] overflow-y-auto">
                      {agentLogs.filter(log => log.agent === selectedAgent).length === 0 ? (
                        <div className="text-center py-12">
                          <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm text-slate-400 font-medium">No logs yet for this agent</p>
                          <p className="text-xs text-slate-500 mt-2">Logs will appear here when the agent runs</p>
                        </div>
                      ) : (
                        <div className="space-y-2 font-mono text-sm">
                          {agentLogs.filter(log => log.agent === selectedAgent).map(log => (
                            <div
                              key={log.id}
                              className={`flex items-start gap-3 p-3 rounded-lg ${
                                log.level === 'error' ? 'bg-red-900/30 border-l-4 border-red-500' :
                                log.level === 'warn' ? 'bg-yellow-900/30 border-l-4 border-yellow-500' :
                                log.level === 'debug' ? 'bg-blue-900/30 border-l-4 border-blue-500' :
                                'bg-slate-800/50 border-l-4 border-emerald-500'
                              }`}
                            >
                              <span className="text-slate-500 text-xs mt-0.5 flex-shrink-0">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <span className={`text-xs font-bold uppercase flex-shrink-0 ${
                                log.level === 'error' ? 'text-red-400' :
                                log.level === 'warn' ? 'text-yellow-400' :
                                log.level === 'debug' ? 'text-blue-400' :
                                'text-emerald-400'
                              }`}>
                                {log.level}
                              </span>
                              <div className="flex-1">
                                <p className="text-slate-200 whitespace-pre-wrap break-words">{log.message}</p>
                                {log.data && (
                                  <pre className="text-xs text-slate-400 mt-2 p-2 bg-slate-950/50 rounded overflow-x-auto">
                                    {JSON.stringify(log.data, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tools Used */}
            {selectedNode.tools && selectedNode.tools.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tools & Capabilities</h3>
                <div className="flex flex-wrap gap-3">
                  {selectedNode.tools.map(tool => (
                    <span key={tool} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border-2 border-blue-200 font-medium">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Duration */}
            {selectedAgentProgress?.startedAt && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Execution Time</h3>
                <p className="text-3xl font-bold text-violet-600">
                  {selectedAgentProgress.completedAt
                    ? `${Math.round((new Date(selectedAgentProgress.completedAt).getTime() - new Date(selectedAgentProgress.startedAt).getTime()) / 1000)}s`
                    : 'Running...'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Top Bar - Professional shadcn style */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative px-4 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg shadow-lg shadow-violet-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-white text-lg font-bold tracking-tight">Agent@Scale</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <p className="text-xs text-slate-600 font-medium">Migration Workflow</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm font-semibold text-slate-900">Banking Migration</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-slate-200 bg-white">
              <span className="text-sm font-medium text-slate-700">
                {migration.status === 'completed' ? 'Completed' :
                 migration.status === 'failed' ? 'Failed' :
                 migration.status === 'retrying' ? '🔄 Retrying' :
                 migration.status === 'completed_with_errors' ? '❌ Errors' :
                 ['analyzing', 'planning', 'generating', 'validating'].includes(migration.status) ? 'Active' : 'Inactive'}
              </span>
              <div className={`w-11 h-6 rounded-full transition-all duration-300 ${
                migration.status === 'retrying' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                ['analyzing', 'planning', 'generating', 'validating'].includes(migration.status) ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-slate-300'
              } relative shadow-inner`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-lg ${
                  ['analyzing', 'planning', 'generating', 'validating'].includes(migration.status) ? 'translate-x-5' : 'translate-x-0.5'
                }`}></div>
              </div>
            </div>

<div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white">
              <div className={`w-2 h-2 rounded-full ${websocketService.isConnected() ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-slate-400'}`}></div>
              <span className="text-xs font-medium text-slate-700">
                {websocketService.isConnected() ? 'Live' : 'Offline'}
              </span>
            </div>

            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              Home
            </button>
          </div>
        </div>
      </header>

      {/* Retry System Status Banner */}
      {(migration.status === 'retrying' || (migration as any).retryAttempt) && (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-b-2 border-orange-300 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <span className="text-2xl">🔄</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-orange-900">
                    🤖 Intelligent Retry System Active
                  </h3>
                  <span className="px-3 py-1 bg-orange-200 text-orange-900 text-xs font-bold rounded-full border-2 border-orange-400">
                    RETRY {(migration as any).retryAttempt || 1}/3
                  </span>
                </div>
                <p className="text-sm text-orange-800 mb-3">
                  Critical errors detected. AI is analyzing issues and adjusting generation prompts automatically.
                </p>

                {(migration as any).errorAnalysis && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 border-2 border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-600 font-bold">⚠️</span>
                        <span className="text-xs font-semibold text-slate-700">Critical Issues</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {(migration as any).errorAnalysis?.analysis?.criticalIssues?.length || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border-2 border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-600 font-bold">🤖</span>
                        <span className="text-xs font-semibold text-slate-700">AI Confidence</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">
                        {((migration as any).errorAnalysis?.retryStrategy?.confidence * 100 || 0).toFixed(0)}%
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3 border-2 border-orange-200">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-emerald-600 font-bold">📊</span>
                        <span className="text-xs font-semibold text-slate-700">Success Rate</span>
                      </div>
                      <p className="text-lg font-bold text-emerald-600">
                        {(migration as any).errorAnalysis?.retryStrategy?.estimatedSuccessRate || 'Analyzing'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-orange-700">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-600"></div>
                  <span>Regenerating code with adjusted prompts...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Analysis Available Banner */}
      {migration.status === 'completed_with_errors' && (migration as any).errorAnalysis && (
        <div className="bg-gradient-to-r from-red-50 via-rose-50 to-red-50 border-b-2 border-red-300 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl">❌</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  ⚠️ Migration Completed with Critical Errors
                </h3>
                <p className="text-sm text-red-800 mb-3">
                  Maximum retry attempts (3) reached. Manual review required.
                </p>
                <div className="bg-white rounded-lg p-3 border-2 border-red-200 inline-block">
                  <span className="text-xs font-semibold text-slate-700 mr-2">Critical Issues:</span>
                  <span className="text-xl font-bold text-red-600">
                    {(migration as any).errorAnalysis?.analysis?.criticalIssues?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Professional shadcn style */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <nav className="flex-1 px-3 py-6 space-y-2">
            <button
              onClick={() => setSidebarView('overview')}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-all font-semibold text-sm ${
                sidebarView === 'overview'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => {
                setSidebarView('activity');
                setShowRightPanel(!showRightPanel);
                setSelectedAgent(null);
              }}
              className={`w-full flex items-center justify-center px-4 py-3 rounded-lg transition-all font-semibold text-sm ${
                showRightPanel && sidebarView === 'activity'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30'
                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Activity Feed
            </button>

            {/* Download Button - Always Visible */}
            <button
              onClick={handleDownload}
              disabled={migration.status !== 'completed' && migration.status !== 'completed_with_errors'}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-semibold text-sm ${
                migration.status === 'completed' || migration.status === 'completed_with_errors'
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {migration.status === 'completed' || migration.status === 'completed_with_errors' ? 'Download Code' : 'Not Ready'}
            </button>

            {/* Restart Migration Button */}
            <button
              onClick={handleRestartMigration}
              disabled={restartingMigration || migration.status === 'analyzing'}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-semibold text-sm ${
                !restartingMigration && migration.status !== 'analyzing'
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-300'
              }`}
            >
              {restartingMigration ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Restarting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Restart Migration
                </>
              )}
            </button>
          </nav>

          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Migration ID</p>
                <p className="font-mono text-xs text-slate-700 bg-white px-2 py-1.5 rounded border border-slate-200 truncate">{migration.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Started</p>
                <p className="text-xs text-slate-700">{formatRelativeTime(migration.createdAt)}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Canvas - Professional shadcn style */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-white relative">
          {/* Validation Paused Banner */}
          {migration.status === 'paused' && (
            <div className="sticky top-0 z-50 bg-gradient-to-r from-yellow-50 to-amber-50 border-b-4 border-yellow-400 shadow-lg">
              <div className="max-w-7xl mx-auto px-8 py-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-yellow-900 mb-1">⚠️ Quality Validation Failed</h3>
                      <p className="text-sm text-yellow-800">
                        The generated code failed quality checks. Please review the errors, fix the issues, and retry validation to continue.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRetryValidation}
                    disabled={retryingValidation}
                    className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-bold shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 bg-gradient-to-r from-yellow-600 to-amber-600 text-white hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {retryingValidation ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Retrying...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry Validation
                      </>
                    )}
                  </button>
                </div>

                {/* View validation errors link */}
                <div className="mt-4 flex items-center gap-2 text-sm text-yellow-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Click on the Quality Validator agent to view detailed error logs</span>
                </div>
              </div>
            </div>
          )}

          <div className="p-8 min-h-full" style={{ minWidth: '1600px', minHeight: '700px' }}>
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                {/* Standard arrows */}
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#94A3B8" />
                </marker>
                <marker
                  id="arrowhead-active"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#8B5CF6" />
                </marker>

                {/* Retry loop arrows - Amber (E2E → Retry Planner) */}
                <marker
                  id="arrowhead-retry-input"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 12 3.5, 0 7" fill="#F59E0B" />
                </marker>
                <marker
                  id="arrowhead-retry-input-inactive"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 12 3.5, 0 7" fill="#FDE68A" />
                </marker>

                {/* Feedback loop arrows - Emerald (Retry → Migration) */}
                <marker
                  id="arrowhead-feedback"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 12 3.5, 0 7" fill="#10B981" />
                </marker>
                <marker
                  id="arrowhead-feedback-inactive"
                  markerWidth="12"
                  markerHeight="12"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 12 3.5, 0 7" fill="#D1FAE5" />
                </marker>
              </defs>
              {connections.map((conn, idx) => {
                const fromNode = workflowNodes.find(n => n.id === conn.from);
                const toNode = workflowNodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                let startX = fromNode.position.x + 208; // w-52 = 208px
                let startY = fromNode.position.y + 65;
                let endX = toNode.position.x;
                let endY = toNode.position.y + 65;

                const isActive = fromNode.status === 'completed' && (toNode.status === 'running' || toNode.status === 'completed');

                let pathD = '';
                let strokeColor = isActive ? '#8B5CF6' : '#E2E8F0';
                let strokeWidth = isActive ? '3' : '2';
                let markerEnd = isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)';
                let strokeDasharray = undefined;

                // Special path for retry-planner connections (feedback loop)
                if (conn.from === 'e2e-test-validator' && conn.to === 'retry-planner') {
                  // E2E Test → Retry Planner: Route BELOW avoiding cards
                  // Connect to BOTTOM edge of retry planner card to avoid crossing
                  const cardHeight = 130; // Approximate card height
                  endY = toNode.position.y + cardHeight + 10; // Bottom of card + margin

                  const bottomY = 630; // Safe zone below all cards
                  const cp1x = startX + 50;
                  const cp1y = bottomY;
                  const cp2x = endX + 100;
                  const cp2y = bottomY;
                  pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
                  strokeColor = isActive ? '#F59E0B' : '#FDE68A'; // Amber color for retry input
                  strokeWidth = isActive ? '4' : '2.5';
                  markerEnd = isActive ? 'url(#arrowhead-retry-input)' : 'url(#arrowhead-retry-input-inactive)';
                  strokeDasharray = '8 4'; // Dashed line
                } else if (conn.from === 'retry-planner' && conn.to === 'migration-planner') {
                  // Retry Planner → Migration Planner: Wide arc to the LEFT (avoiding cards)
                  // Start from LEFT edge of retry planner
                  startX = fromNode.position.x; // Left edge instead of right edge
                  startY = fromNode.position.y + 65;

                  const leftX = 30; // Safe zone to the left of all cards
                  const cp1x = leftX;
                  const cp1y = startY;
                  const cp2x = leftX;
                  const cp2y = endY;
                  pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
                  strokeColor = isActive ? '#10B981' : '#D1FAE5'; // Emerald color for feedback
                  strokeWidth = isActive ? '4' : '2.5';
                  markerEnd = isActive ? 'url(#arrowhead-feedback)' : 'url(#arrowhead-feedback-inactive)';
                  strokeDasharray = '10 5'; // Dashed line
                } else {
                  // Standard bezier curve for normal connections
                  const horizontalOffset = 120;
                  const cp1x = startX + horizontalOffset;
                  const cp1y = startY;
                  const cp2x = endX - horizontalOffset;
                  const cp2y = endY;
                  pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
                }

                return (
                  <g key={`conn-${idx}`}>
                    <path
                      d={pathD}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      fill="none"
                      markerEnd={markerEnd}
                      className={isActive ? 'animate-pulse' : ''}
                      strokeDasharray={strokeDasharray}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Workflow Nodes - Professional shadcn style */}
            <div className="relative">
              {workflowNodes.map((node) => (
                <div
                  key={node.id}
                  className="absolute group"
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    zIndex: 10
                  }}
                >
                  <div className="relative">
                    {/* Gradient glow on hover/active */}
                    <div className={`absolute -inset-1 rounded-2xl blur opacity-0 transition-opacity duration-300 ${
                      node.status === 'completed' ? 'bg-gradient-to-r from-emerald-500 to-green-500 group-hover:opacity-30' :
                      node.status === 'running' ? 'bg-gradient-to-r from-violet-500 to-indigo-500 opacity-40 animate-pulse' :
                      node.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-rose-500 group-hover:opacity-30' :
                      'bg-gradient-to-r from-slate-400 to-slate-500 group-hover:opacity-20'
                    }`}></div>

                    <div
                      onClick={() => {
                        if (node.agentName) {
                          // Show agent details in full page
                          setSelectedAgent(node.agentName);
                          setFullScreenMode(true);
                          setShowRightPanel(false);
                        }
                      }}
                      className={`relative w-52 bg-white rounded-xl shadow-lg border-2 cursor-pointer transition-all hover:shadow-2xl hover:scale-105 ${
                        node.status === 'completed' ? 'border-emerald-500 hover:border-emerald-600' :
                        node.status === 'running' ? 'border-violet-500 hover:border-violet-600' :
                        node.status === 'failed' ? 'border-red-500 hover:border-red-600' :
                        'border-slate-300 hover:border-slate-400'
                      } ${selectedAgent === node.agentName ? 'ring-4 ring-violet-300 scale-105' : ''}`}
                    >
                      {/* Node Header */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                            node.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            node.status === 'running' ? 'bg-violet-100 text-violet-700' :
                            node.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {node.label}
                          </span>
                          {node.status === 'running' && (
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight mb-1">{node.title}</h3>
                        {node.subtitle && (
                          <p className="text-xs text-slate-600 line-clamp-2">{node.subtitle}</p>
                        )}
                      </div>

                      {/* Status Footer */}
                      <div className={`px-4 py-2.5 rounded-b-xl ${
                        node.status === 'completed' ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-t border-emerald-100' :
                        node.status === 'running' ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border-t border-violet-100' :
                        node.status === 'failed' ? 'bg-gradient-to-r from-red-50 to-rose-50 border-t border-red-100' :
                        'bg-slate-50 border-t border-slate-100'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold flex items-center gap-1 ${
                            node.status === 'completed' ? 'text-emerald-700' :
                            node.status === 'running' ? 'text-violet-700' :
                            node.status === 'failed' ? 'text-red-700' :
                            'text-slate-600'
                          }`}>
                            {node.status === 'running' && '⚡'}
                            {node.status === 'completed' && '✓'}
                            {node.status === 'failed' && '✗'}
                            <span>{node.status.charAt(0).toUpperCase() + node.status.slice(1)}</span>
                          </span>
                          {node.agentName && (
                            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Panel - Activity or Agent Details */}
        {showRightPanel && (
          <aside className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            {selectedAgent === 'container-deployer' ? (
              // Deployment View Panel
              <div>
                <div className="p-4 border-b border-gray-200">
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-2">DEPLOYMENT</span>
                    <h3 className="font-bold text-gray-900 text-lg">Container Status</h3>
                    <p className="text-xs text-gray-500 mt-1">Running services and frontends</p>
                  </div>
                  {deploymentData && (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      deploymentData.status === 'running' ? 'bg-green-100 text-green-700' :
                      deploymentData.status === 'building' ? 'bg-blue-100 text-blue-700' :
                      deploymentData.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {deploymentData.status}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-6">
                  {!deploymentData ? (
                    <div className="text-center py-8 text-gray-400">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                      <p className="text-sm">Loading deployment data...</p>
                    </div>
                  ) : (
                    <>
                      {/* Frontend Links - Prominent */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                          Frontend Applications
                        </h4>
                        <div className="space-y-2">
                          {deploymentData.microFrontends?.map((frontend: any) => (
                            <a
                              key={frontend.name}
                              href={frontend.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-3 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg border-2 border-violet-200 hover:border-violet-400 transition-all hover:shadow-lg group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-violet-900">{frontend.name}</span>
                                    <span className={`w-2 h-2 rounded-full ${
                                      frontend.status === 'running' ? 'bg-green-500 animate-pulse' :
                                      frontend.status === 'starting' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}></span>
                                  </div>
                                  <div className="text-xs text-violet-600 mt-1 font-mono">
                                    localhost:{frontend.port}
                                  </div>
                                </div>
                                <svg className="w-5 h-5 text-violet-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Microservices */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                          Microservices
                        </h4>
                        <div className="space-y-2">
                          {deploymentData.services?.map((service: any) => (
                            <div
                              key={service.name}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 text-sm">{service.name}</span>
                                    <span className={`w-2 h-2 rounded-full ${
                                      service.status === 'running' ? 'bg-green-500 animate-pulse' :
                                      service.status === 'starting' ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}></span>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-xs">
                                    <a
                                      href={service.apiUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 font-mono"
                                    >
                                      :{service.port}
                                    </a>
                                    {service.healthUrl && (
                                      <a
                                        href={service.healthUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        health
                                      </a>
                                    )}
                                  </div>
                                </div>
                                {service.status === 'running' && (
                                  <span className="text-xs text-green-600 font-medium">✓</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Database */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                          Database
                        </h4>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-blue-900 text-sm">PostgreSQL</div>
                              <div className="text-xs text-blue-600 mt-1">localhost:5432</div>
                            </div>
                            <span className="text-xs text-blue-600 font-medium">✓ Running</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      {/* Deployment Failed */}
                      {deploymentData.status === 'failed' && (
                        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-bold text-red-900 mb-1">Deployment Failed</h4>
                              <p className="text-xs text-red-700 mb-2">The container deployment encountered an error.</p>

                              {/* Error Message */}
                              {deploymentData.error && (
                                <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded text-xs text-red-800 font-mono">
                                  <div className="font-bold mb-1">Error Details:</div>
                                  {deploymentData.error}
                                </div>
                              )}

                              {/* Common Issues */}
                              <div className="mt-3 text-xs text-red-700">
                                <div className="font-semibold mb-1">Common causes:</div>
                                <ul className="list-disc list-inside space-y-1 text-red-600">
                                  <li>Docker is not running</li>
                                  <li>Port already in use</li>
                                  <li>Insufficient disk space</li>
                                  <li>Build compilation errors</li>
                                </ul>
                              </div>

                              {/* Retry Suggestion */}
                              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                <strong>Tip:</strong> Check the Container Deployer logs in the output panel for detailed error information.
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Deployment Progress */}
                      {deploymentData.status !== 'running' && deploymentData.status !== 'failed' && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                            <span className="text-sm font-medium text-blue-900">
                              {deploymentData.status === 'building' ? 'Building Docker images...' :
                               deploymentData.status === 'deploying' ? 'Starting containers...' :
                               'Preparing deployment...'}
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${
                                  deploymentData.status === 'building' ? '40%' :
                                  deploymentData.status === 'deploying' ? '70%' :
                                  '20%'
                                }%`
                              }}
                            ></div>
                          </div>

                          {/* Service Status */}
                          {(deploymentData.services?.length > 0 || deploymentData.microFrontends?.length > 0) && (
                            <div className="text-xs text-blue-700 space-y-1">
                              {deploymentData.services?.filter((s: any) => s.status === 'running').length > 0 && (
                                <div>✓ {deploymentData.services.filter((s: any) => s.status === 'running').length}/{deploymentData.services.length} services healthy</div>
                              )}
                              {deploymentData.microFrontends?.filter((f: any) => f.status === 'running').length > 0 && (
                                <div>✓ {deploymentData.microFrontends.filter((f: any) => f.status === 'running').length}/{deploymentData.microFrontends.length} frontends ready</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h4>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              if (deploymentData.status === 'running' && deploymentData.microFrontends?.[0]?.url) {
                                window.open(deploymentData.microFrontends[0].url, '_blank');
                              }
                            }}
                            disabled={deploymentData.status !== 'running'}
                            className={`w-full px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                              deploymentData.status === 'running'
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg cursor-pointer'
                                : deploymentData.status === 'failed'
                                ? 'bg-red-200 text-red-700 cursor-not-allowed'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {deploymentData.status === 'failed' ? 'Deployment Failed' : 'Open Application'}
                            {deploymentData.status !== 'running' && deploymentData.status !== 'failed' && (
                              <span className="text-xs block mt-1 font-normal">Waiting for deployment...</span>
                            )}
                            {deploymentData.status === 'failed' && (
                              <span className="text-xs block mt-1 font-normal">Cannot open - deployment failed</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Network Info */}
                      {deploymentData.networkName && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Docker Network</div>
                          <div className="font-mono text-xs text-gray-700">{deploymentData.networkName}</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : selectedAgent && selectedNode ? (
            // Agent Details Panel
            <div>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex-1">
                  <span className="inline-block px-3 py-1 bg-violet-100 text-violet-700 text-xs font-bold rounded-full mb-2">{selectedNode.label}</span>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedNode.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{selectedNode.team}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedAgent(null);
                    setShowRightPanel(false);
                  }}
                  className="px-3 py-2 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-600"
                >
                  Close
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Status */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Status</h4>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAgentProgress?.status === 'completed' ? 'bg-green-100 text-green-700' :
                    selectedAgentProgress?.status === 'running' ? 'bg-blue-100 text-blue-700' :
                    selectedAgentProgress?.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {selectedAgentProgress?.status || 'pending'}
                  </span>
                </div>

                {/* Tools */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Tools Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.tools?.map(tool => (
                      <span key={tool} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-200">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                {/* System Prompt */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">System Prompt</h4>
                  <div className="bg-gray-900 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedAgent === 'code-analyzer' && codeAnalyzerPrompt
                        ? codeAnalyzerPrompt
                        : selectedNode.systemPrompt}
                    </pre>
                  </div>
                  {selectedAgent === 'code-analyzer' && !codeAnalyzerPrompt && (
                    <p className="text-xs text-gray-500 mt-2 italic">Loading real prompt from ARK agent...</p>
                  )}
                </div>

                {/* Output */}
                {selectedAgentProgress?.output && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Output</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
                      <AgentOutputVisualizer
                        agentName={selectedAgent}
                        output={typeof selectedAgentProgress.output === 'string'
                          ? selectedAgentProgress.output
                          : JSON.stringify(selectedAgentProgress.output, null, 2)}
                        migrationId={migrationId || ''}
                      />
                    </div>
                  </div>
                )}

                {/* Duration */}
                {selectedAgentProgress?.startedAt && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Duration</h4>
                    <p className="text-sm text-gray-600">
                      {selectedAgentProgress.completedAt
                        ? `${Math.round((new Date(selectedAgentProgress.completedAt).getTime() - new Date(selectedAgentProgress.startedAt).getTime()) / 1000)}s`
                        : 'Running...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Activity Feed
            <div>
              <div className="p-4 border-b border-gray-200">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-2">LIVE UPDATES</span>
                <h3 className="font-bold text-gray-900 text-lg">Activity Feed</h3>
                <p className="text-xs text-gray-500 mt-1">Real-time migration events</p>
              </div>
              <div className="p-4 space-y-2">
                {activityFeed.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm font-medium">Waiting for events...</p>
                  </div>
                ) : (
                  activityFeed.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold flex-shrink-0 ${
                          event.type === 'agent-started' ? 'bg-blue-100 text-blue-700' :
                          event.type === 'agent-completed' ? 'bg-green-100 text-green-700' :
                          event.type === 'agent-progress' ? 'bg-yellow-100 text-yellow-700' :
                          event.type === 'migration-completed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {
                            event.type === 'agent-started' ? 'START' :
                            event.type === 'agent-completed' ? 'DONE' :
                            event.type === 'agent-progress' ? 'RUN' :
                            event.type === 'migration-completed' ? 'SUCCESS' :
                            'INFO'
                          }
                        </span>
                        <div className="flex-1 min-w-0">
                          {event.agent && (
                            <div className="text-xs font-bold text-gray-700 mb-1">
                              {event.agent.replace(/-/g, ' ').toUpperCase()}
                            </div>
                          )}
                          <p className="text-xs text-gray-600 break-words">{event.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          </aside>
        )}
      </div>
    </div>
  );
}

// Component to display agent prompt in dashboard
function AgentPromptInDashboard({
  agentName,
  codeAnalyzerPrompt,
}: {
  agentName: string;
  codeAnalyzerPrompt: string | null;
}) {
  const [loading, setLoading] = useState(!codeAnalyzerPrompt);

  if (agentName === 'code-analyzer') {
    if (loading && !codeAnalyzerPrompt) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500 mx-auto mb-2"></div>
            <p className="text-xs text-slate-400">Loading prompt...</p>
          </div>
        </div>
      );
    }

    return (
      <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
        {codeAnalyzerPrompt || 'Prompt not loaded'}
      </pre>
    );
  }

  return <p className="text-xs text-slate-400">Prompt not available</p>;
}
