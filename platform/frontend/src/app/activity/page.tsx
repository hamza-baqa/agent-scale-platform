'use client';

import { useEffect, useState } from 'react';
import websocketService from '@/services/websocketService';
import { useRouter } from 'next/navigation';

interface LogEvent {
  id: string;
  timestamp: Date;
  migrationId: string;
  agent: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface AgentEvent {
  id: string;
  timestamp: Date;
  type: 'agent-started' | 'agent-completed' | 'agent-progress';
  migrationId: string;
  agent: string;
  message: string;
}

export default function ActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await websocketService.connect();
        setConnected(true);

        // Listen to all events (no specific migration ID)
        websocketService.on('agent-log', (data: any) => {
          const log: LogEvent = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(data.timestamp),
            migrationId: data.migrationId,
            agent: data.agent,
            level: data.level,
            message: data.message,
            data: data.data
          };
          setLogs(prev => [log, ...prev].slice(0, 500));
        });

        websocketService.on('agent-started', (data: any) => {
          const event: AgentEvent = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            type: 'agent-started',
            migrationId: data.migrationId,
            agent: data.agent,
            message: `🚀 Started ${data.agent}`
          };
          setEvents(prev => [event, ...prev].slice(0, 100));
        });

        websocketService.on('agent-completed', (data: any) => {
          const event: AgentEvent = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            type: 'agent-completed',
            migrationId: data.migrationId,
            agent: data.agent,
            message: `✅ Completed ${data.agent}`
          };
          setEvents(prev => [event, ...prev].slice(0, 100));
        });

        websocketService.on('agent-progress', (data: any) => {
          const event: AgentEvent = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            type: 'agent-progress',
            migrationId: data.migrationId,
            agent: data.agent,
            message: `⏳ ${data.agent}: ${Math.round(data.progress)}%`
          };
          setEvents(prev => [event, ...prev].slice(0, 100));
        });
      } catch (error) {
        console.error('WebSocket connection failed:', error);
      }
    };

    connectWebSocket();

    return () => {
      websocketService.off('agent-log');
      websocketService.off('agent-started');
      websocketService.off('agent-completed');
      websocketService.off('agent-progress');
    };
  }, []);

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-white">Live Activity Feed</h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs text-slate-400">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs rounded ${filter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-3 py-1 text-xs rounded ${filter === 'info' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Info
            </button>
            <button
              onClick={() => setFilter('warn')}
              className={`px-3 py-1 text-xs rounded ${filter === 'warn' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Warnings
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 text-xs rounded ${filter === 'error' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Errors
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Events (left sidebar) */}
        <div className="bg-slate-900 rounded-lg border border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-4">Agent Activity</h2>
          <div className="space-y-2 max-h-[800px] overflow-y-auto">
            {events.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">No activity yet</p>
            )}
            {events.map(event => (
              <div
                key={event.id}
                className="p-3 bg-slate-800/50 rounded border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => router.push(`/dashboard?id=${event.migrationId}`)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs text-slate-500 flex-shrink-0">
                    {event.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="text-xs text-white flex-1">{event.message}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  Migration: {event.migrationId.substring(0, 8)}...
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Logs (main area) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-lg border border-slate-800 p-4">
          <h2 className="text-sm font-semibold text-slate-400 mb-4">Real-time Logs</h2>
          <div className="space-y-2 max-h-[800px] overflow-y-auto font-mono text-sm">
            {filteredLogs.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No logs yet</p>
                <p className="text-xs text-slate-600 mt-2">Logs will appear here when agents run</p>
              </div>
            )}
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className={`p-3 rounded border hover:border-slate-600 transition-colors cursor-pointer ${
                  log.level === 'error' ? 'bg-red-900/20 border-red-800' :
                  log.level === 'warn' ? 'bg-yellow-900/20 border-yellow-800' :
                  log.level === 'debug' ? 'bg-blue-900/20 border-blue-800' :
                  'bg-slate-800/50 border-slate-700'
                }`}
                onClick={() => router.push(`/dashboard?id=${log.migrationId}`)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-slate-500 text-xs flex-shrink-0">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={`text-xs font-bold uppercase flex-shrink-0 ${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warn' ? 'text-yellow-400' :
                    log.level === 'debug' ? 'text-blue-400' :
                    'text-emerald-400'
                  }`}>
                    {log.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 whitespace-pre-wrap break-words">{log.message}</p>
                    {log.data && (
                      <pre className="text-xs text-slate-400 mt-2 p-2 bg-slate-950 rounded overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {log.agent} • {log.migrationId.substring(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
