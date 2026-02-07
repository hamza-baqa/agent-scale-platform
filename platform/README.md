# Banking Application Migration Demonstration Platform

## Overview

This platform provides a **client-facing demonstration** of automated code transformation using:
- **ARK (Agentic Runtime for Kubernetes)** - AI agent orchestration
- **n8n** - Visual workflow automation
- **Custom ARK n8n Nodes** - Integration between n8n and ARK

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         React Dashboard (port 3000)                   │  │
│  │  - Repository Input                                   │  │
│  │  - Real-time Progress Viewer                          │  │
│  │  - Code Review Interface                              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│              Backend API Server (port 4000)                  │
│  - Migration Job Management                                  │
│  - n8n Webhook Integration                                   │
│  - WebSocket Server (real-time updates)                      │
│  - File System Management                                    │
└─────────────────────────────────────────────────────────────┘
                          ↕ HTTP API
┌─────────────────────────────────────────────────────────────┐
│                   n8n (port 5678)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Migration Orchestration Workflow              │  │
│  │                                                       │  │
│  │  1. Webhook Trigger (receives repo URL)             │  │
│  │         ↓                                            │  │
│  │  2. ARK Agent: Code Analyzer                         │  │
│  │         ↓                                            │  │
│  │  3. ARK Agent: Migration Planner                     │  │
│  │         ↓                                            │  │
│  │  4. ARK Agent: Service Generator (parallel)          │  │
│  │     ARK Agent: Frontend Migrator (parallel)          │  │
│  │         ↓                                            │  │
│  │  5. ARK Agent: Quality Validator                     │  │
│  │         ↓                                            │  │
│  │  6. Webhook Response (send results to backend)       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↕ ARK API
┌─────────────────────────────────────────────────────────────┐
│              ARK Runtime (Kubernetes)                        │
│  - Agent Execution Engine                                    │
│  - Memory Management                                         │
│  - Model Integration (Claude, GPT-4)                         │
│  - Tool Execution                                            │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

1. **Kubernetes Cluster** with ARK installed
2. **n8n with ARK Custom Nodes** deployed
3. **Node.js 18+** and **npm**

### Installation

```bash
# 1. Install ARK on Kubernetes
helm install ark oci://ghcr.io/mckinsey/ark

# 2. Install n8n with ARK nodes
helm install ark-n8n oci://ghcr.io/skokaina/charts/ark-n8n \
  --set ark.apiUrl=http://ark-api.default.svc.cluster.local:80

# 3. Install platform backend
cd platform/backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm start

# 4. Install platform frontend
cd platform/frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with API URLs
npm run dev
```

### Access

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **n8n UI**: http://localhost:5678 (or your configured domain)
- **ARK Dashboard**: http://localhost:8090 (if ARK dashboard is enabled)

## Features

### 1. Repository Input
- Enter Git repository URL
- Configure transformation options
- Select target architecture patterns

### 2. Real-time Agent Visualization
- See which agent is currently executing
- Progress percentage for each phase
- Live logs from ARK agents
- Estimated time remaining

### 3. Code Review Interface
- Side-by-side comparison (original vs transformed)
- File tree navigation
- Syntax highlighting
- Download transformed code as ZIP

### 4. Quality Report
- Code coverage metrics
- Security scan results
- Build status
- Architectural compliance score

## Platform Components

### Frontend (`platform/frontend/`)
- **Technology**: Next.js 14, React, TypeScript, Tailwind CSS
- **Key Pages**:
  - `/` - Landing page with demo CTA
  - `/dashboard` - Main migration dashboard
  - `/review` - Code review interface
  - `/reports` - Quality reports

### Backend (`platform/backend/`)
- **Technology**: Node.js, Express, TypeScript, Socket.io
- **Key Routes**:
  - `POST /api/migrations` - Start new migration
  - `GET /api/migrations/:id` - Get migration status
  - `GET /api/migrations/:id/files` - List generated files
  - `GET /api/migrations/:id/download` - Download ZIP
  - `WebSocket /socket` - Real-time updates

