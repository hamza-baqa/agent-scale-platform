export interface MigrationRequest {
  repoUrl: string;
  options?: MigrationOptions;
}

export interface MigrationOptions {
  targetStack?: 'angular-springboot' | 'react-nodejs';
  includeDocs?: boolean;
  includeTests?: boolean;
  generateDockerfiles?: boolean;
  generateK8sManifests?: boolean;
}

export interface Migration {
  id: string;
  repoUrl: string;
  status: MigrationStatus;
  options: MigrationOptions;
  progress: AgentProgress[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  outputPath?: string;
}

export type MigrationStatus =
  | 'pending'
  | 'cloning'
  | 'analyzing'
  | 'planning'
  | 'generating'
  | 'validating'
  | 'completed'
  | 'failed';

export interface AgentProgress {
  agent: AgentType;
  status: AgentStatus;
  startedAt: Date;
  completedAt?: Date;
  output?: any;
  error?: string;
}

export type AgentType =
  | 'code-analyzer'
  | 'migration-planner'
  | 'service-generator'
  | 'frontend-migrator'
  | 'quality-validator';

export type AgentStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed';

export interface MigrationStatusUpdate {
  agent: AgentType;
  status: AgentStatus;
  output?: any;
  error?: string;
  timestamp: string;
}

export interface MigrationResult {
  id: string;
  status: MigrationStatus;
  summary: {
    servicesGenerated: number;
    frontendsGenerated: number;
    testsGenerated: number;
    filesCreated: number;
  };
  validationReport?: ValidationReport;
  downloadUrl: string;
}

export interface ValidationReport {
  overall: 'pass' | 'fail';
  buildStatus: {
    backend: boolean;
    frontend: boolean;
  };
  testResults: {
    unitTests: TestResult;
    integrationTests: TestResult;
  };
  codeQuality: {
    coverage: number;
    issues: QualityIssue[];
  };
  security: {
    vulnerabilities: SecurityIssue[];
    score: number;
  };
}

export interface TestResult {
  passed: number;
  failed: number;
  total: number;
  coverage: number;
}

export interface QualityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  file?: string;
  line?: number;
}

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  recommendation: string;
}

export interface WebSocketEvent {
  event: 'agent-started' | 'agent-progress' | 'agent-completed' | 'migration-completed' | 'error';
  migrationId: string;
  data: any;
  timestamp: Date;
}
