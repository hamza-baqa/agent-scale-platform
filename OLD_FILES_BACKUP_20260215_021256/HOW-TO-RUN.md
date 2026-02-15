# How to Run the Banking Migration Platform

This guide will help you run the complete demonstration platform on your local machine.

## Quick Start (5 Minutes)

### Prerequisites Check

```bash
# Check you have everything installed
node --version    # Should be 18+
npm --version     # Should be 9+
kubectl version   # Kubernetes CLI
helm version      # Helm 3+
docker --version  # Docker engine
```

### Option 1: Automated Setup (Recommended)

```bash
cd /home/hbaqa/Desktop/banque-app-transformed

# Run the automated installer
./install-demo.sh

# This will:
# - Check all prerequisites
# - Deploy ARK agents to Kubernetes
# - Install n8n with ARK custom nodes
# - Set up backend and frontend
# - Create start/stop scripts
```

### Option 2: Manual Setup

Follow the steps below if you prefer manual control or if the automated installer fails.

---

## Step-by-Step Manual Setup

### Step 1: Start Kubernetes Cluster

```bash
# If using Minikube
minikube start --cpus=4 --memory=8192 --driver=docker

# Verify cluster is running
kubectl cluster-info
```

### Step 2: Install ARK on Kubernetes

```bash
# Create ARK namespace
kubectl create namespace ark-system

# Install ARK (follow official ARK documentation)
# https://mckinsey.github.io/agents-at-scale-ark/

# Set your Anthropic API key
kubectl create secret generic ark-api-key \
  -n ark-system \
  --from-literal=ANTHROPIC_API_KEY=your-api-key-here

# Verify ARK is running
kubectl get pods -n ark-system
```

### Step 3: Deploy ARK Agents

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

# Deploy team orchestration
kubectl apply -f ark/teams/migration-team.yaml

# Verify agents are deployed
kubectl get agents -n banque-migration
```

Expected output:
```
NAME                  STATUS   AGE
code-analyzer         Ready    10s
migration-planner     Ready    10s
service-generator     Ready    10s
frontend-migrator     Ready    10s
quality-validator     Ready    10s
```

### Step 4: Install n8n with ARK Custom Nodes

```bash
# Install n8n
helm install ark-n8n oci://ghcr.io/skokaina/charts/ark-n8n \
  --set ark.apiUrl=http://ark-api.ark-system.svc.cluster.local:80 \
  --namespace default \
  --wait

# Wait for n8n to be ready (may take 2-3 minutes)
kubectl wait --for=condition=ready pod -l app=ark-n8n -n default --timeout=300s

# Port forward n8n (keep this terminal open)
kubectl port-forward svc/ark-n8n 5678:5678 -n default
```

In a new terminal, verify n8n is accessible:
```bash
curl http://localhost:5678
# Should return HTML
```

### Step 5: Configure n8n

1. **Open n8n UI**: http://localhost:5678

2. **Configure ARK API Credentials**:
   - Click **Settings** → **Credentials** → **New Credential**
   - Select **ARK API**
   - Enter:
     - **Base URL**: `http://ark-api.ark-system.svc.cluster.local:80`
     - **Namespace**: `banque-migration`
   - Click **Save**

3. **Import Migration Workflow**:
   - Click **Workflows** → **Import from File**
   - Select: `/home/hbaqa/Desktop/banque-app-transformed/platform/n8n-workflows/banque-migration-workflow.json`
   - For each **ARK Agent** node:
     - Click on the node
     - Select the ARK API credential you just created
   - Click **Save**
   - Click **Activate** (toggle switch in top right)

4. **Get Webhook URL**:
   - Click on the **Webhook Trigger** node
   - Copy the **Production URL** (e.g., `http://localhost:5678/webhook/migration`)
   - You'll need this for the backend

### Step 6: Start Backend API

```bash
cd /home/hbaqa/Desktop/banque-app-transformed/platform/backend

# Install dependencies (first time only)
npm install

# Create environment file
cp .env.example .env

# Edit .env
nano .env
```

