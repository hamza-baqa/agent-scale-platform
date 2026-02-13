# Deploy Agent@Scale Platform to ark-at-scale.space

> **Complete Step-by-Step Guide** - Follow this carefully for your important project

## 🎯 What We're Deploying

1. **Your Local Project** → Cloud Server
2. **5 ARK Agents** → Cloud ARK Instance
3. **n8n Workflow** → Cloud n8n (ark-at-scale.space/n8n)
4. **Backend + Frontend** → Docker containers on cloud

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] Access to ark-at-scale.space server (SSH)
- [ ] Access to ark-at-scale.space/n8n (login credentials)
- [ ] Access to cloud ARK instance (if separate from n8n)
- [ ] Docker installed on ark-at-scale.space
- [ ] Git (optional, for version control)

---

## 📋 Step 1: Export Your n8n Workflow

### 1.1 Export from Local n8n

```bash
# Open your local n8n
open http://localhost:5678

# In n8n UI:
1. Go to your workflow (the one in the screenshot)
2. Click the "..." menu (top right)
3. Select "Download"
4. Save as: migration-workflow-with-ark-agents.json
5. Move to project directory
```

**OR via CLI (if you have n8n CLI):**

```bash
# Export workflow by ID
n8n export:workflow --id=<workflow-id> --output=./migration-workflow-with-ark-agents.json
```

### 1.2 Move to Project Directory

```bash
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"
mv ~/Downloads/migration-workflow-with-ark-agents.json ./platform/
```

---

## 📋 Step 2: Prepare ARK Agents for Deployment

Your ARK agents are already defined in `ark/agents/`. Let's prepare them:

```bash
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"

# Verify all agent files exist
ls -la ark/agents/

# You should see:
# - code-analyzer.yaml
# - migration-planner.yaml
# - service-generator.yaml
# - frontend-migrator.yaml
# - quality-validator.yaml
```

---

## 📋 Step 3: Upload Project to Cloud Server

### 3.1 Create Deployment Package

```bash
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"

# Create archive (excludes node_modules, workspace, etc.)
tar -czf agent-scale-platform.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='platform/backend/workspace' \
  --exclude='platform/backend/outputs' \
  --exclude='.run-pids' \
  .
```

### 3.2 Upload to Server

**Option A: Using scp**

```bash
# Upload archive
scp agent-scale-platform.tar.gz user@ark-at-scale.space:/opt/

# SSH into server
ssh user@ark-at-scale.space

# Extract
cd /opt
tar -xzf agent-scale-platform.tar.gz -C agent-scale-platform
cd agent-scale-platform
```

**Option B: Using rsync (recommended)**

```bash
# From your local machine
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='platform/backend/workspace' \
  --exclude='platform/backend/outputs' \
  . user@ark-at-scale.space:/opt/agent-scale-platform/

# SSH into server
ssh user@ark-at-scale.space
cd /opt/agent-scale-platform
```

---

## 📋 Step 4: Deploy ARK Agents to Cloud

### 4.1 Check Your ARK Setup

First, determine where your ARK instance is:

```bash
# On ark-at-scale.space server
# Check if ARK is running in Kubernetes
kubectl get namespaces | grep ark

# Check if ARK API is accessible
curl http://ark-api.ark-system.svc.cluster.local:80/health
# OR
curl http://localhost:8090/health
```

### 4.2 Deploy ARK Agents

**If ARK is in Kubernetes:**

```bash
cd /opt/agent-scale-platform

# Create namespace (if not exists)
kubectl create namespace banque-migration

# Deploy all agents
kubectl apply -f ark/agents/code-analyzer.yaml
kubectl apply -f ark/agents/migration-planner.yaml
kubectl apply -f ark/agents/service-generator.yaml
kubectl apply -f ark/agents/frontend-migrator.yaml
kubectl apply -f ark/agents/quality-validator.yaml

# Verify agents are deployed
kubectl get agents -n banque-migration
kubectl describe agent code-analyzer -n banque-migration
```

**If ARK is standalone:**

```bash
# Use ARK CLI to register agents
ark agent create -f ark/agents/code-analyzer.yaml
ark agent create -f ark/agents/migration-planner.yaml
ark agent create -f ark/agents/service-generator.yaml
ark agent create -f ark/agents/frontend-migrator.yaml
ark agent create -f ark/agents/quality-validator.yaml

# Verify
ark agent list
```

---

## 📋 Step 5: Deploy Platform (Backend + Frontend)

### 5.1 Install Prerequisites

```bash
# On ark-at-scale.space server
cd /opt/agent-scale-platform

# Install Docker (if not installed)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for docker group to take effect
exit
ssh user@ark-at-scale.space
cd /opt/agent-scale-platform
```

### 5.2 Configure Environment

