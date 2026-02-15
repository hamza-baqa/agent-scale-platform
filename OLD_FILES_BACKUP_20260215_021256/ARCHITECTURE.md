# Banking Migration Platform - Architecture

## System Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                        CLIENT DEMONSTRATION LAYER                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐ │
│   │              React Dashboard (localhost:3000)                   │ │
│   │                                                                 │ │
│   │  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐  │ │
│   │  │ Landing Page │  │ Migration Dash │  │  Code Review UI  │  │ │
│   │  └──────────────┘  └────────────────┘  └──────────────────┘  │ │
│   │                                                                 │ │
│   │  Features:                                                      │ │
│   │  • Repository URL Input                                        │ │
│   │  • Real-time Agent Progress Bars                              │ │
│   │  • Live WebSocket Updates                                      │ │
│   │  • Generated Code Browser                                      │ │
│   │  • Quality Report Viewer                                       │ │
│   │  • Download Transformed Code                                   │ │
│   └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTP + WebSocket
┌───────────────────────────────────────────────────────────────────────┐
│                       BACKEND ORCHESTRATION LAYER                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐ │
│   │          Node.js/Express API (localhost:4000)                  │ │
│   │                                                                 │ │
│   │  ┌────────────────┐  ┌──────────────────┐  ┌───────────────┐ │ │
│   │  │ Migration      │  │  WebSocket       │  │  File         │ │ │
│   │  │ Service        │  │  Server          │  │  Management   │ │ │
│   │  └────────────────┘  └──────────────────┘  └───────────────┘ │ │
│   │                                                                 │ │
│   │  Responsibilities:                                              │ │
│   │  • Accept migration requests                                   │ │
│   │  • Clone repositories                                          │ │
│   │  • Trigger n8n workflows                                       │ │
│   │  • Track migration state                                       │ │
│   │  • Broadcast real-time updates                                 │ │
│   │  • Generate ZIP archives                                       │ │
│   └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTP Webhook
┌───────────────────────────────────────────────────────────────────────┐
│                        WORKFLOW ORCHESTRATION LAYER                    │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐ │
│   │                n8n Workflow Engine (localhost:5678)            │ │
│   │                                                                 │ │
│   │   [Webhook]                                                     │ │
│   │       ↓                                                         │ │
│   │   [HTTP: Notify Backend] ──→ Agent Started                     │ │
│   │       ↓                                                         │ │
│   │   [ARK Agent: Code Analyzer] ──────────────────┐               │ │
│   │       ↓                                         │               │ │
│   │   [HTTP: Notify Backend] ──→ Analysis Complete │               │ │
│   │       ↓                                         │               │ │
│   │   [ARK Agent: Migration Planner] ──────────────┤               │ │
│   │       ↓                                         │               │ │
│   │   [HTTP: Notify Backend] ──→ Plan Ready        │               │ │
│   │       ↓                                         │               │ │
│   │   ┌───┴──────────────────────────────┐         │               │ │
│   │   │    Parallel Generation            │         │               │ │
│   │   │                                   │         │               │ │
│   │   │  [ARK: Service Gen] ←─────────── ARK API   │               │ │
│   │   │         ↓                         │         │               │ │
│   │   │  [Notify Backend]                 │         │               │ │
│   │   │                                   │         │               │ │
│   │   │  [ARK: Frontend Mig] ←────────── ARK API   │               │ │
│   │   │         ↓                         │         │               │ │
│   │   │  [Notify Backend]                 │         │               │ │
│   │   │                                   │         │               │ │
│   │   └───┬──────────────────────────────┘         │               │ │
│   │       ↓                                         │               │ │
│   │   [Merge Results]                               │               │ │
│   │       ↓                                         │               │ │
│   │   [ARK Agent: Quality Validator] ──────────────┘               │ │
│   │       ↓                                                         │ │
│   │   [HTTP: Complete Migration] ──→ Success                       │ │
│   │       ↓                                                         │ │
│   │   [Webhook Response]                                            │ │
│   │                                                                 │ │
│   │  Visual Monitoring: n8n UI shows execution in real-time        │ │
│   └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                    ↕ ARK API
┌───────────────────────────────────────────────────────────────────────┐
│                          AI AGENT EXECUTION LAYER                      │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐ │
│   │               ARK Runtime (Kubernetes Cluster)                  │ │
│   │                                                                 │ │
│   │  ┌────────────────────────────────────────────────────────┐   │ │
│   │  │  Agent Pool:                                            │   │ │
│   │  │                                                          │   │ │
│   │  │  1. Code Analyzer Agent                                 │   │ │
│   │  │     • Scans Java/C# code                                │   │ │
│   │  │     • Extracts entities, services, APIs                 │   │ │
│   │  │     • Identifies patterns                               │   │ │
│   │  │     • Output: Analysis JSON                             │   │ │
│   │  │                                                          │   │ │
│   │  │  2. Migration Planner Agent                             │   │ │
│   │  │     • Analyzes architecture                             │   │ │
│   │  │     • Creates service boundaries                        │   │ │
│   │  │     • Designs API contracts                             │   │ │
│   │  │     • Output: Migration Plan JSON                       │   │ │
│   │  │                                                          │   │ │
│   │  │  3. Service Generator Agent                             │   │ │
│   │  │     • Generates Spring Boot projects                    │   │ │
│   │  │     • Creates entities, repos, services                 │   │ │
│   │  │     • Writes tests                                      │   │ │
│   │  │     • Output: 5 Microservices                           │   │ │
│   │  │                                                          │   │ │
│   │  │  4. Frontend Migrator Agent                             │   │ │
│   │  │     • Converts Blazor to Angular                        │   │ │
│   │  │     • Configures Module Federation                      │   │ │
│   │  │     • Creates routing                                   │   │ │
│   │  │     • Output: 4 Micro-frontends                         │   │ │
│   │  │                                                          │   │ │
│   │  │  5. Quality Validator Agent                             │   │ │
│   │  │     • Runs tests                                        │   │ │
│   │  │     • Checks security                                   │   │ │
│   │  │     • Validates architecture                            │   │ │
│   │  │     • Output: Validation Report                         │   │ │
│   │  └────────────────────────────────────────────────────────┘   │ │
│   │                                                                 │ │
│   │  ┌────────────────────────────────────────────────────────┐   │ │
│   │  │  AI Model Integration:                                  │   │ │
│   │  │                                                          │   │ │
│   │  │  Claude Sonnet 4.5  ───→  Most agents                  │   │ │
│   │  │  Claude Opus 4.5    ───→  Migration Planner            │   │ │
│   │  │  (via Anthropic API)                                    │   │ │
│   │  └────────────────────────────────────────────────────────┘   │ │
│   │                                                                 │ │
│   │  ┌────────────────────────────────────────────────────────┐   │ │
│   │  │  Memory Management:                                     │   │ │
│   │  │                                                          │   │ │
│   │  │  Session-based memory for conversation continuity       │   │ │
│   │  │  Shared state across agents                             │   │ │
│   │  │  Query history tracking                                 │   │ │
│   │  └────────────────────────────────────────────────────────┘   │ │
│   └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
                                    ↓