Update `.env` with:
```bash
PORT=4000
N8N_WEBHOOK_URL=http://localhost:5678/webhook/migration
ARK_API_URL=http://ark-api.ark-system.svc.cluster.local:80
ARK_NAMESPACE=banque-migration
WORKSPACE_DIR=./workspace
OUTPUT_DIR=./outputs
FRONTEND_URL=http://localhost:3000
ANTHROPIC_API_KEY=your-api-key-here
```

Start the backend:
```bash
# Development mode (with hot reload)
npm run dev

# Or production mode
npm run build
npm start
```

Expected output:
```
🚀 Server running on port 4000
📊 API Documentation: http://localhost:4000/api-docs
🔍 Health Check: http://localhost:4000/health
🌐 Environment: development
📡 WebSocket enabled
```

Keep this terminal open.

### Step 7: Start Frontend Dashboard

Open a new terminal:

```bash
cd /home/hbaqa/Desktop/banque-app-transformed/platform/frontend

# Install dependencies (first time only)
npm install

# Create environment file
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

Update `.env.local` with:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

Start the frontend:
```bash
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.5s
```

### Step 8: Access the Platform

Open your browser and go to: **http://localhost:3000**

---

## Running the Demo

### Start a Migration

1. **Open Dashboard**: http://localhost:3000

2. **Enter Repository URL**:
   ```
   https://github.com/your-org/banque-app-main
   ```
   Or use a test repository.

3. **Click "Start Migration"**

4. **Watch Real-time Progress**:
   - You'll be redirected to the dashboard
   - See agents executing in real-time
   - Progress bars update automatically via WebSocket
   - Each agent's status and output is displayed

5. **Review Results**:
   - When complete, click "Download Results"
   - Get ZIP file with all generated code

### Monitor Agent Execution

You can also monitor agent execution in n8n:

1. **Open n8n**: http://localhost:5678
2. **Go to Executions** tab
3. **Click on the running execution**
4. **See visual workflow progress**

---

## Troubleshooting

### Backend won't start

**Error**: `Cannot connect to n8n`

**Solution**:
```bash
# Check n8n is running
curl http://localhost:5678/webhook/migration

# If fails, restart port-forward
kubectl port-forward svc/ark-n8n 5678:5678 -n default
```

### n8n workflow not triggering

**Check**:
1. Workflow is activated (green toggle)
2. Webhook URL is correct in backend `.env`
3. ARK credentials are configured in all nodes

**Test webhook manually**:
```bash
curl -X POST http://localhost:5678/webhook/migration \
  -H "Content-Type: application/json" \
  -d '{
    "migrationId": "test-123",
    "repoUrl": "https://github.com/test/repo",
    "backendUrl": "http://localhost:4000"
  }'
```

### ARK agents not found

**Check agents are deployed**:
```bash
kubectl get agents -n banque-migration
```

**View agent details**:
```bash
kubectl describe agent code-analyzer -n banque-migration
```

**Check ARK API is accessible**:
```bash
kubectl exec -it deployment/ark-n8n -n default -- \
  curl http://ark-api.ark-system.svc.cluster.local:80/v1/agents
```

### WebSocket not connecting

**Check CORS settings** in backend `src/server.ts`:
```typescript
cors: {
  origin: 'http://localhost:3000',
  credentials: true
}
```

**Check browser console** for WebSocket errors.

### Frontend shows "Loading migration..."

**Check backend is running**:
```bash
curl http://localhost:4000/health
```

**Check migration exists**:
```bash
curl http://localhost:4000/api/migrations/YOUR_MIGRATION_ID
```

### Port already in use

**Kill existing processes**:
```bash
# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9

# Kill process on port 4000 (backend)
lsof -ti:4000 | xargs kill -9

