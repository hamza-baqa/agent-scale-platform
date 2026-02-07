import { AgentType, MigrationStatus, AgentStatus } from '@/types/migration.types';

/**
 * Format agent name for display
 */
export function formatAgentName(agent: AgentType): string {
  const names: Record<AgentType, string> = {
    'code-analyzer': 'Code Analyzer',
    'migration-planner': 'Migration Planner',
    'service-generator': 'Service Generator',
    'frontend-migrator': 'Frontend Migrator',
    'quality-validator': 'Quality Validator',
  };
  return names[agent] || agent;
}

/**
 * Get agent description
 */
export function getAgentDescription(agent: AgentType): string {
  const descriptions: Record<AgentType, string> = {
    'code-analyzer': 'Analyzing codebase structure and extracting domain models',
    'migration-planner': 'Creating detailed migration plan and architecture design',
    'service-generator': 'Generating Spring Boot microservices',
    'frontend-migrator': 'Converting frontend to Angular micro-frontends',
    'quality-validator': 'Running tests and validating generated code',
  };
  return descriptions[agent] || '';
}

/**
 * Get status color
 */
export function getStatusColor(status: AgentStatus | MigrationStatus): string {
  const colors: Record<string, string> = {
    pending: 'text-gray-500',
    running: 'text-blue-500',
    completed: 'text-green-500',
    failed: 'text-red-500',
    cloning: 'text-blue-500',
    analyzing: 'text-blue-500',
    planning: 'text-blue-500',
    generating: 'text-blue-500',
    validating: 'text-blue-500',
  };
  return colors[status] || 'text-gray-500';
}

/**
 * Get status background color
 */
export function getStatusBgColor(status: AgentStatus | MigrationStatus): string {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100',
    running: 'bg-blue-100',
    completed: 'bg-green-100',
    failed: 'bg-red-100',
    cloning: 'bg-blue-100',
    analyzing: 'bg-blue-100',
    planning: 'bg-blue-100',
    generating: 'bg-blue-100',
    validating: 'bg-blue-100',
  };
  return colors[status] || 'bg-gray-100';
}

/**
 * Format duration
 */
export function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const durationMs = end - start;

  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format date/time
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

/**
 * Get language from file extension
 */
export function getLanguageFromExtension(extension: string): string {
  const languages: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    jsx: 'javascript',
    tsx: 'typescript',
    java: 'java',
    xml: 'xml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sh: 'bash',
    py: 'python',
    go: 'go',
    sql: 'sql',
  };
  return languages[extension] || 'text';
}
