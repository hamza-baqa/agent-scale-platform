'use client';

import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import ReactMarkdown from 'react-markdown';

interface CodeDocumentationProps {
  data: any;
  migrationId: string;
}

// Mermaid Diagram Component with error handling
function MermaidDiagram({ chart, id }: { chart: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (ref.current && chart && !rendered) {
      // Clear any previous content
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
          background: '#ffffff',
          mainBkg: '#dbeafe',
          secondaryBkg: '#ede9fe',
          tertiaryBkg: '#fce7f3',
          textColor: '#1f2937',
          fontSize: '16px'
        }
      });

      // Add a small delay to ensure DOM is ready
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
            // Show the raw mermaid code as fallback
            if (ref.current) {
              ref.current.innerHTML = `<pre class="text-xs text-gray-600 overflow-auto">${chart}</pre>`;
            }
          });
      }, 100);
    }
  }, [chart, id, rendered]);

  if (error) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">⚠️ {error}</p>
        <details className="mt-2">
          <summary className="text-xs text-yellow-600 cursor-pointer">Show diagram code</summary>
          <pre className="text-xs mt-2 text-gray-600 overflow-auto">{chart}</pre>
        </details>
      </div>
    );
  }

  return <div ref={ref} className="mermaid-diagram flex justify-center p-6 bg-white rounded-lg min-h-[300px]" />;
}

