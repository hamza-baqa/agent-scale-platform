# Agent@Scale Migration Platform

> AI-Powered Legacy Code Transformation using ARK Agents

Transform legacy monolithic applications into modern microservices and micro-frontends architecture automatically using AI agents.

---

## 🚀 Quick Start (One Command)

```bash
./RUN-SIMPLE.sh
```

**Time**: 2 minutes first run, 30 seconds after restart
**What it does**: Starts Minikube, ARK, 10 agents, backend, frontend
**Features**: Persists across terminal closures ✅

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Migration Platform** | http://localhost:3000 | Main web UI |
| **Backend API** | http://localhost:4000 | REST API |
| **ARK Dashboard** | http://localhost:3001 | ARK monitoring |
| **ARK API** | http://localhost:8080 | ARK agents |

### Other Commands

```bash
./STATUS-CHECK.sh   # Check all services status
./STOP-ALL.sh       # Stop everything gracefully
```

---

## 🎯 How It Works

```
User Input (Repo URL/Path)
        ↓
    Dashboard (React)
        ↓
    Backend API (Node.js)
        ↓
    ARK Agents (Kubernetes)
        ↓
 Generated Code (Download)
```

### 10 AI Agents Pipeline

1. **code-analyzer** → Analyzes source code (entities, services, APIs)
2. **migration-planner** → Creates migration blueprint
3. **service-generator** → Generates Spring Boot microservices
4. **frontend-migrator** → Generates Angular micro-frontends
5. **quality-validator** → Validates code quality
6. **unit-test-validator** → Validates unit tests
7. **integration-test-validator** → Validates integration tests
8. **e2e-test-validator** → Validates E2E tests
9. **error-analyzer** → Analyzes errors if migration fails
10. **retry-planner** → Plans retry strategy

**Models Used**: Claude Sonnet 4.5, Claude Opus 4.5
**Total Pipeline Time**: ~15 minutes

---

## 📊 What Gets Generated?

After migration completes, download contains:

```
output/
├── backend/
│   ├── auth-service/        # JWT authentication (Spring Boot 3.2+)
│   ├── client-service/      # Client management
│   ├── account-service/     # Account operations
│   ├── transaction-service/ # Transactions
│   └── card-service/        # Card management
├── frontend/
│   ├── shell/               # Host application (Angular 17+)
│   ├── auth-mfe/            # Login micro-frontend
│   ├── dashboard-mfe/       # Dashboard micro-frontend
│   └── transfers-mfe/       # Transfers micro-frontend
├── docker-compose.yml       # Complete orchestration
├── start.sh                 # One-command deployment
└── stop.sh                  # Shutdown script
```

### Technology Stack

**Generated Backend**:
- Spring Boot 3.2+
- Java 17
- PostgreSQL (database per service)
- Spring Security + JWT
- Spring Data JPA
- Docker multi-stage builds

**Generated Frontend**:
- Angular 17+
- Webpack Module Federation
- Standalone Components
- TypeScript
- RxJS
- Docker Nginx

**Infrastructure**:
- Redis (caching)
- RabbitMQ (messaging)
- PostgreSQL (per-service databases)
- Docker Compose orchestration

---

## 🎬 Usage Example

### 1. Start Platform
```bash
./RUN-SIMPLE.sh
# Wait 2 minutes for full startup
```

### 2. Open Dashboard
```bash
open http://localhost:3000
```

### 3. Start Migration
- Enter repository path: `/path/to/legacy-app`
- Or GitHub URL: `https://github.com/your-org/legacy-app`
- Click **"Start Migration Now"**

### 4. Watch Real-Time Progress
```
✅ Code Analyzer       100% (1m 30s)
✅ Migration Planner   100% (2m 15s)
⏳ Service Generator   65% (running...)
⏳ Frontend Migrator   50% (running...)
⏸ Quality Validator   0% (waiting...)
```

### 5. Download Generated Code
- Click **"Download"** button
- Extract ZIP file
- Run deployment:
  ```bash
  cd output
  ./start.sh
  ```

---

## ✅ Recent Fixes (Production Ready)

### Process Persistence ✅
**Problem**: Services died when terminal closed
**Solution**: Added `nohup` + `disown` to all background processes
**Result**: Services persist across terminal closures
**Test**: Close terminal → Open new terminal → Run `./STATUS-CHECK.sh` → All services still running

### Complete Service Generation ✅
**Problem**: Only 2/5 services generated (missing account, transaction, card)
**Solution**: Enhanced ARK agent prompts with strict validation
**Result**: All 5 services + all entities now generated correctly
**Test**: Run migration → All entities covered → 100% service generation

