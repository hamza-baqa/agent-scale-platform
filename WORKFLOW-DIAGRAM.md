# Agent@Scale Platform - Complete Workflow Diagram

## 🎯 Your Actual Migration Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  USER / EXTERNAL SYSTEM                                              │
│                                                                       │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            │ POST with repositoryUrl
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  n8n WORKFLOW (ark-at-scale.space/n8n)                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━             │
│                                                                       │
│  ① Webhook Trigger                                                   │
│      │                                                                │
│      ▼                                                                │
│  ② Start Migration (HTTP POST to backend)                           │
│      │                                                                │
│      ▼                                                                │
│  ③ Poll Status (every 5s)                                           │
│      │                                                                │
│      ▼                                                                │
│  ④ Download Generated Code (when complete)                          │
│      │                                                                │
│      ▼                                                                │
│  ⑤ Return Response                                                   │
│                                                                       │
└───────────────────────────┬───────────────────────────────────────────┘
                            │
                            │ Calls Backend API
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  BACKEND (Node.js + Express)  Port 4000                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                │
│                                                                       │
│  POST /api/repo-migration                                            │
│      │                                                                │
│      ▼                                                                │
│  ┌─────────────────────────────────────────────────┐                │
│  │ processMigrationAsync()                          │                │
│  │                                                  │                │
│  │  Step 1: Git Clone (if URL)                     │                │
│  │  Step 2: Code Analyzer (ARK agent)              │────────┐       │
│  │  Step 3: Migration Planner (ARK agent)          │────────┼───┐   │
│  │  Step 4: Service Generator (local)              │        │   │   │
│  │  Step 5: Frontend Migrator (local)              │        │   │   │
│  │  Step 6: Quality Validator (local)              │        │   │   │
│  │  Step 7: Container Deployment (optional)        │        │   │   │
│  └─────────────────────────────────────────────────┘        │   │   │
│                                                               │   │   │
│  WebSocket ────> Frontend Dashboard (Real-time updates)      │   │   │
│                                                               │   │   │
└───────────────────────────────────────────────────────────────┼───┼───┘
                                                                │   │
                                                                │   │
┌───────────────────────────────────────────────────────────────┼───┼───┐
│                                                               │   │   │
│  ARK AGENTS (AI-Powered via Mock ARK + Ollama)  Port 8080    │   │   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━            │   │   │
│                                                               │   │   │
│  ┌──────────────────────────────────────────┐ ◄──────────────┘   │   │
│  │ code-analyzer                             │                    │   │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │                    │   │
│  │ Model: Claude Sonnet 4.5                  │                    │   │
│  │ Input: Repository path                    │                    │   │
│  │ Output: Entities, Controllers, Services   │                    │   │
│  └──────────────────────────────────────────┘                    │   │
│                                                                   │   │
│  ┌──────────────────────────────────────────┐ ◄──────────────────┘   │
│  │ migration-planner                         │                        │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │                        │
│  │ Model: Claude Opus 4.6 (Most Powerful)    │                        │
│  │ Input: Code analysis JSON                 │                        │
│  │ Output: Migration blueprint               │                        │
│  │ Features: Interactive chat enabled!       │                        │
│  └──────────────────────────────────────────┘                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  LOCAL GENERATORS (Backend Code Generation)                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                │
│                                                                       │
│  ┌──────────────────────────────────────────┐                       │
│  │ SpringBootServiceGenerator                │                       │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │                       │
│  │ Generates:                                │                       │
│  │  • 5-7 Spring Boot microservices          │                       │
│  │  • JPA entities, repositories, services   │                       │
│  │  • REST controllers with OpenAPI          │                       │
│  │  • Security config (JWT)                  │                       │
│  │  • Tests (JUnit + Mockito)                │                       │
│  │  • Dockerfiles                            │                       │
│  │  • Maven pom.xml                          │                       │
│  └──────────────────────────────────────────┘                       │
│                                                                       │
│  ┌──────────────────────────────────────────┐                       │
│  │ AngularMicroFrontendGenerator             │                       │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │                       │
│  │ Generates:                                │                       │
│  │  • Shell (host MFE)                       │                       │
│  │  • 4 Remote MFEs (Auth, Dashboard, etc.)  │                       │
│  │  • Webpack Module Federation config       │                       │
│  │  • Angular routing, guards, services      │                       │
│  │  • HTTP interceptors                      │                       │
│  │  • Dockerfiles                            │                       │
│  └──────────────────────────────────────────┘                       │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  QUALITY VALIDATOR (functionalValidator.ts)                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                │
│                                                                       │
│  Validates:                                                          │
│  ✓ Maven compilation (all microservices)                            │
│  ✓ npm build (all micro-frontends)                                  │
│  ✓ Entities matching (70%+ required)                                │
│  ✓ API endpoints matching (70%+ required)                           │
│  ✓ Business logic preservation                                      │
│  ✓ Security vulnerabilities (OWASP, npm audit)                      │
│  ✓ Code quality (no hardcoded passwords, SQL injection risks)       │
│  ✓ Test execution and coverage                                      │
│  ✓ Stack compatibility checks                                       │
│                                                                       │
│  ⚠️  Migration STOPS if validation fails                            │
│  ✓  User can retry validation after fixes                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  OUTPUT                                                              │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                │
│                                                                       │
│  workspace/<migration-id>/output/                                    │
│  ├── microservices/                                                  │
│  │   ├── auth-service/                                               │
│  │   ├── client-service/                                             │
│  │   ├── account-service/                                            │
│  │   ├── transaction-service/                                        │
│  │   └── card-service/                                               │
│  ├── micro-frontends/                                                │
│  │   ├── shell/                                                      │
│  │   ├── auth-mfe/                                                   │
│  │   ├── dashboard-mfe/                                              │
│  │   ├── transfers-mfe/                                              │
│  │   └── cards-mfe/                                                  │
│  ├── docker-compose.yml                                              │
│  ├── README.md                                                       │
│  └── validation-report.json                                          │
│                                                                       │
│  Download: /api/repo-migration/<id>/download                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## 📊 Step-by-Step Flow

