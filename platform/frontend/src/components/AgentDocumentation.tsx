'use client';

interface AgentDocumentationProps {
  agentName: string;
}

export default function AgentDocumentation({ agentName }: AgentDocumentationProps) {

  // Code Analyzer Documentation
  if (agentName === 'code-analyzer') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-cyan-500/30">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-xl font-bold text-cyan-400 mb-2">Code Analysis & Discovery</h3>
          <p className="text-sm text-gray-400">Deep dive into your existing codebase to understand structure and patterns</p>
        </div>

        {/* What Will Be Analyzed */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-500/20">
          <h4 className="text-md font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <span>📋</span> What Will Be Analyzed
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: '🏛️', title: 'Domain Models', desc: 'JPA entities, relationships, annotations' },
              { icon: '🔌', title: 'API Endpoints', desc: 'REST controllers, request/response DTOs' },
              { icon: '⚙️', title: 'Business Logic', desc: 'Services, use cases, workflows' },
              { icon: '🎨', title: 'UI Components', desc: 'Blazor pages, components, routing' },
              { icon: '🔒', title: 'Security', desc: 'Authentication, authorization, JWT' },
              { icon: '💾', title: 'Data Access', desc: 'Repositories, queries, schemas' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-gray-700/30 p-3 rounded">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Output Deliverables */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-500/20">
          <h4 className="text-md font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <span>📦</span> Output Deliverables
          </h4>
          <div className="space-y-2">
            {[
              { title: 'Entity Relationship Diagram', format: 'JSON + Visual Graph' },
              { title: 'API Endpoint Inventory', format: 'OpenAPI 3.0 Spec' },
              { title: 'Service Boundary Map', format: 'Architecture Documentation' },
              { title: 'Technology Stack Report', format: 'Version Analysis' },
              { title: 'Code Metrics Dashboard', format: 'Complexity, Dependencies, LOC' }
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-700/30 p-2 rounded">
                <span className="text-sm text-gray-300">✓ {item.title}</span>
                <span className="text-xs px-2 py-1 bg-cyan-600 text-white rounded">{item.format}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies Used */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-cyan-500/20">
          <h4 className="text-md font-semibold text-cyan-300 mb-3 flex items-center gap-2">
            <span>🛠️</span> Analysis Tools
          </h4>
          <div className="flex flex-wrap gap-2">
            {['AST Parser', 'Code Scanner', 'File Reader', 'Pattern Matcher', 'Dependency Analyzer'].map((tool, idx) => (
              <span key={idx} className="px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs rounded-full">
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Expected Timeline */}
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 p-3 rounded-lg border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="text-sm font-semibold text-cyan-300">Estimated Duration</div>
                <div className="text-xs text-gray-400">Processing time</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-cyan-400">~15s</div>
          </div>
        </div>
      </div>
    );
  }

  // Migration Planner Documentation
  if (agentName === 'migration-planner') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-blue-500/30">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">📐</div>
          <h3 className="text-xl font-bold text-blue-400 mb-2">Architecture Planning & Design</h3>
          <p className="text-sm text-gray-400">Transform monolith into scalable microservices architecture</p>
        </div>

        {/* Target Architecture */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/20">
          <h4 className="text-md font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>🏗️</span> Target Architecture
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Backend */}
            <div className="bg-gradient-to-br from-blue-600/10 to-blue-700/10 p-3 rounded-lg border border-blue-500/30">
              <div className="text-center mb-2">
                <span className="text-3xl">🔧</span>
                <h5 className="text-sm font-bold text-blue-300 mt-2">Backend Services</h5>
              </div>
              <div className="space-y-1 text-xs">
                {['Auth Service', 'Client Service', 'Account Service', 'Transaction Service', 'Card Service'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300">
                    <span className="text-green-400">✓</span> {s}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-500/30 text-center">
                <span className="text-xs text-blue-400 font-semibold">Spring Boot 3.2 + Java 17</span>
              </div>
            </div>

            {/* Frontend */}
            <div className="bg-gradient-to-br from-purple-600/10 to-purple-700/10 p-3 rounded-lg border border-purple-500/30">
              <div className="text-center mb-2">
                <span className="text-3xl">🎨</span>
                <h5 className="text-sm font-bold text-purple-300 mt-2">Micro-frontends</h5>
              </div>
              <div className="space-y-1 text-xs">
                {['Shell (Host)', 'Auth Module', 'Dashboard Module', 'Transfers Module', 'Cards Module'].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-gray-300">
                    <span className="text-green-400">✓</span> {s}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-purple-500/30 text-center">
                <span className="text-xs text-purple-400 font-semibold">Angular 18 + Module Federation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Design Patterns */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/20">
          <h4 className="text-md font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>🎯</span> Architecture Patterns
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { pattern: 'Database per Service', icon: '💾' },
              { pattern: 'API Gateway Pattern', icon: '🌐' },
              { pattern: 'Service Discovery', icon: '🔍' },
              { pattern: 'Event-Driven Design', icon: '⚡' },
              { pattern: 'CQRS Pattern', icon: '📊' },
              { pattern: 'Module Federation', icon: '🧩' }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-700/30 p-2 rounded flex items-center gap-2">
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs text-gray-300">{item.pattern}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-blue-500/20">
          <h4 className="text-md font-semibold text-blue-300 mb-3 flex items-center gap-2">
            <span>📋</span> Planning Deliverables
          </h4>
          <div className="space-y-2">
            {[
              'Microservices Decomposition Strategy',
              'API Contract Specifications (OpenAPI 3.0)',
              'Database Schema Designs (per service)',
              'Inter-service Communication Plan',
              'Deployment Architecture Diagram',
              'Migration Roadmap & Dependencies'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-300 bg-gray-700/30 p-2 rounded">
                <span className="text-blue-400">📄</span> {item}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-3 rounded-lg border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="text-sm font-semibold text-blue-300">Estimated Duration</div>
                <div className="text-xs text-gray-400">Planning & documentation</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-400">~18s</div>
          </div>
        </div>
      </div>
    );
  }

  // Service Generator Documentation
  if (agentName === 'service-generator') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-purple-500/30">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">⚙️</div>
          <h3 className="text-xl font-bold text-purple-400 mb-2">Backend Code Generation</h3>
          <p className="text-sm text-gray-400">Production-ready Spring Boot microservices with full implementation</p>
        </div>

        {/* Services to Generate */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-purple-500/20">
          <h4 className="text-md font-semibold text-purple-300 mb-3 flex items-center gap-2">
            <span>🔧</span> 5 Microservices
          </h4>
          <div className="space-y-2">
            {[
              { name: 'auth-service', port: 8081, desc: 'JWT authentication & user management', color: '#06b6d4' },
              { name: 'client-service', port: 8082, desc: 'Client profiles & management', color: '#3b82f6' },
              { name: 'account-service', port: 8083, desc: 'Account operations & balances', color: '#8b5cf6' },
              { name: 'transaction-service', port: 8084, desc: 'Transfers & transaction history', color: '#ec4899' },
              { name: 'card-service', port: 8085, desc: 'Card lifecycle & operations', color: '#f59e0b' }
            ].map((svc, idx) => (
              <div key={idx} className="bg-gray-700/30 p-3 rounded-lg border-l-4" style={{ borderColor: svc.color }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white font-mono">{svc.name}</span>
                  <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded">Port {svc.port}</span>
                </div>
                <p className="text-xs text-gray-400">{svc.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Generated Files */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-purple-500/20">
          <h4 className="text-md font-semibold text-purple-300 mb-3 flex items-center gap-2">
            <span>📁</span> Files per Service
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { file: 'pom.xml', icon: '📦' },
              { file: 'Application.java', icon: '☕' },
              { file: 'Entities', icon: '🏛️' },
              { file: 'Repositories', icon: '💾' },
              { file: 'Services', icon: '⚙️' },
              { file: 'Controllers', icon: '🔌' },
              { file: 'DTOs', icon: '📋' },
              { file: 'Security Config', icon: '🔒' },
              { file: 'application.yml', icon: '⚙️' },
              { file: 'Dockerfile', icon: '🐳' },
              { file: 'Tests', icon: '🧪' },
              { file: 'README.md', icon: '📝' }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-700/30 p-2 rounded text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs text-gray-300">{item.file}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-purple-500/20">
          <h4 className="text-md font-semibold text-purple-300 mb-3 flex items-center gap-2">
            <span>✨</span> Included Features
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'Spring Data JPA + Hibernate',
              'Bean Validation (@Valid)',
              'Exception Handling',
              'OpenAPI/Swagger Docs',
              'JWT Security Integration',
              'CORS Configuration',
              'Health Check Actuators',
              'Unit & Integration Tests'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-green-400">✓</span> {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-3 rounded-lg border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="text-sm font-semibold text-purple-300">Estimated Duration</div>
                <div className="text-xs text-gray-400">Code generation</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-400">~25s</div>
          </div>
        </div>
      </div>
    );
  }

  // Frontend Migrator Documentation
  if (agentName === 'frontend-migrator') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-pink-500/30">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">🎨</div>
          <h3 className="text-xl font-bold text-pink-400 mb-2">Frontend Code Generation</h3>
          <p className="text-sm text-gray-400">Angular micro-frontends with Webpack Module Federation</p>
        </div>

        {/* Micro-frontends */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-pink-500/20">
          <h4 className="text-md font-semibold text-pink-300 mb-3 flex items-center gap-2">
            <span>🧩</span> 5 Micro-frontend Modules
          </h4>
          <div className="space-y-2">
            {[
              { name: 'shell', port: 4200, type: 'Host', desc: 'Main container + routing', icon: '🏠' },
              { name: 'auth-mfe', port: 4201, type: 'Remote', desc: 'Login & registration', icon: '🔐' },
              { name: 'dashboard-mfe', port: 4202, type: 'Remote', desc: 'Account overview', icon: '📊' },
              { name: 'transfers-mfe', port: 4203, type: 'Remote', desc: 'Money transfers', icon: '💸' },
              { name: 'cards-mfe', port: 4204, type: 'Remote', desc: 'Card management', icon: '💳' }
            ].map((mfe, idx) => (
              <div key={idx} className="bg-gray-700/30 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{mfe.icon}</span>
                    <span className="text-sm font-semibold text-white font-mono">{mfe.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${idx === 0 ? 'bg-green-600' : 'bg-pink-600'} text-white`}>
                      {mfe.type}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-600 text-white rounded">:{mfe.port}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{mfe.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Generated Files */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-pink-500/20">
          <h4 className="text-md font-semibold text-pink-300 mb-3 flex items-center gap-2">
            <span>📁</span> Files per Module
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { file: 'package.json', icon: '📦' },
              { file: 'webpack.config.js', icon: '⚡' },
              { file: 'Components', icon: '🧩' },
              { file: 'Services', icon: '🔧' },
              { file: 'Models', icon: '📋' },
              { file: 'Guards', icon: '🛡️' },
              { file: 'Interceptors', icon: '🔌' },
              { file: 'Styles', icon: '🎨' },
              { file: 'nginx.conf', icon: '🌐' },
              { file: 'Dockerfile', icon: '🐳' },
              { file: 'Tests', icon: '🧪' },
              { file: 'README.md', icon: '📝' }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-700/30 p-2 rounded text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs text-gray-300">{item.file}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-pink-500/20">
          <h4 className="text-md font-semibold text-pink-300 mb-3 flex items-center gap-2">
            <span>🛠️</span> Technology Stack
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              'Angular 18',
              'TypeScript',
              'Webpack 5',
              'Module Federation',
              'RxJS',
              'Angular Material',
              'Tailwind CSS',
              'Nginx'
            ].map((tech, idx) => (
              <span key={idx} className="px-3 py-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs rounded-full">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 p-3 rounded-lg border border-pink-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="text-sm font-semibold text-pink-300">Estimated Duration</div>
                <div className="text-xs text-gray-400">Code generation</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-pink-400">~22s</div>
          </div>
        </div>
      </div>
    );
  }

  // Quality Validator Documentation
  if (agentName === 'quality-validator') {
    return (
      <div className="space-y-4 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border border-green-500/30">
        <div className="text-center mb-4">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-green-400 mb-2">Quality Assurance & Validation</h3>
          <p className="text-sm text-gray-400">Comprehensive testing and security validation</p>
        </div>

        {/* Validation Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Build Validation */}
          <div className="bg-gradient-to-br from-blue-600/10 to-blue-700/10 p-4 rounded-lg border border-blue-500/30">
            <div className="text-center mb-3">
              <span className="text-3xl">🏗️</span>
              <h5 className="text-sm font-bold text-blue-300 mt-2">Build Validation</h5>
            </div>
            <div className="space-y-1 text-xs">
              {['Compile Spring Boot services', 'Build Angular applications', 'Resolve dependencies', 'Check for errors'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <span className="text-blue-400">✓</span> {item}
                </div>
              ))}
            </div>
          </div>

          {/* Test Validation */}
          <div className="bg-gradient-to-br from-green-600/10 to-green-700/10 p-4 rounded-lg border border-green-500/30">
            <div className="text-center mb-3">
              <span className="text-3xl">🧪</span>
              <h5 className="text-sm font-bold text-green-300 mt-2">Test Validation</h5>
            </div>
            <div className="space-y-1 text-xs">
              {['Run unit tests (JUnit)', 'Run integration tests', 'Check code coverage (>70%)', 'Verify test reports'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> {item}
                </div>
              ))}
            </div>
          </div>

          {/* Security Scan */}
          <div className="bg-gradient-to-br from-red-600/10 to-red-700/10 p-4 rounded-lg border border-red-500/30">
            <div className="text-center mb-3">
              <span className="text-3xl">🔒</span>
              <h5 className="text-sm font-bold text-red-300 mt-2">Security Scan</h5>
            </div>
            <div className="space-y-1 text-xs">
              {['Dependency vulnerabilities', 'OWASP security checks', 'No hardcoded secrets', 'JWT validation'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <span className="text-red-400">✓</span> {item}
                </div>
              ))}
            </div>
          </div>

          {/* Code Quality */}
          <div className="bg-gradient-to-br from-purple-600/10 to-purple-700/10 p-4 rounded-lg border border-purple-500/30">
            <div className="text-center mb-3">
              <span className="text-3xl">📊</span>
              <h5 className="text-sm font-bold text-purple-300 mt-2">Code Quality</h5>
            </div>
            <div className="space-y-1 text-xs">
              {['SonarQube analysis', 'Code style checks', 'Complexity metrics', 'Technical debt'].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-300">
                  <span className="text-purple-400">✓</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-green-500/20">
          <h4 className="text-md font-semibold text-green-300 mb-3 flex items-center gap-2">
            <span>📈</span> Quality Metrics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { metric: 'Code Coverage', target: '>70%', icon: '🎯' },
              { metric: 'Security Score', target: 'A+', icon: '🔒' },
              { metric: 'Build Status', target: 'Pass', icon: '✅' },
              { metric: 'Tech Debt', target: '<2 days', icon: '📊' }
            ].map((item, idx) => (
              <div key={idx} className="bg-gray-700/30 p-3 rounded text-center">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs text-gray-400 mb-1">{item.metric}</div>
                <div className="text-sm font-bold text-green-400">{item.target}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-green-500/20">
          <h4 className="text-md font-semibold text-green-300 mb-3 flex items-center gap-2">
            <span>🛠️</span> Validation Tools
          </h4>
          <div className="flex flex-wrap gap-2">
            {['Maven', 'JUnit', 'SonarQube', 'OWASP Dependency Check', 'ESLint', 'Checkstyle', 'Docker Build'].map((tool, idx) => (
              <span key={idx} className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs rounded-full">
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 p-3 rounded-lg border border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <div>
                <div className="text-sm font-semibold text-green-300">Estimated Duration</div>
                <div className="text-xs text-gray-400">Testing & validation</div>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-400">~16s</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