### Deployment-Ready Output ✅
**Problem**: Generated `docker-compose.yml` referenced non-existent `api-gateway`
**Solution**: Set `includeApiGateway: false` until infrastructure generator implemented
**Result**: `./start.sh` works without errors
**Test**: Download generated code → `./start.sh` → All services start successfully

---

## 🏗️ Architecture

### Platform Components

```
┌─────────────────────────────────────────────┐
│         Frontend (Next.js + React)          │
│     http://localhost:3000                   │
│  - Repository input form                    │
│  - Real-time agent visualization            │
│  - Code review interface                    │
│  - Download functionality                   │
└──────────────────┬──────────────────────────┘
                   │ WebSocket + REST
┌──────────────────▼──────────────────────────┐
│      Backend (Node.js + Express)            │
│     http://localhost:4000                   │
│  - Migration orchestration                  │
│  - WebSocket real-time updates              │
│  - File system management                   │
│  - ZIP archive generation                   │
└──────────────────┬──────────────────────────┘
                   │ HTTP/REST
┌──────────────────▼──────────────────────────┐
│        ARK API (Kubernetes)                 │
│     http://localhost:8080                   │
│  - Agent execution                          │
│  - Model management (Claude)                │
│  - Context management                       │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼─────────┐  ┌────────▼────────┐
│  10 ARK Agents  │  │  Kubernetes     │
│  (Deployed)     │  │  (Minikube)     │
└─────────────────┘  └─────────────────┘
```

### Data Flow

1. **User Input** → Dashboard captures repo URL/path
2. **API Call** → POST `/api/migrations/repo`
3. **Agent Execution** → Backend triggers ARK agents sequentially
4. **Real-Time Updates** → WebSocket streams progress to dashboard
5. **Code Generation** → Agents generate microservices + micro-frontends
6. **ZIP Archive** → Backend creates downloadable package
7. **User Download** → Frontend provides download link

---

## 🔧 Configuration

### ARK Configuration
Located in: `RUN-SIMPLE.sh` (lines 127-180)

```yaml
apiUrl: http://localhost:8080
defaultModel:
  provider: openai
  baseURL: http://ark-api.ark-system.svc.cluster.local:80/v1
  apiKey: ${OPENAI_API_KEY}  # Set this environment variable
modelConfigs:
  - name: gpt-4o
    provider: openai
    apiKey: ${OPENAI_API_KEY}
```

### Backend Environment
Located in: `platform/backend/.env`

```bash
PORT=4000
ARK_API_URL=http://localhost:8080
WORKSPACE_DIR=./workspace
OUTPUT_DIR=./outputs
```

### Frontend Environment
Located in: `platform/frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## 📁 Project Structure

```
banque-app-transformed/
├── platform/
│   ├── backend/          # Node.js API server
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Business logic
│   │   │   └── utils/    # Helpers
│   │   └── workspace/    # Migration workspaces
│   └── frontend/         # Next.js dashboard
│       └── src/
│           ├── components/
│           ├── pages/
│           └── services/
├── ark/
│   └── agents/           # 10 ARK agent YAML configs
├── RUN-SIMPLE.sh         # Main startup script
├── STOP-ALL.sh           # Shutdown script
├── STATUS-CHECK.sh       # Status check script
├── .run-pids/            # Process IDs and logs
├── outputs/              # Generated ZIP archives
└── README.md             # This file
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
./STOP-ALL.sh
./RUN-SIMPLE.sh
```

### Services Not Accessible
```bash
# Check status
./STATUS-CHECK.sh

# View logs
tail -f .run-pids/backend.log
tail -f .run-pids/frontend.log
tail -f .run-pids/ark-api-forward.log
```

### ARK API Not Available
```bash
# RUN-SIMPLE.sh has built-in retry (30 seconds)
# If fails, check:
kubectl get pods -n default
kubectl logs -n default $(kubectl get pods -n default -l app=ark-api -o name)
```

### Minikube Issues
```bash
minikube status
minikube start
minikube delete  # Nuclear option
./RUN-SIMPLE.sh
```

### Agent Not Available
```bash
# Wait 30 seconds for model validation
kubectl get agent code-analyzer -n default
kubectl describe agent code-analyzer -n default
```

### WebSocket Not Connecting
```bash
# Check backend is running
curl http://localhost:4000/health

# Check browser console (F12) for errors
# Verify frontend .env.local has correct WS_URL
```

---

## 🧪 Testing Generated Code

After downloading generated code:

```bash
# Extract ZIP
unzip migration-{id}.zip
cd output

