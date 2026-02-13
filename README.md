# Banking Application Migration Platform

> AI-Powered Code Transformation using ARK Agents & n8n Orchestration

Transform legacy banking applications into modern microservices and micro-frontends architecture automatically using AI agents.

## 🎯 Overview

This project demonstrates **automated code migration** where:
1. A client inputs their repository URL
2. AI agents analyze and transform the code in real-time
3. The client watches the transformation happen live
4. Generated microservices and micro-frontends are delivered

**Live Demo**: Watch ARK agents transform `banque-app-main` from Blazor + Spring Boot monolith to Angular micro-frontends + Spring Boot microservices.

## 🏗️ Architecture

```
                    ┌─────────────────────┐
                    │  Client Dashboard   │
                    │   (React/Next.js)   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │    Backend API      │
                    │ (Node.js + Socket)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   n8n Workflow      │
                    │  (Orchestration)    │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                       │
┌───────▼────────┐  ┌─────────▼──────────┐  ┌────────▼─────────┐
│ Code Analyzer  │  │ Migration Planner  │  │ Service Gen      │
│  ARK Agent     │  │    ARK Agent       │  │  ARK Agent       │
└────────────────┘  └────────────────────┘  └──────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                       │
┌───────▼────────┐  ┌─────────▼──────────┐
│ Frontend Mig   │  │ Quality Validator  │
│  ARK Agent     │  │    ARK Agent       │
└────────────────┘  └────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Generated Code:     │
                    │ • 5 Microservices   │
                    │ • 4 Micro-frontends │
                    │ • Tests & Docs      │
                    └─────────────────────┘
```

## ✨ Features

### For Clients
- 🚀 **One-Click Migration**: Enter repo URL and start
- 📊 **Real-time Visualization**: Watch AI agents work live
- 🔍 **Code Review**: Browse generated code instantly
- 📈 **Quality Reports**: Automated testing and validation
- 💾 **Download**: Get complete transformed codebase

### Technical
- **5 ARK AI Agents**: Code analysis, planning, generation, migration, validation
- **n8n Visual Orchestration**: Workflow automation and monitoring
- **WebSocket Updates**: Real-time progress streaming
- **Kubernetes Native**: Scalable, cloud-ready deployment
- **Extensible**: Add custom agents and workflows

## 🚀 Simple Quick Start (Recommended)

Run everything with **one command** for local development:

```bash
# 1. Set your Anthropic API key (required for Mock ARK)
export ANTHROPIC_API_KEY=your-api-key-here

# 2. Start everything (Mock ARK + Backend + Frontend)
./RUN-SIMPLE.sh

# 3. Open browser
open http://localhost:3000

# 4. To stop everything
./STOP-ALL.sh
```

**Features:**
- ✅ **Simple setup** - No Kubernetes needed
- ✅ **Mock ARK service** - Test ARK agents locally
- ✅ **One command** - Starts everything automatically
- ✅ **Fast setup** - Ready in minutes

---

## 🚀 Full Production Setup (Advanced)

For Kubernetes deployment with ARK agents:

### Prerequisites

```bash
# Required
- Kubernetes cluster (Minikube, K3s, or cloud)
- kubectl configured
- Helm 3+
- Node.js 18+
- Anthropic API key

# Verify
kubectl version
helm version
node --version
```

### Installation (5 minutes)

```bash
# 1. Clone repository
cd /home/hbaqa/Desktop/banque-app-transformed

# 2. Install ARK on Kubernetes
kubectl create namespace ark-system
# Follow ARK installation guide

# 3. Deploy ARK agents
kubectl create namespace banque-migration
kubectl apply -f ark/agents/
kubectl apply -f ark/teams/

# 4. Install n8n with ARK custom nodes
helm install ark-n8n oci://ghcr.io/skokaina/charts/ark-n8n \
  --set ark.apiUrl=http://ark-api.ark-system.svc.cluster.local:80

kubectl port-forward svc/ark-n8n 5678:5678 &

# 5. Import n8n workflow
# Open http://localhost:5678
# Import: platform/n8n-workflows/banque-migration-workflow.json
# Configure ARK API credentials

# 6. Start backend
cd platform/backend
npm install
cp .env.example .env
# Edit .env (set N8N_WEBHOOK_URL)
npm run dev &

# 7. Start frontend
cd ../frontend
npm install
cp .env.local.example .env.local
npm run dev &

# 8. Open demo dashboard
open http://localhost:3000
```

