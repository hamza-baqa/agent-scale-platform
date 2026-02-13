# Banking Migration Demonstration Platform - Complete Setup Guide

## Overview

This guide will help you set up the **complete demonstration platform** that shows clients how ARK agents transform their banking application from a monolithic architecture to microservices and micro-frontends.

## Architecture Overview

```
Client Browser (React Dashboard)
         ↓
Backend API (Node.js/Express + WebSocket)
         ↓
n8n Workflows (Visual Orchestration)
         ↓
ARK Agents (AI-powered Code Transformation)
         ↓
Generated Code (Microservices + Micro-frontends)
```

## Prerequisites

### Required Software

1. **Kubernetes Cluster** (Minikube, K3s, or cloud provider)
   ```bash
   # For local development with Minikube
   minikube start --cpus=4 --memory=8192
   ```

2. **kubectl** - Kubernetes CLI
   ```bash
   kubectl version --client
   ```

3. **Helm 3+** - Package manager for Kubernetes
   ```bash
   helm version
   ```

4. **Node.js 18+** and **npm**
   ```bash
   node --version
   npm --version
   ```

5. **Docker** (for building images)
   ```bash
   docker --version
   ```

6. **Git**
   ```bash
   git --version
   ```

### API Keys

- **Anthropic API Key** (for Claude models in ARK)
  - Get it from: https://console.anthropic.com/
  - Set as: `ANTHROPIC_API_KEY`

## Step-by-Step Installation

### Step 1: Install ARK on Kubernetes

```bash
# Add ARK Helm repository (if available)
# Note: ARK may need to be installed manually if not in a public repo

# Create namespace
kubectl create namespace ark-system

# Install ARK
kubectl apply -f https://github.com/mckinsey/ark/releases/latest/download/ark-install.yaml

# Verify installation
kubectl get pods -n ark-system
kubectl get services -n ark-system

# Set API key
kubectl create secret generic ark-api-key \
  -n ark-system \
  --from-literal=ANTHROPIC_API_KEY=your-api-key-here
```

### Step 2: Deploy ARK Agents

```bash
cd /home/hbaqa/Desktop/banque-app-transformed

# Create namespace for migration agents
kubectl create namespace banque-migration

# Deploy agents
kubectl apply -f ark/agents/code-analyzer.yaml
kubectl apply -f ark/agents/migration-planner.yaml
kubectl apply -f ark/agents/service-generator.yaml
kubectl apply -f ark/agents/frontend-migrator.yaml
kubectl apply -f ark/agents/quality-validator.yaml

# Deploy team
kubectl apply -f ark/teams/migration-team.yaml

# Verify agents
kubectl get agents -n banque-migration
```

### Step 3: Install n8n with ARK Custom Nodes

```bash
# Install n8n with ARK nodes
helm install ark-n8n oci://ghcr.io/skokaina/charts/ark-n8n \
  --set ark.apiUrl=http://ark-api.ark-system.svc.cluster.local:80 \
  --namespace default \
  --create-namespace

# Wait for n8n to be ready
kubectl wait --for=condition=ready pod -l app=ark-n8n -n default --timeout=300s

# Port forward n8n (for local access)
kubectl port-forward svc/ark-n8n 5678:5678 -n default &

# Access n8n UI
echo "n8n UI: http://localhost:5678"
```

### Step 4: Configure n8n

1. **Open n8n UI**: http://localhost:5678

2. **Create ARK API Credentials**:
   - Go to: **Settings** → **Credentials** → **New Credential**
   - Select: **ARK API**
   - Enter:
     - **Base URL**: `http://ark-api.ark-system.svc.cluster.local:80`
     - **Namespace**: `banque-migration`
   - Save

3. **Import Migration Workflow**:
   - Go to: **Workflows** → **Import from File**
   - Select: `/home/hbaqa/Desktop/banque-app-transformed/platform/n8n-workflows/banque-migration-workflow.json`
   - Update ARK API credentials in all ARK Agent nodes
   - **Activate** the workflow

4. **Get Webhook URL**:
   - Click on "Webhook Trigger" node
   - Copy the **Production URL**
   - Example: `http://localhost:5678/webhook/migration`

### Step 5: Deploy Backend API