### n8n Workflows (`platform/n8n-workflows/`)
- **migration-workflow.json** - Main orchestration workflow
- **agent-test-workflows/** - Individual agent testing

## n8n Workflow Details

### Migration Workflow Nodes

1. **Webhook Trigger**
   - Receives: `{ repoUrl, options }`
   - Returns: `{ migrationId, status }`

2. **ARK Agent: Code Analyzer**
   - Agent: `code-analyzer`
   - Input: Repository path
   - Output: Analysis JSON (entities, services, controllers)

3. **ARK Agent: Migration Planner**
   - Agent: `migration-planner`
   - Input: Analysis JSON
   - Output: Migration plan (service definitions, API contracts)

4. **Parallel Execution**
   - **ARK Agent: Service Generator**
     - Input: Migration plan (backend services)
     - Output: Generated Spring Boot microservices

   - **ARK Agent: Frontend Migrator**
     - Input: Migration plan (frontend modules)
     - Output: Generated Angular micro-frontends

5. **ARK Agent: Quality Validator**
   - Input: All generated code
   - Output: Validation report (tests, security, quality)

6. **HTTP Request: Update Backend**
   - POST to backend API with results
   - Triggers WebSocket broadcast to clients

### Webhook Configuration

**n8n Webhook URL**: `http://ark-n8n.default.127.0.0.1.nip.io/webhook/migration`

**Payload**:
```json
{
  "migrationId": "unique-id-123",
  "repoUrl": "https://github.com/user/banque-app-main",
  "options": {
    "targetStack": "angular-springboot",
    "includeDocs": true,
    "includeTests": true
  }
}
```

## ARK Agent Configurations

All agents are defined in `/microservices/../ark/agents/`:

- `code-analyzer.yaml`
- `migration-planner.yaml`
- `service-generator.yaml`
- `frontend-migrator.yaml`
- `quality-validator.yaml`

Deploy agents:
```bash
kubectl apply -f ../microservices/ark/agents/
```

## Real-time Updates

The platform uses WebSocket for live updates:

```typescript
// Client subscribes
socket.emit('subscribe', { migrationId: '123' });

// Server broadcasts updates
socket.emit('agent-started', {
  agent: 'code-analyzer',
  status: 'running',
  timestamp: '2024-02-05T10:00:00Z'
});

socket.emit('agent-completed', {
  agent: 'code-analyzer',
  status: 'success',
  output: { /* analysis results */ },
  duration: '45s'
});
```

## Deployment

### Kubernetes Deployment

```bash
# Deploy backend
kubectl apply -f platform/k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f platform/k8s/frontend-deployment.yaml

# Create ingress
kubectl apply -f platform/k8s/ingress.yaml
```

### Docker Compose (Development)

```bash
cd platform
docker-compose up
```

This starts:
- Frontend (port 3000)
- Backend (port 4000)
- PostgreSQL (for backend state)
- Redis (for WebSocket scaling)

## Environment Variables

### Backend `.env`
```
PORT=4000
N8N_WEBHOOK_URL=http://ark-n8n:5678/webhook/migration
ARK_API_URL=http://ark-api.default.svc.cluster.local:80
DATABASE_URL=postgresql://user:pass@localhost:5432/migrations
REDIS_URL=redis://localhost:6379
```

### Frontend `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## Security Considerations

1. **Authentication**: Add JWT authentication for production
2. **RBAC**: Implement role-based access (admin, viewer)
3. **Rate Limiting**: Prevent abuse of migration API
4. **Repository Validation**: Validate Git URLs before cloning
5. **Sandboxing**: Run code analysis in isolated containers

## Monitoring

- **Backend Metrics**: Prometheus endpoint `/metrics`
- **n8n Workflow Metrics**: Track execution success/failure rates
- **ARK Agent Metrics**: Monitor agent response times and costs
- **Client Usage**: Track migrations per user/org

## Troubleshooting

### Migration Stuck
1. Check n8n workflow execution: http://localhost:5678/executions
2. View ARK agent logs: `kubectl logs -l app=ark-agent -n ark-system`
3. Check backend logs: `kubectl logs deployment/platform-backend`

### Agents Not Found
1. Verify ARK agents are deployed: `kubectl get agents -n default`
2. Check n8n ARK API credentials: n8n UI → Credentials
3. Test ARK API connectivity from n8n pod

### WebSocket Not Connecting
1. Check CORS configuration in backend
2. Verify WebSocket server is running: `curl localhost:4000/health`
3. Check browser console for connection errors

## Development

### Adding New Agents

1. Create agent YAML in `../microservices/ark/agents/`
2. Deploy to Kubernetes: `kubectl apply -f agent.yaml`
3. Add agent node to n8n workflow
4. Update backend to handle new agent events

### Customizing UI

Frontend uses Tailwind CSS. Key components:
- `components/MigrationDashboard.tsx` - Main dashboard
- `components/AgentProgress.tsx` - Real-time agent visualization
- `components/CodeReview.tsx` - Code review interface

## API Documentation

Full API docs available at: http://localhost:4000/api-docs (Swagger UI)

## License

MIT

## Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/banque-migration-platform/issues
- Email: support@eurobank.com