┌───────────────────────────────────────────────────────────────────────┐
│                            OUTPUT LAYER                                │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐ │
│   │              Generated Code Structure                          │ │
│   │                                                                 │ │
│   │  Microservices (Spring Boot):                                  │ │
│   │  ├── auth-service/                                             │ │
│   │  │   ├── src/main/java/com/eurobank/auth/                     │ │
│   │  │   ├── src/test/java/                                        │ │
│   │  │   ├── pom.xml                                               │ │
│   │  │   └── Dockerfile                                            │ │
│   │  ├── client-service/                                           │ │
│   │  ├── account-service/                                          │ │
│   │  ├── transaction-service/                                      │ │
│   │  ├── card-service/                                             │ │
│   │  ├── api-gateway/                                              │ │
│   │  └── config-server/                                            │ │
│   │                                                                 │ │
│   │  Micro-frontends (Angular):                                    │ │
│   │  ├── shell/                                                    │ │
│   │  │   ├── src/app/                                              │ │
│   │  │   ├── webpack.config.js (Module Federation Host)           │ │
│   │  │   └── package.json                                          │ │
│   │  ├── auth-mfe/      (Remote Module)                            │ │
│   │  ├── dashboard-mfe/  (Remote Module)                           │ │
│   │  ├── transfers-mfe/  (Remote Module)                           │ │
│   │  └── cards-mfe/     (Remote Module)                            │ │
│   │                                                                 │ │
│   │  Infrastructure:                                               │ │
│   │  ├── docker-compose.yml                                        │ │
│   │  ├── kubernetes/                                               │ │
│   │  │   ├── deployments/                                          │ │
│   │  │   ├── services/                                             │ │
│   │  │   └── ingress/                                              │ │
│   │  └── openshift/                                                │ │
│   │                                                                 │ │
│   │  Documentation:                                                │ │
│   │  ├── README.md                                                 │ │
│   │  ├── API-DOCS.md                                               │ │
│   │  └── ARCHITECTURE.md                                           │ │
│   │                                                                 │ │
│   │  Quality Reports:                                              │ │
│   │  └── validation-report.json                                    │ │
│   │      ├── Test Results                                          │ │
│   │      ├── Code Coverage                                         │ │
│   │      ├── Security Scan                                         │ │
│   │      └── Build Status                                          │ │
│   └────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Migration Request Flow

