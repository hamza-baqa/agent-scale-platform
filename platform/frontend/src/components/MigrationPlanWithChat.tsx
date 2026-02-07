'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';

interface MigrationPlanProps {
  planData: any;
  migrationId: string;
}

// Mermaid Diagram Component
function MermaidDiagram({ chart, id }: { chart: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (ref.current && chart && !rendered) {
      ref.current.innerHTML = '';

      mermaid.initialize({
        startOnLoad: true,
        theme: 'base',
        securityLevel: 'loose',
        themeVariables: {
          primaryColor: '#3b82f6',
          primaryTextColor: '#1f2937',
          primaryBorderColor: '#2563eb',
          lineColor: '#6366f1',
          secondaryColor: '#8b5cf6',
          tertiaryColor: '#ec4899',
        }
      });

      setTimeout(() => {
        mermaid.render(id, chart)
          .then(({ svg }) => {
            if (ref.current) {
              ref.current.innerHTML = svg;
              setRendered(true);
              setError(null);
            }
          })
          .catch(err => {
            console.error('Mermaid render error:', err);
            setError(`Failed to render diagram: ${err.message}`);
          });
      }, 100);
    }
  }, [chart, id, rendered]);

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">⚠️ {error}</p>
      </div>
    );
  }

  return <div ref={ref} className="mermaid-diagram flex justify-center p-6 bg-white rounded-lg" />;
}