// Chat Interface Component
function ChatInterface({ data, migrationId }: { data: any; migrationId: string }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: `Hello! I'm your **intelligent documentation assistant**. I can explain:\n\n🎯 **Business Functions**: What the code does from a business perspective\n💼 **User Workflows**: How users interact with features\n🏗️ **Technical Architecture**: System design and patterns\n📊 **Data Models**: What entities represent and their purpose\n🔄 **Business Processes**: End-to-end workflows and logic\n\nI provide both **business** and **technical** explanations. What would you like to know?`
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
      // Call backend API to get AI response about the documentation
      const response = await fetch(`http://localhost:4000/api/migrations/${migrationId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: {
            // Full documentation context
            entities: data.entities?.list || [],
            controllers: data.summary?.controllers || 0,
            framework: data.summary?.framework || '',
            features: data.features || {},
            architecture: data.architecture || {},
            apiEndpoints: data.apiEndpoints?.summary || {},
            techStack: data.techStack || {},
            overview: data.overview || {},
            // Additional context for better answers
            totalEndpoints: data.apiEndpoints?.summary?.total || 0,
            projectName: data.title || 'Application',
            entityNames: (data.entities?.list || []).map((e: any) => e.name),
            featureList: Object.entries(data.features || {}).map(([key, val]: [string, any]) => val.title),
            // DETAILED analysis data for intelligent answers
            detailedAnalysis: data.detailedAnalysis || null
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: result.response }]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback to local response based on documentation
      const fallbackResponse = generateFallbackResponse(userMessage, data);
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackResponse }]);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackResponse = (question: string, docData: any): string => {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('architecture') || lowerQuestion.includes('structure')) {
      return `The application follows a ${docData.architecture?.description || 'layered architecture'}. It uses ${docData.summary?.framework || 'modern web technologies'} with ${docData.summary?.entities || 0} entities and ${docData.summary?.controllers || 0} controllers.`;
    }

    if (lowerQuestion.includes('entity') || lowerQuestion.includes('entities') || lowerQuestion.includes('model')) {
      const entities = docData.entities?.list || [];
      return `The system has ${entities.length} entities: ${entities.map((e: any) => e.name).join(', ')}. Each entity represents a core business object in the domain model.`;
    }

    if (lowerQuestion.includes('api') || lowerQuestion.includes('endpoint')) {
      const total = docData.apiEndpoints?.summary?.total || 0;
      return `The API has approximately ${total} endpoints across different domains including authentication, client management, accounts, transactions, and cards. All endpoints follow RESTful conventions.`;
    }

    if (lowerQuestion.includes('feature') || lowerQuestion.includes('functionality')) {
      const features = Object.entries(docData.features || {});
      return `The system includes ${features.length} main feature areas: ${features.map(([key, value]: [string, any]) => value.title).join(', ')}. Each provides comprehensive business functionality.`;
    }

    if (lowerQuestion.includes('tech') || lowerQuestion.includes('technology') || lowerQuestion.includes('stack')) {
      return `The technology stack includes:\n- Backend: ${docData.techStack?.backend?.framework || 'Spring Boot'}\n- Frontend: ${docData.techStack?.frontend?.framework || 'Modern web framework'}\n- Database: ${docData.techStack?.database?.type || 'Relational database'}`;
    }

    return `Based on the documentation, the system uses ${docData.summary?.framework || 'modern technologies'} with ${docData.summary?.entities || 0} entities and ${docData.summary?.controllers || 0} controllers. Could you please be more specific about what aspect you'd like to know more about? I can explain the architecture, entities, APIs, features, or technology stack in detail.`;
  };

  const suggestedQuestions = [
    "What does this application do from a business perspective?",
    "What business problem does the Account entity solve?",
    "Explain the money transfer workflow",
    "What are the main user workflows?",
    "What business value does this provide?",
    "How does authentication work for users?",
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-200">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-bold">Documentation Assistant</h3>
            <p className="text-sm text-purple-100">Ask me anything about the code</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[400px] max-h-[600px]">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="text-sm prose prose-sm max-w-none">
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
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
          <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
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
            placeholder="Ask about the documentation..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

export default function CodeDocumentationWithChat({ data, migrationId }: CodeDocumentationProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showChat, setShowChat] = useState(false);

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
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(`section-${sectionId}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Floating Chat Button - Always Visible */}
      <div className="fixed bottom-8 right-8 z-[9999]">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center group relative"
          title="Ask me about the documentation"
        >
          {showChat ? (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <>
              <span className="text-3xl">💬</span>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </>
          )}
        </button>
        {!showChat && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ask questions about the code
            <div className="absolute top-full right-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Chat Panel */}
      {showChat && (
        <div className="fixed bottom-28 right-8 w-[450px] h-[700px] z-[9998] animate-fadeIn shadow-2xl">
          <ChatInterface data={data} migrationId={migrationId} />
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-4xl">📚</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{data.title || 'Code Documentation'}</h1>
              <p className="text-gray-500">Version {data.version || '1.0.0'} • {new Date(data.lastUpdated).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeSection === section.id
                    ? `bg-gradient-to-r ${section.color} text-white shadow-lg scale-105`
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-12">
          {/* Overview Section */}
          <section id="section-overview" className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-4xl">📘</span>
              Overview
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed">{data.overview?.description}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-blue-600">{data.summary?.entities || 0}</div>
                  <div className="text-sm text-gray-600">Entities</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-green-600">{data.summary?.controllers || 0}</div>
                  <div className="text-sm text-gray-600">Controllers</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-3xl font-bold text-purple-600">{data.summary?.pages || 0}</div>
                  <div className="text-sm text-gray-600">Pages</div>
                </div>
              </div>
            </div>
          </section>

          {/* Architecture Section */}
          <section id="section-architecture" className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-4xl">🏗️</span>
              Application Architecture
            </h2>
            <p className="text-gray-700 mb-6">{data.architecture?.description}</p>
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-8 border-2 border-indigo-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">System Architecture Diagram</h3>
              {data.architecture?.diagram ? (
                <MermaidDiagram chart={data.architecture.diagram} id="architecture-diagram" />
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <span className="text-4xl mb-4 block">📊</span>
                  <p>Architecture diagram not available</p>
                </div>
              )}
            </div>
          </section>

          {/* Database Section */}
          <section id="section-database" className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-4xl">💾</span>
              Database Schema
            </h2>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border-2 border-purple-200 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">Entity Relationship Diagram</h3>
              {data.entities?.diagram ? (
                <MermaidDiagram chart={data.entities.diagram} id="erd-diagram" />
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <span className="text-4xl mb-4 block">🗄️</span>
                  <p>Database diagram not available</p>
                </div>
              )}
            </div>
            {data.entities?.list && data.entities.list.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.entities.list.map((entity: any, idx: number) => (
                  <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2">{entity.name}</h4>
                    <p className="text-sm text-gray-600">{entity.fields} fields • {entity.relationships} relationships</p>
                    <p className="text-xs text-gray-500 mt-2">{entity.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* API Section */}
          <section id="section-api" className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-4xl">🔌</span>
              API Documentation
            </h2>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border-2 border-green-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">API Structure</h3>
              {data.apiEndpoints?.diagram ? (
                <MermaidDiagram chart={data.apiEndpoints.diagram} id="api-diagram" />
              ) : (
                <div className="text-center text-gray-500 py-12">
                  <span className="text-4xl mb-4 block">🔗</span>
                  <p>API diagram not available</p>
                </div>
              )}
            </div>
            {data.apiEndpoints?.summary && (
              <div className="mt-6 bg-green-50 rounded-xl p-6">
                <h4 className="font-bold text-green-900 mb-4">API Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(data.apiEndpoints.summary).map(([key, value]: [string, any]) => (
                    <div key={key} className="bg-white rounded-lg p-3">
                      <div className="text-sm text-gray-600 capitalize">{key}</div>
                      <div className="text-lg font-bold text-green-600">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Features Section */}
          <section id="section-features" className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-4xl">✨</span>
              Features & Capabilities
            </h2>
            {data.features && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(data.features).map(([key, feature]: [string, any]) => (
                  <div key={key} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                    <ul className="space-y-2">
                      {feature.items.map((item: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