```
Client clicks "Start Migration"
    ↓
Frontend → POST /api/migrations { repoUrl: "..." }
    ↓
Backend creates migration record
    ↓
Backend clones repository to workspace
    ↓
Backend → POST n8n webhook { migrationId, repoPath, ... }
    ↓
n8n workflow starts execution
    ↓
Backend returns { id, status: "pending" } to Frontend
    ↓
Frontend subscribes to WebSocket for updates
```

### 2. Agent Execution Flow

```
n8n triggers ARK Agent
    ↓
ARK receives query with session ID
    ↓
Agent uses Claude model to process
    ↓
ARK returns results to n8n
    ↓
n8n → POST /api/migrations/:id/status (update backend)
    ↓
Backend broadcasts via WebSocket
    ↓
Frontend updates UI in real-time
```

### 3. Code Generation Flow

```
Service Generator Agent
    ↓
For each service in plan:
    - Generate pom.xml
    - Generate entities
    - Generate repositories
    - Generate services
    - Generate controllers
    - Generate tests
    - Write to disk
    ↓
Frontend Migrator Agent
    ↓
For each micro-frontend:
    - Generate package.json
    - Generate webpack.config.js
    - Generate components
    - Generate services
    - Write to disk
    ↓
Quality Validator Agent
    ↓
    - Compile all services
    - Run tests
    - Check security
    - Generate report
```

## Deployment Architecture

### Development (Local)

```
┌─────────────────────────────────────────┐
│           Developer Machine              │
│                                          │
│  Frontend (npm run dev)    :3000        │
│  Backend (npm run dev)     :4000        │
│                                          │
└─────────────────────────────────────────┘
              ↕
┌─────────────────────────────────────────┐
│         Kubernetes Cluster               │
│                                          │
│  n8n (port-forward)        :5678        │
│  ARK API                   :8080        │
│  ARK Agents                              │
│                                          │
└─────────────────────────────────────────┘
```

### Production (Kubernetes)

```
┌─────────────────────────────────────────────────────┐
│                  Ingress Controller                  │
│  migration-demo.company.com (HTTPS)                 │
└──────────────────┬──────────────────────────────────┘
                   │
     ┌─────────────┼─────────────┐
     ↓             ↓             ↓
┌─────────┐  ┌──────────┐  ┌──────────┐
│Frontend │  │ Backend  │  │   n8n    │
│ Service │  │ Service  │  │ Service  │
│         │  │          │  │          │
│ Pods:3  │  │ Pods:2   │  │ Pods:1   │
└─────────┘  └──────────┘  └──────────┘
                   │
          ┌────────┴────────┐
          ↓                 ↓
     ┌─────────┐      ┌──────────┐
     │   ARK   │      │PostgreSQL│
     │ Runtime │      │  (State) │
     └─────────┘      └──────────┘
```

