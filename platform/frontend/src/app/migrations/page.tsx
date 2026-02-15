'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Migration {
  id: string;
  status: string;
  repoUrl?: string;
  repoPath?: string;
  createdAt: string;
  updatedAt: string;
  retryAttempt?: number;
  errorAnalysis?: {
    analysis?: {
      criticalIssues?: any[];
    };
  };
}

export default function MigrationsListPage() {
  const router = useRouter();
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMigrations();
    // Poll every 5 seconds
    const interval = setInterval(fetchMigrations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMigrations = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/migrations');
      if (!response.ok) throw new Error('Failed to fetch migrations');
      const data = await response.json();
      setMigrations(Array.isArray(data) ? data : [data]);
      setError('');
    } catch (err: any) {
      console.error('Error fetching migrations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-slate-100 text-slate-700 border-slate-300',
      analyzing: 'bg-blue-100 text-blue-700 border-blue-300',
      planning: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      generating: 'bg-violet-100 text-violet-700 border-violet-300',
      validating: 'bg-amber-100 text-amber-700 border-amber-300',
      retrying: 'bg-orange-100 text-orange-700 border-orange-300',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      completed_with_errors: 'bg-red-100 text-red-700 border-red-300',
      failed: 'bg-red-100 text-red-700 border-red-300',
    };
    return colors[status] || 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return '✅';
    if (status === 'failed' || status === 'completed_with_errors') return '❌';
    if (status === 'retrying') return '🔄';
    return '🔄';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return date.toLocaleDateString();
  };

  if (loading && migrations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
          <p className="text-slate-600">Loading migrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="px-4 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-white text-lg font-bold">Agent@Scale</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
            </Link>
            <Link
              href="/"
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              ➕ New Migration
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            All Migrations
          </h1>
          <p className="text-slate-600">
            View and manage all your migration processes
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-300 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {migrations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-slate-200 shadow-sm">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No migrations yet</h3>
            <p className="text-slate-600 mb-6">Start your first migration to see it here</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              ➕ Create Migration
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {migrations.map((migration) => (
              <div
                key={migration.id}
                onClick={() => router.push(`/dashboard?id=${migration.id}`)}
                className="group bg-white rounded-xl border-2 border-slate-200 hover:border-violet-400 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                          {migration.repoPath || migration.repoUrl || 'Unnamed Migration'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(migration.status)}`}>
                          {getStatusIcon(migration.status)} {migration.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>🆔 {migration.id.substring(0, 8)}...</span>
                        <span>📅 {formatDate(migration.createdAt)}</span>
                        {migration.retryAttempt && (
                          <span className="text-orange-600 font-semibold">
                            🔄 Retry {migration.retryAttempt}/3
                          </span>
                        )}
                        {migration.errorAnalysis?.analysis?.criticalIssues &&
                         migration.errorAnalysis.analysis.criticalIssues.length > 0 && (
                          <span className="text-red-600 font-semibold">
                            ⚠️ {migration.errorAnalysis.analysis.criticalIssues.length} Critical Issues
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard?id=${migration.id}`);
                        }}
                        className="px-4 py-2 bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 rounded-lg transition-colors text-sm font-medium border-2 border-slate-200 hover:border-violet-300"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>

                  {/* Progress hint */}
                  {(migration.status === 'analyzing' ||
                    migration.status === 'planning' ||
                    migration.status === 'generating' ||
                    migration.status === 'validating' ||
                    migration.status === 'retrying') && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                        <span>Migration in progress... Click to view real-time updates</span>
                      </div>
                    </div>
                  )}

                  {migration.status === 'completed' && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-emerald-600">
                        <span>✅ Migration completed successfully - Ready to download</span>
                      </div>
                    </div>
                  )}

                  {(migration.status === 'completed_with_errors' || migration.status === 'failed') && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <span>❌ Migration completed with errors - Review required</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-600">
          <p>Agent@Scale Platform - Intelligent Code Migration with AI</p>
          <p className="mt-2">Auto-refreshes every 5 seconds</p>
        </div>
      </footer>
    </div>
  );
}