// Chat Interface Component
function PlanChatInterface({ planData, migrationId, onPlanUpdate }: { planData: any; migrationId: string; onPlanUpdate: (newPlan: any) => void }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hello! I'm your **Migration Architecture Assistant**. I can help you understand and adjust the proposed migration plan.\n\nYou can ask me to:\n- Explain the architecture decisions\n- Suggest changes to service groupings\n- Adjust port numbers\n- Split or combine services\n- Recommend best practices\n\nWhat would you like to know or change?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:4000/api/migrations/${migrationId}/plan-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          plan: planData
        })
      });

      if (response.ok) {
        const result = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);

        // If plan was modified, update it
        if (result.planModified && result.updatedPlan) {
          onPlanUpdate(result.updatedPlan);
        }
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "Why were services grouped this way?",
    "Can I combine these services?",
    "What ports are being used?",
    "Suggest improvements to this plan",
    "How many microservices will be created?",
    "Explain the micro-frontend strategy",
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-200">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🏗️</span>
          </div>
          <div>
            <h3 className="text-lg font-bold">Architecture Planning Assistant</h3>
            <p className="text-sm text-indigo-100">Adjust and optimize your migration plan</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[600px]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="text-sm prose prose-sm max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-gray-500 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-6 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the plan or suggest changes..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MigrationPlanWithChat({ planData, migrationId }: MigrationPlanProps) {
  const [showChat, setShowChat] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(planData);
  const [planModified, setPlanModified] = useState(false);

  // Handle plan updates from chat
  const handlePlanUpdate = (newPlan: any) => {
    setCurrentPlan(newPlan);
    setPlanModified(true);
    // Auto-hide notification after 3 seconds
    setTimeout(() => setPlanModified(false), 3000);
  };

  // Generate architecture diagram from plan
  const generateArchitectureDiagram = () => {
    const services = currentPlan.microservices || [];
    const frontends = currentPlan.microFrontends || [];

    let diagram = `graph TB\n`;
    diagram += `    subgraph Frontend["🎨 Micro-Frontends"]\n`;

    frontends.forEach((mfe: any, idx: number) => {
      const id = `MFE${idx}`;
      diagram += `        ${id}["${mfe.name}${mfe.isHost ? ' (Host)' : ''}<br/>Port: ${mfe.port}"]\n`;
    });

    diagram += `    end\n\n`;
    diagram += `    subgraph Backend["⚙️ Microservices"]\n`;

    services.forEach((svc: any, idx: number) => {
      const id = `SVC${idx}`;
      diagram += `        ${id}["${svc.name}<br/>Port: ${svc.port}"]\n`;
    });

    diagram += `    end\n\n`;
    diagram += `    subgraph Data["💾 Data Layer"]\n`;
    diagram += `        DB[(Database<br/>per Service)]\n`;
    diagram += `    end\n\n`;

    // Add connections
    if (frontends.length > 0 && services.length > 0) {
      diagram += `    MFE0 -->|REST API| SVC0\n`;
    }
    if (services.length > 0) {
      diagram += `    SVC0 --> DB\n`;
    }

    diagram += `\n    style Frontend fill:#e3f2fd\n`;
    diagram += `    style Backend fill:#fff3e0\n`;
    diagram += `    style Data fill:#f3e5f5`;

    return diagram;
  };

  if (!currentPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading migration plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Floating Chat Button */}
      <div className="fixed bottom-8 right-8 z-[9999]">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group relative"
          title="Discuss the migration plan"
        >
          {showChat ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <span className="text-3xl">🏗️</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </>
          )}
        </button>
        {!showChat && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Adjust the migration plan
            <div className="absolute top-full right-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Plan Modified Notification */}
      {planModified && (
        <div className="fixed top-8 right-8 z-[9999] animate-fadeIn">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold">Plan Updated!</p>
              <p className="text-sm">The architecture has been modified</p>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed bottom-28 right-8 w-[450px] h-[700px] z-[9998] animate-fadeIn shadow-2xl">
          <PlanChatInterface planData={currentPlan} migrationId={migrationId} onPlanUpdate={handlePlanUpdate} />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">🏗️</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Migration Architecture Plan</h1>
              <p className="text-gray-500">Review and adjust the proposed architecture</p>
            </div>
          </div>
        </div>

        {/* Architecture Overview */}
        <section className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-4xl">📐</span>
            Proposed Architecture
          </h2>
          <div className="bg-gradient-to-br from-slate-50 to-indigo-50 rounded-2xl p-8 border-2 border-indigo-200">
            <MermaidDiagram chart={generateArchitectureDiagram()} id="migration-architecture" />
          </div>
        </section>

        {/* Microservices Section */}
        <section className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-4xl">⚙️</span>
            Microservices ({currentPlan.microservices?.length || 0})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(currentPlan.microservices || []).map((service: any, idx: number) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-indigo-200">
                <h3 className="text-xl font-bold text-indigo-900 mb-3">{service.name || service.displayName}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">🔌 Port:</span>
                    <span className="font-mono font-bold text-indigo-700">{service.port}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">📦 Entities:</span>
                    <span className="text-gray-800">{service.entities?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">🔗 Endpoints:</span>
                    <span className="text-gray-800">{service.endpoints?.length || 0}</span>
                  </div>
                  {service.entities && service.entities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <p className="text-xs text-gray-600 mb-1">Domain Entities:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.entities.map((entity: any, eidx: number) => (
                          <span key={eidx} className="text-xs px-2 py-1 bg-white rounded text-indigo-700">
                            {entity.name || entity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Micro-frontends Section */}
        <section className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-4xl">🎨</span>
            Micro-Frontends ({currentPlan.microFrontends?.length || 0})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(currentPlan.microFrontends || []).map((mfe: any, idx: number) => (
              <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xl font-bold text-purple-900">{mfe.name || mfe.displayName}</h3>
                  {mfe.isHost && (
                    <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded-full">HOST</span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">🔌 Port:</span>
                    <span className="font-mono font-bold text-purple-700">{mfe.port}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">🗺️ Routes:</span>
                    <span className="text-gray-800">{mfe.routes?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">🧩 Components:</span>
                    <span className="text-gray-800">{mfe.components?.length || 0}</span>
                  </div>
                  {mfe.routes && mfe.routes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">Routes:</p>
                      <div className="space-y-1">
                        {mfe.routes.slice(0, 5).map((route: any, ridx: number) => (
                          <div key={ridx} className="text-xs px-2 py-1 bg-white rounded">
                            <span className="font-mono text-purple-700">{route.path}</span>
                          </div>
                        ))}
                        {mfe.routes.length > 5 && (
                          <div className="text-xs text-gray-500">
                            +{mfe.routes.length - 5} more routes
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Strategy Summary */}
        <section className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-4xl">📋</span>
            Migration Strategy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-2">Microservices</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Database-per-service pattern</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Spring Boot 3.2+ with Java 17</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>RESTful API endpoints</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>JWT authentication</span>
                </li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-900 mb-2">Micro-Frontends</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Module Federation (Webpack 5)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Angular 18 standalone components</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Shell + remote apps architecture</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Shared routing and state</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-900 mb-2">Deployment</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Docker containerization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Kubernetes orchestration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>CI/CD pipeline ready</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Environment configurations</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-bold text-yellow-900 mb-1">Need to adjust the plan?</p>
                <p className="text-sm text-yellow-800">
                  Click the chat button to discuss changes, combine/split services, adjust ports, or get architecture recommendations!
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