**Full Setup Guide**: See [`SETUP-DEMO-PLATFORM.md`](./SETUP-DEMO-PLATFORM.md)

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [SETUP-DEMO-PLATFORM.md](./SETUP-DEMO-PLATFORM.md) | Complete installation and configuration guide |
| [PROJECT-SUMMARY.md](./PROJECT-SUMMARY.md) | Detailed project overview and architecture |
| [platform/README.md](./platform/README.md) | Platform architecture and API docs |
| [platform/backend/README.md](./platform/backend/README.md) | Backend API documentation |
| [platform/frontend/README.md](./platform/frontend/README.md) | Frontend dashboard documentation |

## 🎬 Demo Usage

### Starting a Migration

1. **Open Dashboard**: http://localhost:3000

2. **Enter Repository**:
   ```
   Repository URL: https://github.com/your-org/banque-app-main
   ```

3. **Watch Real-time Progress**:
   ```
   ✅ Code Analyzer    ████████████ 100% (45s)
   ✅ Migration Plan   ████████████ 100% (1m 12s)
   ⏳ Service Gen      ████████░░░░ 65% (running...)
   ⏳ Frontend Mig     ██████░░░░░░ 50% (running...)
   ⏸ Quality Check    ░░░░░░░░░░░░ 0% (waiting...)
   ```

4. **Review Results**:
   - Browse generated microservices
   - Review Angular micro-frontends
   - View quality report
   - Download ZIP

### Sample Output

After migration, you get:

```
generated-code/
├── microservices/
│   ├── auth-service/        # JWT authentication
│   ├── client-service/      # Client management
│   ├── account-service/     # Account operations
│   ├── transaction-service/ # Transactions
│   ├── card-service/        # Card management
│   ├── api-gateway/         # Spring Cloud Gateway
│   └── config-server/       # Centralized config
├── micro-frontends/
│   ├── shell/               # Host application
│   ├── auth-mfe/            # Login/registration
│   ├── dashboard-mfe/       # Account overview
│   ├── transfers-mfe/       # Money transfers
│   └── cards-mfe/           # Card management
├── infrastructure/
│   ├── docker/              # Dockerfiles
│   ├── kubernetes/          # K8s manifests
│   └── openshift/           # OpenShift configs
└── validation-report.json   # Quality metrics
```

## 🧩 Components

### ARK Agents (`ark/agents/`)

| Agent | Purpose | Model | Duration |
|-------|---------|-------|----------|
| **Code Analyzer** | Extract entities, services, APIs | Claude Sonnet 4.5 | ~1 min |
| **Migration Planner** | Create migration blueprint | Claude Opus 4.5 | ~2 min |
| **Service Generator** | Generate Spring Boot services | Claude Sonnet 4.5 | ~5 min |
| **Frontend Migrator** | Convert to Angular MFEs | Claude Sonnet 4.5 | ~5 min |
| **Quality Validator** | Test and validate code | Claude Sonnet 4.5 | ~2 min |

### n8n Workflow (`platform/n8n-workflows/`)

Visual workflow that:
1. Receives webhook trigger
2. Executes agents sequentially
3. Runs service + frontend generation in parallel
4. Validates quality
5. Returns results

### Backend API (`platform/backend/`)

Node.js/Express server providing:
- `POST /api/migrations` - Start migration
- `GET /api/migrations/:id` - Get status
- `GET /api/migrations/:id/download` - Download result
- `WebSocket /socket` - Real-time updates

### Frontend Dashboard (`platform/frontend/`)

Next.js React application with:
- Repository input form
- Real-time agent progress visualization
- Code review interface
- Quality report display
- Download functionality

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```bash
N8N_WEBHOOK_URL=http://localhost:5678/webhook/migration
ARK_API_URL=http://ark-api.ark-system.svc.cluster.local:80
ANTHROPIC_API_KEY=sk-ant-xxx
```

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

### ARK Configuration (`~/.arkrc.yaml`):
```yaml
apiUrl: http://localhost:8090
defaultModel:
  provider: anthropic
  model: claude-sonnet-4-5
  apiKey: ${ANTHROPIC_API_KEY}
```

## 📊 Technology Stack