```bash
# Create production environment file
cat > .env.production <<EOF
# JWT Secret
JWT_SECRET=$(openssl rand -hex 32)

# Domain
DOMAIN=ark-at-scale.space
FRONTEND_URL=https://ark-at-scale.space

# n8n Configuration (your cloud n8n)
N8N_WEBHOOK_URL=https://ark-at-scale.space/n8n/webhook/migration
N8N_API_URL=https://ark-at-scale.space/n8n/api/v1

# ARK Configuration
ARK_API_URL=http://ark-api.ark-system.svc.cluster.local:80
ARK_NAMESPACE=banque-migration

# Database
POSTGRES_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)

# Backend Port (use different port if 4000 is taken)
BACKEND_PORT=4000

# Frontend Port (use different port if 3000 is taken)
FRONTEND_PORT=3000
EOF

chmod 600 .env.production
```

### 5.3 Deploy with Docker Compose

```bash
# Pull Ollama and download AI model first
docker-compose -f docker-compose.cloud.yml up -d ollama

# Wait for Ollama to start
sleep 10

# Download llama3 model (this takes 5-10 minutes)
docker exec agent-scale-ollama ollama pull llama3

# Verify model is downloaded
docker exec agent-scale-ollama ollama list

# Now start all services
docker-compose -f docker-compose.cloud.yml up -d --build

# Check status
docker-compose -f docker-compose.cloud.yml ps

# View logs
docker-compose -f docker-compose.cloud.yml logs -f
```

### 5.4 Verify Platform is Running

```bash
# Check backend health
curl http://localhost:4000/health

# Check frontend
curl http://localhost:3000

# Check mock ARK
curl http://localhost:8080/health

# Check all containers are healthy
docker-compose -f docker-compose.cloud.yml ps
```

---

## 📋 Step 6: Import Workflow to Cloud n8n

### 6.1 Access Cloud n8n

```bash
# Open in browser
open https://ark-at-scale.space/n8n

# Login with your credentials
# (You do this manually - DO NOT share credentials)
```

### 6.2 Install ARK Custom Nodes (if needed)

If your cloud n8n doesn't have ARK nodes yet:

```
1. In n8n: Settings → Community Nodes
2. Install package: @ark/n8n-nodes-ark
   (or whatever package provides ARK Agent nodes)
3. Restart n8n if required
```

### 6.3 Import Your Workflow

```
1. In n8n UI: Click "+" (Add Workflow)
2. Click "..." menu → "Import from File"
3. Select: migration-workflow-with-ark-agents.json
4. Click "Import"
5. Workflow appears with all your nodes
```

### 6.4 Configure ARK Agent Nodes

For each ARK Agent node in the workflow:

```
1. Click on the ARK Agent node (e.g., "ARK Agent: Code Analyzer")
2. In settings panel:
   - ARK API URL: http://ark-api.ark-system.svc.cluster.local:80
   - Agent Name: code-analyzer
   - Namespace: banque-migration
3. Save node
4. Repeat for all 5 ARK Agent nodes:
   - code-analyzer
   - migration-planner
   - service-generator
   - frontend-migrator
   - quality-validator
```

### 6.5 Configure Webhook

```
1. Click "Webhook Trigger" node
2. Note the webhook URL (e.g., /webhook/migration)
3. Save workflow
4. Activate workflow (toggle switch)
5. Copy the full webhook URL:
   https://ark-at-scale.space/n8n/webhook/migration
```

---

## 📋 Step 7: Connect Platform to n8n

### 7.1 Update Backend Configuration

```bash
# On ark-at-scale.space server
cd /opt/agent-scale-platform

# Update .env.production with correct n8n webhook
nano .env.production

# Update this line:
N8N_WEBHOOK_URL=https://ark-at-scale.space/n8n/webhook/migration

# Save and exit (Ctrl+X, Y, Enter)

# Restart backend
docker-compose -f docker-compose.cloud.yml restart backend
```

### 7.2 Update Frontend Configuration

```bash
# Update frontend environment
cat > platform/frontend/.env.production <<EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
EOF

# Rebuild frontend
docker-compose -f docker-compose.cloud.yml up -d --build frontend
```

---

## 📋 Step 8: Test End-to-End

### 8.1 Test n8n Workflow Trigger

```bash
# From your local machine or server
curl -X POST https://ark-at-scale.space/n8n/webhook/migration \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryPath": "/opt/agent-scale-platform/test-repo"
  }'

# Check n8n execution
# Go to: https://ark-at-scale.space/n8n/executions
# You should see the workflow executing
```

### 8.2 Test via Frontend

```bash
# Access frontend
open http://ark-at-scale.space:3000

# Or if behind proxy:
open https://ark-at-scale.space

# Start a migration through the UI
# Monitor in real-time
```

### 8.3 Verify ARK Agents

