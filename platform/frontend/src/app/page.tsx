'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import migrationService from '@/services/migrationService';

export default function HomePage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agentPrompts, setAgentPrompts] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response: any = await migrationService.createMigration({
        repoUrl,
        options: {
          includeDocs: true,
          includeTests: true,
          generateDockerfiles: true,
          generateK8sManifests: true,
        },
      });

      const migrationId = response.migrationId || response.id;
      router.push(`/dashboard?id=${migrationId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to start migration');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header - Professional shadcn style */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative px-4 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg shadow-lg shadow-violet-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-white text-lg font-bold tracking-tight">Agent@Scale</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="border-l border-slate-200 pl-3">
                <p className="text-xs text-slate-600 font-medium">by McKinsey & Company</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <button
                onClick={() => router.push('/migrations')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-slate-100 h-10 px-4 py-2 gap-2"
              >
                📋 View All Migrations
              </button>
              <button
                onClick={() => router.push('/activity')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-slate-100 h-10 px-4 py-2 gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Activity
              </button>
              <a
                href="https://github.com/mckinsey/ark"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-slate-100 h-10 px-4 py-2"
              >
                Documentation
              </a>
              <a
                href="https://docs.n8n.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-slate-100 h-10 px-4 py-2"
              >
                API Reference
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-24">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 rounded-full border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-6 py-2 text-sm font-semibold shadow-sm mb-8 transition-all hover:shadow-md hover:scale-105">
            <span className="text-violet-700">Powered by AI Agents</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
          </div>
          <h2 className="text-6xl font-bold tracking-tight mb-6 leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              Agentic Code Transformation
            </span>
            <br />
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              at Scale
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
            Intelligent ARK agents automatically migrate your banking application from monolith to
            <span className="font-semibold text-slate-900"> microservices and micro-frontends</span> in real-time.
          </p>
        </div>

        {/* Form Card */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-16">
            <div className="mb-8 pb-6 border-b border-slate-100">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent mb-2">Start Migration</h3>
              <p className="text-sm text-slate-600">Enter your repository to begin the transformation journey</p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="repoUrl"
                className="text-sm font-semibold text-slate-900"
              >
                Repository URL or Local Path
              </label>
              <input
                type="text"
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="/home/user/my-banking-app"
                className="flex h-14 w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm hover:border-slate-400"
                required
                disabled={loading}
              />
              <p className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
                <span className="font-medium">Tip:</span> Enter GitHub URL or absolute path to local repository
              </p>
            </div>

            {error && (
              <div className="rounded-lg border-2 border-red-300 bg-gradient-to-r from-red-50 to-rose-50 p-4">
                <div>
                  <h4 className="text-sm font-bold text-red-900 mb-1">Migration Failed</h4>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !repoUrl}
              className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Starting Migration...' : 'Start Migration Now'}
            </button>
          </form>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-lg hover:shadow-violet-500/10 hover:border-violet-300 transition-all duration-300">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-violet-100 to-violet-200 text-violet-700 text-xs font-bold rounded-full">REAL-TIME</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Live Visualization</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Watch AI agents work live with progress bars and status updates in a visual workflow
            </p>
          </div>

          <div className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-300 transition-all duration-300">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 text-xs font-bold rounded-full">QUALITY</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Automated Validation</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Automated testing and security scanning of generated code with comprehensive reports
            </p>
          </div>

          <div className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-300 transition-all duration-300">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-700 text-xs font-bold rounded-full">EXPORT</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">Complete Package</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Get complete microservices and micro-frontends with Docker and Kubernetes configs
            </p>
          </div>
        </div>

        {/* Migration Steps Preview */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 rounded-full blur-3xl"></div>

          <div className="relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 rounded-full border-2 border-slate-200 bg-white px-6 py-2 text-sm font-semibold shadow-sm mb-4">
                <span className="text-slate-700">3-Step Process</span>
              </div>
              <h3 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
                Migration Process
              </h3>
              <p className="text-slate-600">From discovery to deployment in three intelligent phases</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
                <div className="relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-cyan-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-2xl font-bold shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
                      1
                    </div>
                    <span className="px-3 py-1 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full uppercase tracking-wide">Discovery</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3 text-xl">Reverse-engineer</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Understanding "why" the processes and systems exist through intelligent code analysis and pattern recognition
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
                <div className="relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-2xl font-bold shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                      2
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide">Planning</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3 text-xl">Shape</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Comprehensive document generation and specification rationalization for the new architecture
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
                <div className="relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-2xl font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                      3
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wide">Transform</span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-3 text-xl">Modernize</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Complete transformation with code policies, data migration, and modern architecture patterns
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agents Section - Click to see prompts */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 rounded-full border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-6 py-2 text-sm font-semibold shadow-sm mb-4">
              <span className="text-violet-700">ARK Agents</span>
            </div>
            <h3 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
              Intelligent Agents
            </h3>
            <p className="text-slate-600">Click on any agent to see the AI prompt</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Code Analyzer Agent */}
            <button
              onClick={() => setSelectedAgent('code-analyzer')}
              className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-violet-300 transition-all duration-300 text-left"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 text-white text-sm font-bold shadow-lg">
                    <span>🔍</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">Code Analyzer</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  AI-powered code analysis using ARK agent to extract entities, controllers, and services
                </p>
                <span className="inline-flex items-center gap-2 text-xs text-violet-600 font-semibold group-hover:gap-3 transition-all">
                  View Prompt <span>→</span>
                </span>
              </div>
            </button>

            {/* Migration Planner Agent */}
            <button
              onClick={() => setSelectedAgent('migration-planner')}
              className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-blue-300 transition-all duration-300 text-left"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-sm font-bold shadow-lg">
                    <span>📋</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">Migration Planner</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Creates migration blueprint and architecture for microservices decomposition
                </p>
                <span className="inline-flex items-center gap-2 text-xs text-blue-600 font-semibold group-hover:gap-3 transition-all">
                  View Prompt <span>→</span>
                </span>
              </div>
            </button>

            {/* Service Generator Agent */}
            <button
              onClick={() => setSelectedAgent('service-generator')}
              className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-emerald-300 transition-all duration-300 text-left"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 text-white text-sm font-bold shadow-lg">
                    <span>⚙️</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">Service Generator</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Generates production-ready Spring Boot microservices with entities and APIs
                </p>
                <span className="inline-flex items-center gap-2 text-xs text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                  View Prompt <span>→</span>
                </span>
              </div>
            </button>

            {/* Frontend Migrator Agent */}
            <button
              onClick={() => setSelectedAgent('frontend-migrator')}
              className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-amber-300 transition-all duration-300 text-left"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg">
                    <span>🎨</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">Frontend Migrator</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Creates Angular micro-frontends with Module Federation architecture
                </p>
                <span className="inline-flex items-center gap-2 text-xs text-amber-600 font-semibold group-hover:gap-3 transition-all">
                  View Prompt <span>→</span>
                </span>
              </div>
            </button>

            {/* Quality Validator Agent */}
            <button
              onClick={() => setSelectedAgent('quality-validator')}
              className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-rose-300 transition-all duration-300 text-left"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 text-white text-sm font-bold shadow-lg">
                    <span>✓</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">Quality Validator</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Validates generated code with automated testing and security scanning
                </p>
                <span className="inline-flex items-center gap-2 text-xs text-rose-600 font-semibold group-hover:gap-3 transition-all">
                  View Prompt <span>→</span>
                </span>
              </div>
            </button>

            {/* Container Deployer Agent */}
            <button
              onClick={() => setSelectedAgent('container-deployer')}
              className="group relative bg-white rounded-xl border-2 border-slate-200 p-6 hover:shadow-xl hover:border-indigo-300 transition-all duration-300 text-left"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition duration-500"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold shadow-lg">
                    <span>🚀</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">Container Deployer</h4>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Deploys the application with Docker containers and Kubernetes manifests
                </p>
                <span className="inline-flex items-center gap-2 text-xs text-indigo-600 font-semibold group-hover:gap-3 transition-all">
                  View Prompt <span>→</span>
                </span>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Agent Prompt Modal */}
      {selectedAgent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {selectedAgent === 'code-analyzer' && '🔍 Code Analyzer Prompt'}
                  {selectedAgent === 'migration-planner' && '📋 Migration Planner Prompt'}
                  {selectedAgent === 'service-generator' && '⚙️ Service Generator Prompt'}
                  {selectedAgent === 'frontend-migrator' && '🎨 Frontend Migrator Prompt'}
                  {selectedAgent === 'quality-validator' && '✓ Quality Validator Prompt'}
                  {selectedAgent === 'container-deployer' && '🚀 Container Deployer Prompt'}
                </h3>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <AgentPromptDisplay agent={selectedAgent} prompts={agentPrompts} setPrompts={setAgentPrompts} />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-24">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <div className="mb-4">
                <div className="inline-block px-4 py-2 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg shadow-lg shadow-violet-500/20 mb-3">
                  <h3 className="font-bold text-white text-lg tracking-tight">Agent@Scale</h3>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enterprise-grade agentic code transformation platform by McKinsey & Company
              </p>
            </div>

            {/* Technology */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Powered By</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                  Claude Sonnet 4.5 AI
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                  ARK (Agentic Runtime)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                  n8n Workflow Automation
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">Resources</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://github.com/mckinsey/ark"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:text-violet-600 transition-colors font-medium"
                  >
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.n8n.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:text-violet-600 transition-colors font-medium"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <a
                    href="https://docs.n8n.io/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:text-violet-600 transition-colors font-medium"
                  >
                    API Reference
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600 font-medium">
              © 2026 Agent@Scale. Built with Claude Sonnet 4.5
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Version 1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component to fetch and display agent prompts
function AgentPromptDisplay({
  agent,
  prompts,
  setPrompts,
}: {
  agent: string;
  prompts: Record<string, string>;
  setPrompts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrompt = async () => {
      // Check if we already have the prompt cached
      if (prompts[agent]) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        // For code-analyzer, fetch from the API
        if (agent === 'code-analyzer') {
          const response = await fetch('http://localhost:4000/api/repo-migration/code-analyzer-prompt');
          if (response.ok) {
            const data = await response.json();
            setPrompts((prev) => ({ ...prev, [agent]: data.promptTemplate }));
          } else {
            throw new Error('Failed to fetch prompt');
          }
        } else {
          // For other agents, use static prompts (can be enhanced later)
          const staticPrompts: Record<string, string> = {
            'migration-planner': `You are a software architect specializing in microservices and micro-frontends.
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
            'service-generator': `You are a Spring Boot expert. Generate production-ready microservices code.

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
10. Tests (unit and integration)

Ensure code follows best practices: proper error handling, validation, logging, and documentation.`,
            'frontend-migrator': `You are an Angular and Webpack Module Federation expert.

Generate micro-frontends using:
1. Angular 17+ with standalone components
2. Webpack Module Federation for runtime integration
3. Shared libraries for common code
4. Routing with lazy loading
5. State management (NgRx or services)
6. Material Design UI components
7. TypeScript with strict mode
8. Unit tests (Jasmine/Jest)
9. E2E tests (Cypress)

Each micro-frontend should be:
- Independently deployable
- Loosely coupled
- Well-documented
- Production-ready`,
            'quality-validator': `You are a QA and DevOps expert. Validate the generated code:

1. Code Quality:
   - Run linters (ESLint, TSLint, Checkstyle)
   - Check code coverage (minimum 70%)
   - Verify coding standards compliance
   - Check for security vulnerabilities

2. Build Verification:
   - Compile all services
   - Run unit tests
   - Run integration tests
   - Build Docker images

3. Security Scanning:
   - Dependency vulnerability check
   - OWASP security scan
   - Check for hardcoded secrets

4. Architecture Validation:
   - Verify service boundaries
   - Check API contracts
   - Validate database schemas

Output a comprehensive validation report with pass/fail status and recommendations.`,
            'container-deployer': `You are a DevOps and containerization expert. Deploy the generated application:

1. Docker Setup:
   - Build optimized Docker images
   - Create docker-compose.yml for local development
   - Configure networking and volumes
   - Set up environment variables

2. Kubernetes Deployment:
   - Create Deployment manifests
   - Configure Services (ClusterIP, LoadBalancer)
   - Set up Ingress rules
   - Configure ConfigMaps and Secrets
   - Define ResourceQuotas and LimitRanges

3. Monitoring:
   - Prometheus metrics
   - Grafana dashboards
   - Logging (ELK stack)
   - Health checks and readiness probes

4. CI/CD Pipeline:
   - GitHub Actions workflow
   - Automated testing
   - Container registry push
   - Deployment automation

Ensure production-ready deployment with high availability and scalability.`,
          };

          setPrompts((prev) => ({
            ...prev,
            [agent]: staticPrompts[agent] || 'Prompt not available',
          }));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load prompt');
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [agent, prompts, setPrompts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-semibold">Failed to load prompt</p>
        <p className="text-sm text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-slate-600">
          This is the prompt sent to the AI agent. The agent uses these instructions to perform its task.
        </p>
      </div>

      <div className="bg-slate-900 rounded-lg p-6 overflow-x-auto">
        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
          {prompts[agent] || 'Loading...'}
        </pre>
      </div>

      {agent === 'code-analyzer' && (
        <div className="mt-4 bg-violet-50 border border-violet-200 rounded-lg p-4">
          <p className="text-sm text-violet-800">
            <span className="font-semibold">Note:</span> This prompt is loaded dynamically from the ARK agent system.
            The actual prompt includes your source code files when analysis runs.
          </p>
        </div>
      )}
    </div>
  );
}