| Layer | Technology |
|-------|------------|
| **Orchestration** | ARK (AI Agents), n8n (Workflows), Kubernetes |
| **Backend** | Node.js, Express, TypeScript, Socket.io |
| **Frontend** | Next.js 14, React, Tailwind CSS, Socket.io Client |
| **Generated Services** | Spring Boot 3.2, Java 17, PostgreSQL |
| **Generated Frontend** | Angular 18, Webpack Module Federation |
| **AI Models** | Claude Sonnet 4.5, Claude Opus 4.5 |

## 🎯 Use Cases

### 1. Client Demonstration
Show potential clients how their legacy code can be automatically transformed.

### 2. Proof of Concept
Validate the approach before full migration project.

### 3. Training & Education
Teach teams about microservices architecture and AI-assisted migration.

### 4. Migration Service
Offer as a service for legacy application transformation.

## 📈 Metrics & Reporting

The platform tracks:
- **Migration Success Rate**: % of successful transformations
- **Agent Execution Time**: Duration per agent
- **Code Quality**: Coverage, security, maintainability scores
- **User Engagement**: Demo views, migrations started

## 🔐 Security

For production deployment:

1. **Authentication**: Add JWT/OAuth
2. **HTTPS**: Configure TLS certificates
3. **RBAC**: Implement role-based access
4. **Secrets**: Use Kubernetes secrets or Vault
5. **Network Policies**: Restrict pod communication

See [`SETUP-DEMO-PLATFORM.md`](./SETUP-DEMO-PLATFORM.md) for details.

## 🚢 Deployment

### Local Development
```bash
# All services on localhost
Backend:  http://localhost:4000
Frontend: http://localhost:3000
n8n:      http://localhost:5678
```

### Kubernetes Production
```bash
# Deploy all components
kubectl apply -f platform/k8s/

# Access via ingress
https://migration-demo.yourcompany.com
```

### Docker Compose
```bash
cd platform
docker-compose up
```

## 🤝 Contributing

### Adding Custom Agents

1. Create agent YAML:
   ```yaml
   apiVersion: agents.ark.ai/v1
   kind: Agent
   metadata:
     name: custom-agent
   spec:
     model:
       provider: anthropic
       model: claude-sonnet-4-5
     systemPrompt: |
       Your agent instructions...
   ```

2. Deploy:
   ```bash
   kubectl apply -f custom-agent.yaml
   ```

3. Add to n8n workflow

### Extending the Platform

- **Backend**: Add routes in `platform/backend/src/routes/`
- **Frontend**: Add components in `platform/frontend/src/components/`
- **Workflow**: Modify `platform/n8n-workflows/banque-migration-workflow.json`

## 📚 Resources

- **ARK Documentation**: https://mckinsey.github.io/agents-at-scale-ark/
- **n8n Documentation**: https://docs.n8n.io/
- **ARK n8n Custom Nodes**: https://github.com/skokaina/ark-n8n-custom-nodes
- **Spring Boot**: https://spring.io/projects/spring-boot
- **Angular**: https://angular.io/
- **Next.js**: https://nextjs.org/

## 🐛 Troubleshooting

### Common Issues

**n8n workflow not triggering**:
```bash
# Check webhook URL
curl -X POST http://localhost:5678/webhook/migration \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**ARK agents not found**:
```bash
kubectl get agents -n banque-migration
kubectl describe agent code-analyzer -n banque-migration
```

**WebSocket not connecting**:
- Check CORS settings in backend
- Verify frontend WebSocket URL in `.env.local`
- Check browser console for errors

See [`SETUP-DEMO-PLATFORM.md`](./SETUP-DEMO-PLATFORM.md) for more troubleshooting.

## 📝 License

MIT

## 👥 Authors

- **EuroBank Innovation Team**
- Built with ARK framework by McKinsey
- Uses ARK n8n custom nodes by [@skokaina](https://github.com/skokaina)

## 📞 Support

- **Documentation**: See `docs/` folder
- **Issues**: GitHub Issues
- **Email**: support@eurobank.com

---

## 🎉 Quick Links

- 📘 [Setup Guide](./SETUP-DEMO-PLATFORM.md)
- 📊 [Project Summary](./PROJECT-SUMMARY.md)
- 🏗️ [Platform Docs](./platform/README.md)
- 🎯 [Demo Video](#) (Coming soon)

---

**Status**: ✅ Demo-Ready Foundation | **Version**: 1.0.0 | **Last Updated**: February 5, 2026