```bash
cd platform/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Edit .env and set:
nano .env
```

Update `.env`:
```bash
PORT=4000
N8N_WEBHOOK_URL=http://localhost:5678/webhook/migration
ARK_API_URL=http://ark-api.ark-system.svc.cluster.local:80
ARK_NAMESPACE=banque-migration
WORKSPACE_DIR=./workspace
OUTPUT_DIR=./outputs
FRONTEND_URL=http://localhost:3000
```

```bash
# Build and start backend
npm run build
npm start

# Or for development with hot reload
npm run dev
```

Backend will be available at: http://localhost:4000

### Step 6: Deploy Frontend Dashboard

```bash
cd platform/frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

Update `.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

```bash
# Start frontend
npm run dev
```

Frontend will be available at: http://localhost:3000

## Platform Usage

### For Demonstrating to Clients

1. **Open the Demo Dashboard**:
   - Navigate to: http://localhost:3000

2. **Start a Migration**:
   - Enter repository URL: `https://github.com/your-org/banque-app-main`
   - Click "Start Migration"

3. **Watch Real-time Progress**:
   - See agents executing in sequence
   - Monitor progress bars for each agent
   - View live logs from ARK

4. **Review Results**:
   - Browse generated microservices
   - Review micro-frontends code
   - View quality validation report
   - Download complete transformed codebase as ZIP

### Workflow Visualization

The platform shows:

```
[1. Code Analyzer] ████████████ 100% ✓ Completed in 45s
   ↓ Extracted 15 entities, 8 services, 25 endpoints

[2. Migration Planner] ████████████ 100% ✓ Completed in 1m 12s
   ↓ Planned 5 microservices, 4 micro-frontends

[3. Service Generator] ██████████░░ 85% ⏳ Generating...
   ↓ Generated 3/5 services

[4. Frontend Migrator] ████████░░░░ 65% ⏳ Migrating...
   ↓ Generated 2/4 micro-frontends

[5. Quality Validator] ░░░░░░░░░░░░ 0% ⏸ Waiting...
```

## Advanced Configuration

### Kubernetes Deployment (Production)

```bash
# Build and push images
cd platform/backend
docker build -t your-registry/migration-platform-backend:latest .
docker push your-registry/migration-platform-backend:latest

cd ../frontend
docker build -t your-registry/migration-platform-frontend:latest .
docker push your-registry/migration-platform-frontend:latest

# Deploy to Kubernetes
kubectl apply -f platform/k8s/backend-deployment.yaml
kubectl apply -f platform/k8s/frontend-deployment.yaml
kubectl apply -f platform/k8s/ingress.yaml
```

### Database Setup (Optional)

For persistent migration state:

```bash
# Deploy PostgreSQL
helm install postgres bitnami/postgresql \
  --set auth.postgresPassword=yourpassword \
  --set auth.database=migrations \
  --namespace default

# Update backend .env
DATABASE_URL=postgresql://postgres:yourpassword@postgres-postgresql:5432/migrations
```

### Redis for WebSocket Scaling (Optional)

```bash
# Deploy Redis
helm install redis bitnami/redis \
  --set auth.password=yourredispassword \
  --namespace default

# Update backend .env
REDIS_URL=redis://redis-master:6379
REDIS_PASSWORD=yourredispassword
```

## Troubleshooting

### n8n Workflow Not Executing

1. Check n8n logs:
   ```bash
   kubectl logs -l app=ark-n8n -n default -f
   ```

2. Verify ARK API connectivity from n8n:
   ```bash
   kubectl exec -it deployment/ark-n8n -n default -- \
     curl http://ark-api.ark-system.svc.cluster.local:80/v1/agents
   ```

3. Check workflow execution history in n8n UI

### ARK Agents Not Running

1. Verify agents are deployed:
   ```bash
   kubectl get agents -n banque-migration
   ```

2. Check agent logs:
   ```bash
   kubectl logs -l app=ark-agent -n ark-system -f
   ```

3. Verify API key is set:
   ```bash
   kubectl get secret ark-api-key -n ark-system -o yaml
   ```

### Backend Cannot Reach n8n

1. Check n8n service:
   ```bash
   kubectl get svc ark-n8n -n default
   ```