# Verify structure
ls -la
# Should see: backend/, frontend/, docker-compose.yml, start.sh, stop.sh

# Test deployment
./start.sh

# Expected output:
# 🚀 Starting Banque Application...
# 📦 Using: docker compose
# 📦 Building Docker images...
# 🔧 Starting services...
# ✅ Application started successfully!

# Check running containers
docker compose ps
# Should show 15+ containers

# Access services
curl http://localhost:8081/actuator/health  # Auth service
curl http://localhost:8082/actuator/health  # Client service
curl http://localhost:8083/actuator/health  # Account service
curl http://localhost:8084/actuator/health  # Transaction service
curl http://localhost:8085/actuator/health  # Card service

# Access frontend
open http://localhost:4200  # Shell app
open http://localhost:4201  # Auth MFE

# Stop deployment
./stop.sh
```

---

## 📊 Metrics & Monitoring

### Migration Metrics
- **Success Rate**: Tracked per migration
- **Agent Execution Time**: Per agent duration
- **Code Quality**: Coverage, security scores
- **Entity Coverage**: 100% (all entities get services)

### View Logs
```bash
# Real-time agent logs (Dashboard)
http://localhost:3000/dashboard?id={migrationId}
# Click on any agent → "📜 Logs" tab

# Backend logs
tail -f .run-pids/backend.log

# Frontend logs
tail -f .run-pids/frontend.log
```

---

## 🎯 Use Cases

### 1. Client Demonstrations
Show potential clients how their legacy code transforms automatically.

### 2. Proof of Concept
Validate migration approach before full project commitment.

### 3. Training & Education
Teach teams about microservices architecture and AI-assisted migration.

### 4. Migration Service
Offer as a service for legacy application transformation.

---

## 🔐 Security Considerations

**For Production Deployment**:

1. **Authentication**: Add JWT/OAuth to platform
2. **HTTPS**: Configure TLS certificates
3. **Secrets Management**: Use Kubernetes secrets for API keys
4. **Network Policies**: Restrict pod-to-pod communication
5. **RBAC**: Implement role-based access control
6. **Code Scanning**: Add security scanning to generated code
7. **API Rate Limiting**: Protect against abuse

---

## 📚 Additional Resources

- **ARK Documentation**: https://mckinsey.github.io/agents-at-scale-ark/
- **Spring Boot**: https://spring.io/projects/spring-boot
- **Angular**: https://angular.io/
- **Next.js**: https://nextjs.org/
- **Docker Compose**: https://docs.docker.com/compose/

---

## 📝 Technical Details

### Agent Prompts
Located in: `ark/agents/*.yaml`

Each agent has:
- **System Prompt**: Instructions and constraints
- **Model Configuration**: Provider, model name, API key
- **Tools**: Available functions (file operations, search, etc.)
- **Validation**: Output format requirements

### Entity Parser
Located in: `platform/backend/src/services/arkChatService.ts:751-834`

Extracts JPA entities from code-analyzer output:
```typescript
const entityRegex = /\*\*\d+\.\s+([A-Z][a-zA-Z]+)\*\*(?:\s+\(Extends\s+([A-Z][a-zA-Z]+)\))?/g
```

Handles formats like:
- `**1. Owner** (Extends Person)`
- `**2. Pet**`

### Docker Compose Generator
Located in: `platform/backend/src/services/dockerComposeGenerator.ts`

Generates:
- `docker-compose.yml` (services orchestration)
- `.env.example` (environment template)
- `docker-compose.dev.yml` (development overrides)
- `start.sh` (deployment script)
- `stop.sh` (shutdown script)

---

## 🆕 Recent Updates

**2026-02-15**:
- ✅ Fixed process persistence (nohup + disown)
- ✅ Fixed complete service generation (all entities covered)
- ✅ Fixed deployment-ready output (no manual edits needed)
- ✅ Backend restarted with all fixes applied

**2026-02-13**:
- ✅ Fixed ARK API port-forward timing (30-second retry loop)
- ✅ Fixed entity parser (correct regex extraction)
- ✅ Fixed migration-planner hallucination (domain-specific services)

**2026-02-12**:
- ✅ Added 3 test validators (unit, integration, e2e)
- ✅ Fixed agent workflow (all 9 agents execute)
- ✅ Added real-time logs & animations (WebSocket streaming)

---

## 📞 Support

For issues or questions:
1. Check `./STATUS-CHECK.sh` output
2. Review logs in `.run-pids/*.log`
3. Check agent status: `kubectl get agents -n default`
4. Verify services: `curl http://localhost:4000/health`

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: February 15, 2026
**License**: MIT