# Kill process on port 5678 (n8n port-forward)
lsof -ti:5678 | xargs kill -9
```

---

## Using the Quick Start Scripts

After running `./install-demo.sh`, you have convenience scripts:

### Start All Services

```bash
./start-demo.sh
```

This script:
- Starts n8n port-forward
- Starts backend API
- Starts frontend dev server
- Shows all URLs and logs

### Stop All Services

```bash
./stop-demo.sh
```

This script:
- Stops all node processes
- Kills port-forwards
- Cleans up PIDs

### View Logs

```bash
# Backend logs
tail -f logs/backend.log

# Frontend logs
tail -f logs/frontend.log
```

---

## Service URLs

Once everything is running:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | Demo dashboard |
| **Backend API** | http://localhost:4000 | REST API |
| **API Docs** | http://localhost:4000/api-docs | Swagger UI |
| **Health Check** | http://localhost:4000/health | Status check |
| **n8n UI** | http://localhost:5678 | Workflow editor |
| **WebSocket** | ws://localhost:4000 | Real-time updates |

---

## Testing the Platform

### Test Backend API

```bash
# Health check
curl http://localhost:4000/health

# Create migration (will fail without real repo)
curl -X POST http://localhost:4000/api/migrations \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/test/repo",
    "options": {
      "includeDocs": true,
      "includeTests": true
    }
  }'
```

### Test WebSocket

Open browser console on http://localhost:3000 and run:
```javascript
const socket = io('http://localhost:4000');
socket.on('connect', () => console.log('Connected!'));
socket.on('agent-started', (data) => console.log('Agent started:', data));
```

### Test n8n Workflow

1. Open n8n: http://localhost:5678
2. Click on your workflow
3. Click **Execute Workflow** button (top right)
4. Enter test data manually
5. Watch execution in real-time

---

## Environment Variables Reference

### Backend (`.env`)

```bash
PORT=4000                              # API server port
NODE_ENV=development                   # Environment
N8N_WEBHOOK_URL=http://...            # n8n webhook endpoint
ARK_API_URL=http://...                # ARK API endpoint
ARK_NAMESPACE=banque-migration        # K8s namespace
WORKSPACE_DIR=./workspace             # Temp workspace
OUTPUT_DIR=./outputs                  # Output directory
FRONTEND_URL=http://localhost:3000    # CORS origin
ANTHROPIC_API_KEY=sk-ant-xxx         # Claude API key
```

### Frontend (`.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000     # Backend API
NEXT_PUBLIC_WS_URL=ws://localhost:4000        # WebSocket
NEXT_PUBLIC_DEMO_REPO_URL=https://...        # Demo repo (optional)
```

---

## Production Deployment

For production deployment to Kubernetes:

```bash
# Build images
cd platform/backend
docker build -t your-registry/migration-backend:latest .
docker push your-registry/migration-backend:latest

cd ../frontend
docker build -t your-registry/migration-frontend:latest .
docker push your-registry/migration-frontend:latest

# Deploy to Kubernetes
kubectl apply -f platform/k8s/
```

---

## Next Steps

1. **Customize the platform** for your specific use case
2. **Add authentication** for production use
3. **Configure monitoring** with Prometheus/Grafana
4. **Set up CI/CD** pipelines for automated deployment

---

## Support

- **Documentation**: See `SETUP-DEMO-PLATFORM.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Project Overview**: See `PROJECT-SUMMARY.md`

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│              Quick Command Reference                     │
├─────────────────────────────────────────────────────────┤
│ Start Everything:  ./start-demo.sh                      │
│ Stop Everything:   ./stop-demo.sh                       │
│                                                          │
│ Frontend:          cd platform/frontend && npm run dev  │
│ Backend:           cd platform/backend && npm run dev   │
│ n8n Port Forward:  kubectl port-forward svc/ark-n8n ... │
│                                                          │
│ Check Agents:      kubectl get agents -n banque-...     │
│ Check Pods:        kubectl get pods -n ark-system       │
│ View Logs:         kubectl logs -f pod/...              │
│                                                          │
│ Frontend URL:      http://localhost:3000                │
│ Backend URL:       http://localhost:4000                │
│ n8n URL:           http://localhost:5678                │
└─────────────────────────────────────────────────────────┘
```

**Ready to demo!** 🚀
