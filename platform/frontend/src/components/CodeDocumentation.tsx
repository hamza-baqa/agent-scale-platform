'use client';

import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface CodeDocumentationProps {
  data: any;
}

// Mermaid Diagram Component
function MermaidDiagram({ chart, id }: { chart: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      mermaid.initialize({
        startOnLoad: true,
        theme: 'base',
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#2563eb',
          lineColor: '#6366f1',
          secondaryColor: '#8b5cf6',
          tertiaryColor: '#ec4899',
          background: '#ffffff',
          mainBkg: '#dbeafe',
          secondaryBkg: '#ede9fe',
          tertiaryBkg: '#fce7f3',
          textColor: '#1f2937',
          fontSize: '16px'
        }
      });

      mermaid.render(id, chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      }).catch(err => {
        console.error('Mermaid render error:', err);
      });
    }
  }, [chart, id]);

  return <div ref={ref} className="mermaid-diagram flex justify-center p-6 bg-white rounded-lg" />;
}

export default function CodeDocumentation({ data }: CodeDocumentationProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sections = [
    { id: 'overview', label: 'Overview', icon: '📘', color: 'from-blue-500 to-cyan-500' },
    { id: 'architecture', label: 'Architecture', icon: '🏗️', color: 'from-indigo-500 to-purple-500' },
    { id: 'database', label: 'Database', icon: '💾', color: 'from-purple-500 to-pink-500' },
    { id: 'api', label: 'API Docs', icon: '🔌', color: 'from-green-500 to-emerald-500' },
    { id: 'features', label: 'Features', icon: '✨', color: 'from-yellow-500 to-orange-500' },
    { id: 'structure', label: 'Structure', icon: '📁', color: 'from-cyan-500 to-blue-500' },
    { id: 'config', label: 'Configuration', icon: '⚙️', color: 'from-gray-500 to-slate-500' },
    { id: 'development', label: 'Development', icon: '💻', color: 'from-teal-500 to-green-500' },
    { id: 'deployment', label: 'Deployment', icon: '🚀', color: 'from-red-500 to-pink-500' },
    { id: 'security', label: 'Security', icon: '🔒', color: 'from-red-600 to-orange-600' },
    { id: 'performance', label: 'Performance', icon: '⚡', color: 'from-amber-500 to-yellow-500' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧', color: 'from-slate-500 to-gray-500' }
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Floating Header */}
      <div className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        <div className="bg-white/95 backdrop-blur-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{data.title}</h1>
                  <p className="text-sm text-gray-500">Version {data.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Last updated: {new Date(data.lastUpdated).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <div className="col-span-3">
            <div className="sticky top-24 space-y-2">
              <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 px-2">Table of Contents</h3>
                <nav className="space-y-1">
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        activeSection === section.id
                          ? `bg-gradient-to-r ${section.color} text-white shadow-md scale-105`
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="text-xl">{section.icon}</span>
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <h4 className="text-sm font-semibold mb-4 opacity-90">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Entities</span>
                    <span className="text-2xl font-bold">{data.overview.metrics.totalEntities}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Controllers</span>
                    <span className="text-2xl font-bold">{data.overview.metrics.totalControllers}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Endpoints</span>
                    <span className="text-2xl font-bold">{data.overview.metrics.totalEndpoints}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-90">Pages</span>
                    <span className="text-2xl font-bold">{data.overview.metrics.totalPages}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-12 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
                  <div className="relative z-10">
                    <div className="text-6xl mb-6">🏦</div>
                    <h2 className="text-4xl font-bold mb-4">Banking Application</h2>
                    <p className="text-xl text-indigo-100 leading-relaxed max-w-3xl">
                      {data.overview.description}
                    </p>
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.entries(data.overview.metrics).map(([key, value], idx) => {
                    const colors = [
                      'from-blue-500 to-cyan-500',
                      'from-purple-500 to-pink-500',
                      'from-green-500 to-emerald-500',
                      'from-orange-500 to-red-500',
                      'from-indigo-500 to-purple-500',
                      'from-yellow-500 to-orange-500'
                    ];
                    return (
                      <div key={key} className={`bg-gradient-to-br ${colors[idx % colors.length]} rounded-2xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200`}>
                        <div className="text-5xl font-bold mb-2">{value as string}</div>
                        <div className="text-sm opacity-90 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Key Features */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">Key Features</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.overview.keyFeatures.map((feature: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold">✓</span>
                        </div>
                        <span className="text-gray-700 font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Architecture Section */}
            {activeSection === 'architecture' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🏗️</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Application Architecture</h2>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
                    <p className="text-lg text-gray-700 leading-relaxed">{data.architecture.description}</p>
                  </div>

                  {/* Architecture Diagram */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border-2 border-indigo-200 shadow-inner">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">System Architecture Diagram</h3>
                    <MermaidDiagram chart={data.architecture.diagram} id="architecture-diagram" />
                  </div>
                </div>

                {/* Architecture Layers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl p-8 text-white transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-4">🎨</div>
                    <h4 className="text-2xl font-bold mb-3">Frontend Layer</h4>
                    <p className="text-blue-100">Blazor WebAssembly SPA with component-based architecture running entirely in the browser</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-xl p-8 text-white transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-4">⚙️</div>
                    <h4 className="text-2xl font-bold mb-3">Backend Layer</h4>
                    <p className="text-orange-100">Spring Boot REST API with layered architecture - Controllers, Services, and Repositories</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white transform hover:scale-105 transition-transform">
                    <div className="text-6xl mb-4">💾</div>
                    <h4 className="text-2xl font-bold mb-3">Data Layer</h4>
                    <p className="text-purple-100">PostgreSQL/Oracle database with JPA/Hibernate ORM for robust data persistence</p>
                  </div>
                </div>

                {/* Architecture Patterns */}
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Architectural Patterns</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: 'Repository Pattern', desc: 'Abstraction layer between business logic and data access', icon: '📦', color: 'from-blue-500 to-cyan-500' },
                      { name: 'Service Layer Pattern', desc: 'Business logic separated from controllers and data access', icon: '🎯', color: 'from-purple-500 to-pink-500' },
                      { name: 'DTO Pattern', desc: 'Data Transfer Objects for clean API communication', icon: '📋', color: 'from-green-500 to-emerald-500' },
                      { name: 'RESTful API', desc: 'HTTP-based REST architecture with JSON payloads', icon: '🌐', color: 'from-orange-500 to-red-500' }
                    ].map((pattern, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r ${pattern.color} rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <div className="relative bg-gray-50 rounded-2xl p-6 border-2 border-gray-200 group-hover:border-transparent group-hover:shadow-lg transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">{pattern.icon}</span>
                            <h4 className="text-lg font-bold text-gray-900">{pattern.name}</h4>
                          </div>
                          <p className="text-gray-600">{pattern.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Database Section */}
            {activeSection === 'database' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">💾</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Database Schema</h2>
                  </div>

                  {/* ERD Diagram */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 shadow-inner mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Entity Relationship Diagram</h3>
                    <MermaidDiagram chart={data.entities.diagram} id="entities-diagram" />
                  </div>

                  {/* Entity Cards */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Database Entities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.entities.list.map((entity: any, idx: number) => (
                      <div key={idx} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl"></div>
                        <div className="relative bg-white rounded-2xl p-6 border-2 border-gray-200 group-hover:border-transparent shadow-lg group-hover:shadow-2xl transition-all">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                              {entity.name.charAt(0)}
                            </div>
                            <h4 className="text-xl font-bold text-gray-900">{entity.name}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{entity.description}</p>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 font-bold text-sm">{entity.fields}</span>
                              </div>
                              <span className="text-sm text-gray-600">fields</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                                <span className="text-pink-600 font-bold text-sm">{entity.relationships}</span>
                              </div>
                              <span className="text-sm text-gray-600">relations</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* API Section */}
            {activeSection === 'api' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🔌</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">API Documentation</h2>
                  </div>

                  {/* API Diagram */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200 shadow-inner mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">API Structure Overview</h3>
                    <MermaidDiagram chart={data.apiEndpoints.diagram} id="apis-diagram" />
                  </div>

                  {/* API Service Cards */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Endpoints by Service</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {Object.entries(data.apiEndpoints.summary).filter(([key]) => key !== 'total').map(([key, value]: [string, any], idx) => {
                      const services = [
                        { icon: '🔐', name: 'Authentication', color: 'from-red-500 to-orange-500', bg: 'from-red-50 to-orange-50' },
                        { icon: '👤', name: 'Client', color: 'from-green-500 to-emerald-500', bg: 'from-green-50 to-emerald-50' },
                        { icon: '💰', name: 'Account', color: 'from-blue-500 to-cyan-500', bg: 'from-blue-50 to-cyan-50' },
                        { icon: '💸', name: 'Transaction', color: 'from-yellow-500 to-amber-500', bg: 'from-yellow-50 to-amber-50' },
                        { icon: '💳', name: 'Card', color: 'from-purple-500 to-pink-500', bg: 'from-purple-50 to-pink-50' }
                      ];
                      const service = services[idx % services.length];

                      return (
                        <div key={key} className={`bg-gradient-to-br ${service.bg} rounded-2xl p-6 border-2 border-gray-200 hover:shadow-2xl transition-all transform hover:scale-105`}>
                          <div className="text-5xl mb-4">{service.icon}</div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2 capitalize">{key} API</h4>
                          <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-bold bg-gradient-to-r ${service.color} bg-clip-text text-transparent`}>{value}</span>
                            <span className="text-gray-600">endpoints</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total Endpoints Banner */}
                  <div className="relative bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl p-12 text-white overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
                    <div className="relative z-10 text-center">
                      <div className="text-8xl font-bold mb-4">{data.apiEndpoints.summary.total}</div>
                      <div className="text-3xl font-semibold mb-2">Total REST API Endpoints</div>
                      <p className="text-xl text-green-100">Fully documented with OpenAPI/Swagger specifications</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Section */}
            {activeSection === 'features' && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">Application Features</h2>
                  </div>

                  <div className="space-y-6">
                    {Object.entries(data.features).map(([key, feature]: [string, any], idx) => {
                      const themes = [
                        { color: 'from-red-500 to-orange-500', bg: 'from-red-50 to-orange-50', accent: 'bg-red-500' },
                        { color: 'from-green-500 to-emerald-500', bg: 'from-green-50 to-emerald-50', accent: 'bg-green-500' },
                        { color: 'from-blue-500 to-cyan-500', bg: 'from-blue-50 to-cyan-50', accent: 'bg-blue-500' },
                        { color: 'from-yellow-500 to-amber-500', bg: 'from-yellow-50 to-amber-50', accent: 'bg-yellow-500' },
                        { color: 'from-purple-500 to-pink-500', bg: 'from-purple-50 to-pink-50', accent: 'bg-purple-500' }
                      ];
                      const theme = themes[idx % themes.length];

                      return (
                        <div key={key} className={`bg-gradient-to-br ${theme.bg} rounded-2xl p-8 border-2 border-gray-200 shadow-lg`}>
                          <h3 className={`text-2xl font-bold bg-gradient-to-r ${theme.color} bg-clip-text text-transparent mb-6`}>
                            {feature.title}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {feature.items.map((item: string, itemIdx: number) => (
                              <div key={itemIdx} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className={`w-8 h-8 ${theme.accent} rounded-lg flex items-center justify-center flex-shrink-0 shadow-md`}>
                                  <span className="text-white font-bold text-lg">✓</span>
                                </div>
                                <span className="text-gray-700 font-medium">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Other sections with placeholder */}
            {!['overview', 'architecture', 'database', 'api', 'features'].includes(activeSection) && (
              <div className="bg-white rounded-3xl shadow-xl p-12 border border-gray-100 text-center">
                <div className="text-6xl mb-6">📖</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4 capitalize">{activeSection} Documentation</h2>
                <p className="text-xl text-gray-600">Detailed {activeSection} documentation section</p>
                <p className="text-gray-500 mt-4">This section contains comprehensive information about {activeSection}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