2. Test connectivity:
   ```bash
   curl -X POST http://localhost:5678/webhook/migration \
     -H "Content-Type: application/json" \
     -d '{"test": "true"}'
   ```

3. Check backend logs:
   ```bash
   # If running locally
   tail -f platform/backend/logs/backend.log

   # If running in Kubernetes
   kubectl logs deployment/platform-backend -f
   ```

### WebSocket Connection Issues

1. Check CORS configuration in backend
2. Verify WebSocket server is running:
   ```bash
   curl http://localhost:4000/health
   ```
3. Check browser console for WebSocket errors

## Customization

### Adding Custom Agents

1. Create agent YAML:
   ```yaml
   apiVersion: agents.ark.ai/v1
   kind: Agent
   metadata:
     name: custom-agent
     namespace: banque-migration
   spec:
     model:
       provider: anthropic
       model: claude-sonnet-4-5
     systemPrompt: |
       Your custom agent instructions...
   ```

2. Deploy:
   ```bash
   kubectl apply -f custom-agent.yaml
   ```

3. Add to n8n workflow:
   - Drag "ARK Agent" node
   - Select "custom-agent"
   - Configure inputs

### Customizing UI

Frontend is built with:
- **Next.js 14** + React
- **Tailwind CSS** for styling
- **Socket.io-client** for real-time updates

Key files:
- `platform/frontend/src/app/page.tsx` - Landing page
- `platform/frontend/src/app/dashboard/page.tsx` - Main dashboard
- `platform/frontend/src/components/AgentProgress.tsx` - Progress visualization

## Security Considerations

### For Production Deployment

1. **Enable Authentication**:
   - Add JWT authentication to backend API
   - Implement user management
   - Add API keys for n8n webhooks

2. **HTTPS/TLS**:
   - Configure Ingress with TLS certificates
   - Use cert-manager for auto-renewal

3. **Network Policies**:
   - Restrict pod-to-pod communication
   - Isolate namespaces

4. **RBAC**:
   - Create service accounts with minimal permissions
   - Implement role-based access control

5. **Secrets Management**:
   - Use external secrets (Vault, AWS Secrets Manager)
   - Rotate API keys regularly

## Monitoring

### Metrics to Track

1. **Migration Success Rate**: Percentage of successful migrations
2. **Agent Execution Time**: Time per agent
3. **API Response Time**: Backend API latency
4. **WebSocket Connections**: Number of active clients
5. **Resource Usage**: CPU/Memory per pod

### Setting Up Prometheus

```bash
# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Configure backend to expose metrics
# Already configured at /metrics endpoint
```

## Demo Script for Clients

### Presentation Flow

1. **Introduction** (2 minutes):
   - Show architecture diagram
   - Explain ARK agents and n8n orchestration

2. **Live Demo** (8 minutes):
   - Open dashboard: http://localhost:3000
   - Enter client's repository URL
   - Click "Start Migration"
   - Show real-time agent execution
   - Explain each agent's role as it runs

3. **Results Review** (5 minutes):
   - Browse generated microservices
   - Show Angular micro-frontends
   - Review quality report
   - Download transformed code

4. **Q&A** (5 minutes)

### Sample Repository

Use the included `banque-app-main` as a demo repository:
- Path: `/home/hbaqa/Desktop/banque-app-main`
- Or clone: `git clone https://github.com/your-org/banque-app-main`

## Next Steps

After successful demo:

1. **Customize for Client Needs**:
   - Add client-specific agents
   - Customize migration rules
   - Brand the dashboard

2. **Production Deployment**:
   - Deploy to production Kubernetes cluster
   - Configure domain and SSL
   - Set up monitoring and alerts

3. **Training**:
   - Train client team on platform usage
   - Provide documentation
   - Set up support channels

## Support

- **Documentation**: See `platform/README.md`
- **Issues**: GitHub Issues
- **Email**: support@eurobank.com

## Resources

- [ARK Documentation](https://mckinsey.github.io/agents-at-scale-ark/)
- [n8n Documentation](https://docs.n8n.io/)
- [ARK n8n Custom Nodes](https://github.com/skokaina/ark-n8n-custom-nodes)

## License

MIT
