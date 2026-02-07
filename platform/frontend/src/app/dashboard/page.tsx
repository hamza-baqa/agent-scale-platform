'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import migrationService from '@/services/migrationService';
import websocketService from '@/services/websocketService';
import { Migration, AgentProgress } from '@/types/migration.types';
import { formatRelativeTime } from '@/utils/formatting';
import AgentOutputVisualizer from '@/components/AgentOutputVisualizer';

interface ActivityEvent {
  id: string;
  timestamp: Date;
  type: 'agent-started' | 'agent-progress' | 'agent-completed' | 'migration-completed' | 'info';
  agent?: string;
  message: string;
  progress?: number;
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
  icon?: string;
  systemPrompt?: string;
  tools?: string[];
}

// Agent configurations with full details
const AGENT_CONFIGS: Record<string, any> = {
  'code-analyzer': {
    title: 'Code Analyzer',
    description: 'Extract entities, services, APIs from legacy code',
    icon: '🔍',
    team: 'Step 1: Reverse-engineer',
    tools: ['file-reader', 'ast-parser', 'code-scanner', 'dependency-analyzer'],
    systemPrompt: `You are a code analysis expert specializing in Spring Boot and Blazor applications.
Your task is to analyze the banque-app-main codebase and extract:
1. All JPA entities and their relationships
2. Service layer boundaries and business logic
3. REST API endpoints and contracts
4. Frontend components and page structure
5. Security configuration and authentication flows
6. Database schemas and data models

Output a comprehensive JSON report with all findings organized by domain (Auth, Client, Account, Transaction, Card).`,
  },
  'migration-planner': {
    title: 'Migration Planner',
    description: 'Create migration blueprint and architecture',
    icon: '📐',
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
    icon: '⚙️',
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
    icon: '🎨',
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
  'quality-validator': {
    title: 'Quality Validator',
    description: 'Validate code quality and security',
    icon: '✅',
    team: 'Step 3: Modernize',
    tools: ['maven-build', 'test-runner', 'sonarqube-scanner', 'owasp-dependency-check'],
    systemPrompt: `You are a QA and DevOps expert. Validate the generated code:

1. Build Validation:
   - Compile all Spring Boot services (mvn clean install)
   - Build all Angular applications (ng build)
   - Check for compilation errors

2. Test Validation:
   - Run unit tests (mvn test, ng test)
   - Check code coverage (minimum 70%)
   - Run integration tests

3. Security Validation:
   - Scan dependencies for vulnerabilities
   - Check for hardcoded secrets
   - Validate JWT implementation
   - OWASP security checks

4. Code Quality:
   - SonarQube analysis
   - Code style checks

Generate a comprehensive quality report with pass/fail status.`,
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
        addActivity('info', undefined, 'Connecting to real-time updates...');
        await websocketService.connect();
        addActivity('info', undefined, 'Connected! Subscribing to migration...');
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

    const handleMigrationCompleted = (data: any) => {
      if (data.migrationId === migrationId) {
        addActivity('migration-completed', undefined, '🎉 Migration completed successfully!');
        setMigration((prev) => {
          if (!prev) return prev;
          return { ...prev, status: 'completed', completedAt: new Date().toISOString() };
        });
      }
    };

    websocketService.on('agent-started', handleAgentStarted);
    websocketService.on('agent-progress', handleAgentProgress);
    websocketService.on('agent-completed', handleAgentCompleted);
    websocketService.on('migration-completed', handleMigrationCompleted);

    return () => {
      websocketService.off('agent-started', handleAgentStarted);
      websocketService.off('agent-progress', handleAgentProgress);
      websocketService.off('agent-completed', handleAgentCompleted);
      websocketService.off('migration-completed', handleMigrationCompleted);
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
      icon: '📁'
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
      icon: AGENT_CONFIGS['code-analyzer'].icon,
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
      icon: AGENT_CONFIGS['migration-planner'].icon,
      systemPrompt: AGENT_CONFIGS['migration-planner'].systemPrompt,
      tools: AGENT_CONFIGS['migration-planner'].tools
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
      icon: AGENT_CONFIGS['service-generator'].icon,
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
      icon: AGENT_CONFIGS['frontend-migrator'].icon,
      systemPrompt: AGENT_CONFIGS['frontend-migrator'].systemPrompt,
      tools: AGENT_CONFIGS['frontend-migrator'].tools
    });

    // Step 3: Quality Validator (bottom)
    const qualityVal = getAgentProgress('quality-validator');
    nodes.push({
      id: 'quality-validator',
      agentName: 'quality-validator',
      type: 'agent',
      title: AGENT_CONFIGS['quality-validator'].title,
      subtitle: AGENT_CONFIGS['quality-validator'].description,
      team: AGENT_CONFIGS['quality-validator'].team,
      status: qualityVal?.status || 'pending',
      position: { x: 1000, y: 500 },
      icon: AGENT_CONFIGS['quality-validator'].icon,
      systemPrompt: AGENT_CONFIGS['quality-validator'].systemPrompt,
      tools: AGENT_CONFIGS['quality-validator'].tools
    });

    // Success node
    nodes.push({
      id: 'success',
      type: 'success',
      title: 'Success',
      subtitle: 'Download Results',
      status: migration?.status === 'completed' ? 'completed' : 'pending',
      position: { x: 1350, y: 300 },
      icon: '✅'
    });

    return nodes;
  };

  const workflowNodes = buildWorkflowNodes();

  // Define connections
  const connections = [
    { from: 'trigger', to: 'code-analyzer' },
    { from: 'code-analyzer', to: 'migration-planner' },
    { from: 'migration-planner', to: 'service-generator' },
    { from: 'migration-planner', to: 'frontend-migrator' },
    { from: 'migration-planner', to: 'quality-validator' },
    { from: 'service-generator', to: 'success' },
    { from: 'frontend-migrator', to: 'success' },
    { from: 'quality-validator', to: 'success' },
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
          <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-red-200">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-red-600">Error</h2>
                <p className="text-sm text-slate-500">Something went wrong</p>
              </div>
            </div>
            <p className="text-slate-700 mb-6">{error || 'Migration not found'}</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedNode = selectedAgent ? workflowNodes.find(n => n.agentName === selectedAgent) : null;
  const selectedAgentProgress = selectedAgent ? getAgentProgress(selectedAgent) : null;

  // Full screen agent output view
  if (fullScreenMode && selectedAgent && selectedAgentProgress?.output) {
    return (
      <div className="h-screen flex flex-col bg-white">
        {/* Full Screen Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setFullScreenMode(false);
                setSelectedAgent(null);
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="h-8 w-px bg-gray-300"></div>
            {selectedNode && (
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedNode.icon}</span>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{selectedNode.title}</h1>
                  <p className="text-sm text-gray-500">{selectedNode.team}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              selectedAgentProgress?.status === 'completed' ? 'bg-green-100 text-green-700' :
              selectedAgentProgress?.status === 'running' ? 'bg-blue-100 text-blue-700' :
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
        <div className="flex-1 overflow-auto">
          <AgentOutputVisualizer
            agentName={selectedAgent}
            output={typeof selectedAgentProgress.output === 'string'
              ? selectedAgentProgress.output
              : JSON.stringify(selectedAgentProgress.output, null, 2)}
            migrationId={migrationId || ''}
          />
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
              <div className="relative w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
                <span className="text-white text-lg font-bold">AR</span>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Agent@Scale</h1>
                <p className="text-xs text-slate-500">Migration Workflow</p>
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
                 migration.status === 'running' ? 'Active' : 'Inactive'}
              </span>
              <div className={`w-11 h-6 rounded-full transition-all duration-300 ${
                migration.status === 'running' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : 'bg-slate-300'
              } relative shadow-inner`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-lg ${
                  migration.status === 'running' ? 'translate-x-5' : 'translate-x-0.5'
                }`}></div>
              </div>
            </div>

            {migration.status === 'completed' && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                Download
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white">
              <div className={`w-2 h-2 rounded-full ${websocketService.isConnected() ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500/50' : 'bg-slate-400'}`}></div>
              <span className="text-xs font-medium text-slate-700">
                {websocketService.isConnected() ? 'Live' : 'Offline'}
              </span>
            </div>

            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Professional shadcn style */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
          <nav className="flex-1 px-3 py-6 space-y-1">
            <button
              onClick={() => setSidebarView('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                sidebarView === 'overview'
                  ? 'bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 shadow-sm border border-violet-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-semibold">Overview</span>
            </button>

            <button
              onClick={() => {
                setSidebarView('activity');
                setShowRightPanel(!showRightPanel);
                setSelectedAgent(null);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                showRightPanel && sidebarView === 'activity'
                  ? 'bg-gradient-to-r from-violet-50 to-indigo-50 text-violet-700 shadow-sm border border-violet-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-semibold">Activity</span>
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
          <div className="p-8 min-h-full" style={{ minWidth: '1600px', minHeight: '700px' }}>
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
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
              </defs>
              {connections.map((conn, idx) => {
                const fromNode = workflowNodes.find(n => n.id === conn.from);
                const toNode = workflowNodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                const startX = fromNode.position.x + 208; // w-52 = 208px
                const startY = fromNode.position.y + 65;
                const endX = toNode.position.x;
                const endY = toNode.position.y + 65;

                const isActive = fromNode.status === 'completed' && (toNode.status === 'running' || toNode.status === 'completed');

                // Calculate control points for smooth bezier curve
                // Control points extend horizontally from each node for smooth curves
                const horizontalOffset = 120;
                const cp1x = startX + horizontalOffset;
                const cp1y = startY;
                const cp2x = endX - horizontalOffset;
                const cp2y = endY;

                return (
                  <g key={`conn-${idx}`}>
                    <path
                      d={`M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`}
                      stroke={isActive ? '#8B5CF6' : '#E2E8F0'}
                      strokeWidth={isActive ? '3' : '2'}
                      fill="none"
                      markerEnd={isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                      className={isActive ? 'animate-pulse' : ''}
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
                          setSelectedAgent(node.agentName);
                          setFullScreenMode(true);
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
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${
                            node.status === 'completed' ? 'bg-emerald-50' :
                            node.status === 'running' ? 'bg-violet-50' :
                            node.status === 'failed' ? 'bg-red-50' :
                            'bg-slate-50'
                          }`}>
                            {node.icon}
                          </div>
                          {node.status === 'running' && (
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{node.title}</h3>
                        {node.subtitle && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{node.subtitle}</p>
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
            {selectedAgent && selectedNode ? (
            // Agent Details Panel
            <div>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedNode.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedNode.title}</h3>
                    <p className="text-xs text-gray-500">{selectedNode.team}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAgent(null);
                    setShowRightPanel(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
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
                      {selectedNode.systemPrompt}
                    </pre>
                  </div>
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
                <h3 className="font-semibold text-gray-900">Activity Feed</h3>
                <p className="text-xs text-gray-500 mt-1">Real-time updates</p>
              </div>
              <div className="p-4 space-y-2">
                {activityFeed.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-2xl mb-2">⏳</div>
                    <p className="text-xs">Waiting for events...</p>
                  </div>
                ) : (
                  activityFeed.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg flex-shrink-0">{
                          event.type === 'agent-started' ? '🚀' :
                          event.type === 'agent-completed' ? '✅' :
                          event.type === 'agent-progress' ? '⚙️' :
                          event.type === 'migration-completed' ? '🎉' :
                          'ℹ️'
                        }</span>
                        <div className="flex-1 min-w-0">
                          {event.agent && (
                            <div className="text-xs font-semibold text-gray-700 mb-1">
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