## Technology Stack Details

### Frontend Stack
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io Client
- **HTTP**: Axios
- **Charts**: Recharts
- **Code Display**: React Syntax Highlighter

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Language**: TypeScript
- **WebSocket**: Socket.io
- **HTTP Client**: Axios
- **File Operations**: fs-extra
- **Git Operations**: simple-git
- **Archiving**: archiver

### Orchestration Stack
- **Workflow Engine**: n8n
- **AI Runtime**: ARK (Kubernetes-native)
- **Container Orchestration**: Kubernetes
- **Package Manager**: Helm

### AI Models
- **Primary**: Claude Sonnet 4.5 (Anthropic)
- **Planning**: Claude Opus 4.5 (Anthropic)
- **API**: Anthropic API

### Generated Services Stack
- **Backend**: Spring Boot 3.2, Java 17
- **Frontend**: Angular 18, TypeScript
- **Database**: PostgreSQL
- **Build**: Maven, npm

## Security Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Security Layers                     │
│                                                      │
│  1. Network Layer                                    │
│     - Kubernetes Network Policies                   │
│     - Namespace Isolation                           │
│     - TLS/HTTPS for all external traffic           │
│                                                      │
│  2. Authentication Layer                             │
│     - JWT tokens for API access                     │
│     - ARK API authentication                        │
│     - Service account credentials                   │
│                                                      │
│  3. Authorization Layer                              │
│     - RBAC for Kubernetes resources                 │
│     - API rate limiting                             │
│     - Resource quotas                               │
│                                                      │
│  4. Data Layer                                       │
│     - Secrets stored in Kubernetes Secrets          │
│     - Environment-based configuration               │
│     - No hardcoded credentials                      │
│                                                      │
│  5. Application Layer                                │
│     - Input validation                              │
│     - CORS configuration                            │
│     - XSS protection                                │
│     - SQL injection prevention                      │
└─────────────────────────────────────────────────────┘
```

## Scaling Architecture

```
Horizontal Scaling:

Frontend:  [Pod1][Pod2][Pod3]  ← Ingress Load Balancer
Backend:   [Pod1][Pod2]        ← Redis for WebSocket sync
n8n:       [Pod1]              ← Single instance or active/passive
ARK:       [Auto-scales]       ← Based on query load

Vertical Scaling:

- Resource limits per pod
- HPA (Horizontal Pod Autoscaler) on CPU/Memory
- Queue-based agent execution in ARK
```

## Monitoring Architecture

```
┌────────────────────────────────────────────┐
│          Prometheus (Metrics)              │
│  - API response times                      │
│  - Agent execution duration                │
│  - WebSocket connections                   │
│  - Resource usage (CPU/Memory)            │
└────────────────┬───────────────────────────┘
                 ↓
┌────────────────────────────────────────────┐
│          Grafana (Visualization)           │
│  - Real-time dashboards                    │
│  - Migration success rate                  │
│  - System health                           │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│          Logging (ELK Stack)               │
│  - Backend logs                            │
│  - n8n execution logs                      │
│  - ARK agent logs                          │
│  - Kubernetes events                       │
└────────────────────────────────────────────┘
```

## Future Enhancements

1. **Multi-tenancy**: Support multiple organizations
2. **Custom Agents**: Allow clients to define custom transformation rules
3. **AI Model Selection**: Choose between Claude, GPT-4, etc.
4. **Collaborative Review**: Team review of generated code
5. **Version Control Integration**: Direct GitHub/GitLab commits
6. **Rollback**: Ability to revert migrations
7. **A/B Testing**: Compare different migration strategies
8. **Cost Tracking**: Monitor AI API usage and costs

---

**Last Updated**: February 5, 2026