### 1. Webhook Trigger (n8n)
- User/System sends POST to n8n webhook
- Payload: `{ "repositoryUrl": "..." }`

### 2. Backend Receives Request
- n8n calls: `POST http://backend:4000/api/repo-migration`
- Backend creates migration ID
- Starts async processing

### 3. Git Clone (Conditional)
- If URL provided → clone to workspace
- If local path → validate exists

### 4. ARK Agent: code-analyzer
- **Model**: Claude Sonnet 4.5
- **Input**: Repository path
- **Scans**: Java, C#, TypeScript files
- **Extracts**:
  - JPA entities with fields/relationships
  - REST controllers with endpoints
  - Service classes with methods
  - Blazor pages and components
- **Output**: JSON with complete code structure

### 5. ARK Agent: migration-planner
- **Model**: Claude Opus 4.6 (most powerful)
- **Input**: Code analysis from step 4
- **Creates**:
  - Microservices decomposition plan
  - Micro-frontend module definitions
  - API contracts (OpenAPI specs)
  - Migration sequence
- **Interactive**: User can chat to modify plan!
- **Output**: Detailed migration blueprint

### 6. Service Generator (Local)
- **Uses**: SpringBootServiceGenerator.ts
- **Input**: Migration plan
- **Generates** for each microservice:
  - Maven pom.xml (Spring Boot 3.2, Java 17)
  - JPA entities with relationships
  - Spring Data repositories
  - Service layer with business logic
  - REST controllers with validation
  - Security config (JWT)
  - Unit & integration tests
  - Dockerfile

### 7. Frontend Migrator (Local)
- **Uses**: AngularMicroFrontendGenerator.ts
- **Input**: Migration plan
- **Generates**:
  - Shell application (host)
  - 4 remote micro-frontends
  - Webpack Module Federation config
  - Angular routing & guards
  - HTTP services & interceptors
  - Component structure
  - Dockerfile

### 8. Quality Validator (Local)
- **Uses**: functionalValidator.ts
- **Validates**:
  - ✓ Maven builds (all services)
  - ✓ npm builds (all MFEs)
  - ✓ Entities match source (70%+)
  - ✓ Endpoints match source (70%+)
  - ✓ Business logic preserved
  - ✓ No security vulnerabilities
  - ✓ Tests pass
- **If fails**: Migration PAUSED → user can retry
- **If passes**: Continue to deployment

### 9. Container Deployment (Optional)
- Builds Docker images
- Deploys to OpenShift/containers
- Creates routes and services

### 10. n8n Completion
- n8n polls status every 5 seconds
- When complete: downloads generated code
- Returns result to caller

## 🎛️ Control Flow

```
User Action → n8n → Backend → ARK Agents → Local Generators → Validator → Deploy
                                  ↓              ↓               ↓         ↓
                              WebSocket ────────────────────────────────> Frontend
                                  ↓
                              Real-time progress updates
```

## 🔧 Key Features

### Interactive Chat with Migration Planner
- User can chat with `migration-planner` agent
- Modify services, combine/split, change ports
- Agent adjusts plan based on feedback

### Quality Validator Stops Bad Code
- Comprehensive validation before deployment
- User sees detailed error report
- Can fix and retry validation

### Real-time Updates
- WebSocket broadcasts progress
- Frontend shows live agent status
- No polling needed for frontend

### Flexible Input
- Git URL (auto-clones)
- Local path (validates)

---

**This is your actual workflow!** The n8n workflow file matches this architecture.
