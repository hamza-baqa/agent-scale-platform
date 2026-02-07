'use client';

import { AgentProgress } from '@/types/migration.types';
import {
  formatAgentName,
  getAgentDescription,
  formatDuration,
  getStatusColor,
  getStatusBgColor,
} from '@/utils/formatting';

interface Props {
  agent: AgentProgress;
  index: number;
}

export default function AgentProgressCard({ agent, index }: Props) {
  const getProgressPercentage = (): number => {
    if (agent.status === 'completed') return 100;
    if (agent.status === 'running') return agent.progress || 50;
    return 0;
  };

  const progress = getProgressPercentage();

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full ${getStatusBgColor(agent.status)} flex items-center justify-center font-bold ${getStatusColor(agent.status)}`}
          >
            {index + 1}
          </div>
          <div>
            <h3 className="text-xl font-semibold">{formatAgentName(agent.agent)}</h3>
            <p className="text-gray-600 text-sm">{getAgentDescription(agent.agent)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {agent.status === 'running' && (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          )}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBgColor(agent.status)} ${getStatusColor(agent.status)}`}
          >
            {agent.status === 'completed' && '✓ '}
            {agent.status === 'failed' && '✗ '}
            {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {agent.status !== 'pending' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                agent.status === 'completed'
                  ? 'bg-green-500'
                  : agent.status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-blue-500 animate-pulse'
              }`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Duration */}
      {agent.startedAt && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Duration:</span>{' '}
          {formatDuration(agent.startedAt, agent.completedAt)}
        </div>
      )}

      {/* Output Summary */}
      {agent.output && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold mb-2">Output:</h4>
          <pre className="text-xs text-gray-700 overflow-auto max-h-32">
            {typeof agent.output === 'string'
              ? agent.output
              : JSON.stringify(agent.output, null, 2)}
          </pre>
        </div>
      )}

      {/* Error */}
      {agent.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">Error:</h4>
          <p className="text-sm text-red-700">{agent.error}</p>
        </div>
      )}
    </div>
  );
}