```bash
# Check ARK agents are responding
kubectl logs -n banque-migration -l app=code-analyzer --tail=50
kubectl logs -n banque-migration -l app=migration-planner --tail=50

# Check agent status
kubectl get agents -n banque-migration
```

---

## 📋 Step 9: Set Up Monitoring

### 9.1 View Logs

```bash
# Backend logs
docker-compose -f docker-compose.cloud.yml logs -f backend

# Frontend logs
docker-compose -f docker-compose.cloud.yml logs -f frontend

# Mock ARK logs
docker-compose -f docker-compose.cloud.yml logs -f mock-ark

# All logs
docker-compose -f docker-compose.cloud.yml logs -f

# n8n logs (if you have access to n8n container)
docker logs -f n8n-container-name
```

### 9.2 Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Disk space
df -h
```

---

## 📋 Step 10: Configure HTTPS (Optional but Recommended)

### 10.1 Set Up SSL Certificate

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d ark-at-scale.space

# Certificates will be in:
# /etc/letsencrypt/live/ark-at-scale.space/
```

### 10.2 Configure Nginx Reverse Proxy

```bash
# Create nginx config
sudo nano /etc/nginx/sites-available/agent-scale

# Add configuration:
server {
    listen 80;
    server_name ark-at-scale.space;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ark-at-scale.space;

    ssl_certificate /etc/letsencrypt/live/ark-at-scale.space/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ark-at-scale.space/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/agent-scale /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ✅ Verification Checklist

After deployment, verify everything:

- [ ] Platform accessible at https://ark-at-scale.space
- [ ] Backend health check: `curl https://ark-at-scale.space/api/health`
- [ ] Frontend loads without errors
- [ ] n8n workflow is active at /n8n/home/workflows
- [ ] n8n webhook responds: `curl https://ark-at-scale.space/n8n/webhook/migration`
- [ ] All 5 ARK agents deployed: `kubectl get agents -n banque-migration`
- [ ] ARK agents accessible from n8n workflow
- [ ] Test migration completes successfully
- [ ] WebSocket real-time updates work
- [ ] Download generated code works
- [ ] All Docker containers healthy: `docker-compose ps`

---

## 🐛 Troubleshooting

### Platform Won't Start

```bash
# Check logs
docker-compose -f docker-compose.cloud.yml logs

# Restart services
docker-compose -f docker-compose.cloud.yml restart

# Rebuild from scratch
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build --force-recreate
```

### n8n Can't Connect to ARK Agents

```bash
# Verify ARK agents are running
kubectl get agents -n banque-migration
kubectl get pods -n banque-migration

# Check ARK API is accessible
curl http://ark-api.ark-system.svc.cluster.local:80/health

# Check n8n can reach ARK
# From n8n container:
docker exec -it n8n-container curl http://ark-api.ark-system.svc.cluster.local:80/health
```

### Workflow Executions Fail

```bash
# Check n8n logs
docker logs n8n-container-name

# Check workflow execution details in n8n UI
# Go to: Executions → Click failed execution → View error

# Verify ARK agent configuration in workflow nodes
# Ensure URLs and namespaces are correct
```

### Backend Can't Connect to Database

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.cloud.yml ps postgres

# Test connection
docker exec agent-scale-postgres psql -U banque -d migrations -c "SELECT 1"

# Check connection string in backend
docker-compose -f docker-compose.cloud.yml logs backend | grep DATABASE
```

---

## 📞 Next Steps

1. ✅ Export your local n8n workflow
2. ✅ Upload project to cloud server
3. ✅ Deploy ARK agents
4. ✅ Deploy platform with Docker Compose
5. ✅ Import workflow to cloud n8n
6. ✅ Configure connections
7. ✅ Test end-to-end
8. ✅ Set up monitoring
9. ✅ Configure HTTPS (optional)

---

## 📚 Useful Commands

```bash
# View all running containers
docker ps

# View all services status
docker-compose -f docker-compose.cloud.yml ps

# Restart specific service
docker-compose -f docker-compose.cloud.yml restart backend

# View logs for specific service
docker-compose -f docker-compose.cloud.yml logs -f backend

# Stop all services
docker-compose -f docker-compose.cloud.yml down

# Update and restart (after code changes)
git pull
docker-compose -f docker-compose.cloud.yml up -d --build

# Check disk usage
docker system df

# Clean up unused Docker resources
docker system prune -a

# Check ARK agents
kubectl get agents -n banque-migration
kubectl describe agent code-analyzer -n banque-migration
kubectl logs -n banque-migration -l app=code-analyzer

# Check n8n executions via API
curl https://ark-at-scale.space/n8n/api/v1/executions
```

---

**Deployment Status**: Ready to deploy step-by-step
**Security**: Follow all steps manually - never share credentials
**Support**: Each step has troubleshooting guidance
