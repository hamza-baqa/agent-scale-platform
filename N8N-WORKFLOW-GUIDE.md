# n8n Workflow Integration Guide

## 🎯 Overview

Your Agent@Scale Platform uses **ARK agents** and **local generators** orchestrated by the **backend**. The n8n workflow acts as an external trigger and monitor.

## 📊 Your Actual Migration Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Migration Process (Orchestrated by Backend)                │
└─────────────────────────────────────────────────────────────┘

1. Git Clone (if repository URL provided)
   └─> Clones repository to workspace

2. ARK Agent: code-analyzer
   └─> Analyzes Spring Boot + Blazor codebase
   └─> Extracts entities, controllers, services, pages
   └─> Model: Claude Sonnet 4.5

3. ARK Agent: migration-planner (Interactive Chat Enabled)
   └─> Creates migration blueprint
   └─> Defines microservices decomposition
   └─> Plans micro-frontend modules
   └─> Model: Claude Opus 4.6
   └─> User can chat with agent to modify plan!

4. Local Generator: SpringBootServiceGenerator
   └─> Generates 5-7 Spring Boot microservices
   └─> Creates JPA entities, repositories, services, controllers
   └─> Adds security, tests, Dockerfiles

5. Local Generator: AngularMicroFrontendGenerator
   └─> Generates Angular 18 micro-frontends
   └─> Creates shell + remote MFEs with Module Federation
   └─> Adds routing, guards, services

6. Local Validator: functionalValidator
   └─> Validates builds (Maven + npm)
   └─> Runs tests and checks coverage
   └─> Scans for security vulnerabilities
   └─> Compares source vs generated (entities, endpoints)
   └─> STOPS if validation fails - user can retry

7. Container Deployment (Optional)
   └─> Builds Docker images
   └─> Deploys to OpenShift or local containers
```

## 🏗️ ARK Agents in Your Setup

### 1. code-analyzer
- **Namespace**: `banque-migration`
- **Model**: Claude Sonnet 4.5
- **Purpose**: Extract entities, services, APIs from source code
- **Input**: Repository path
- **Output**: JSON with entities, controllers, pages, framework info

### 2. migration-planner
- **Namespace**: `banque-migration`
- **Model**: Claude Opus 4.6 (most powerful for architecture)
- **Purpose**: Create migration blueprint
- **Input**: Code analysis report
- **Output**: Migration plan with services, frontends, API contracts
- **Special**: **Interactive chat enabled** - users can modify the plan!

### 3. service-generator (ARK Agent Definition)
- **Namespace**: `banque-migration`
- **Model**: Claude Sonnet 4.5
- **Purpose**: Generate Spring Boot microservices
- **Note**: Currently implemented as local generator in backend

### 4. frontend-migrator (ARK Agent Definition)
- **Namespace**: `banque-migration`
- **Model**: Claude Sonnet 4.5
- **Purpose**: Generate Angular micro-frontends
- **Note**: Currently implemented as local generator in backend

### 5. quality-validator (ARK Agent Definition)
- **Namespace**: `banque-migration`
- **Model**: Claude Sonnet 4.5
- **Purpose**: Validate code quality, builds, tests, security
- **Note**: Currently implemented as local validator in backend

## 🔄 n8n Workflow Options

### Option 1: Simple Trigger Workflow (Recommended)

**Use Case**: Just trigger migrations and monitor status

The workflow in `platform/n8n-workflow-migration.json` does:
1. Receives webhook trigger with `repositoryUrl`
2. Calls backend API to start migration
3. Polls status every 5 seconds
4. Downloads generated code when complete
5. Returns result

**Import Steps**:
```bash
1. Login to n8n: https://ark-at-scale.space/n8n
2. Go to: Workflows → Import from File
3. Upload: platform/n8n-workflow-migration.json
4. Activate workflow
5. Get webhook URL: https://ark-at-scale.space/n8n/webhook/migration
```

**Test**:
```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/your-org/banking-app"
  }'
```

### Option 2: Advanced Workflow with ARK Agent Calls

**Use Case**: Direct ARK agent orchestration from n8n

If you want to call ARK agents directly from n8n instead of using the backend orchestration:

#### Install ARK Custom Nodes for n8n

```bash
# On your n8n server
cd ~/.n8n/custom
npm install @ark/n8n-nodes-ark

# Or install via n8n UI:
# Settings → Community Nodes → Install
# Package: @ark/n8n-nodes-ark
```

#### Create Workflow with ARK Nodes

```yaml
Nodes:
  1. Webhook Trigger
  2. ARK Agent: code-analyzer
     - Agent: banque-migration/code-analyzer
     - Input: { repositoryPath: $json.body.repositoryPath }

  3. ARK Agent: migration-planner
     - Agent: banque-migration/migration-planner
     - Input: { codeAnalysis: $node["code-analyzer"].json }

  4. HTTP Request: Call Backend Service Generator
     - URL: http://backend:4000/api/repo-migration/generate-services
     - Method: POST
     - Body: { plan: $node["migration-planner"].json }

  5. HTTP Request: Call Backend Frontend Generator
     - URL: http://backend:4000/api/repo-migration/generate-frontends
     - Method: POST

  6. ARK Agent: quality-validator
     - Agent: banque-migration/quality-validator
     - Input: { outputPath: $json.outputPath }

  7. Format Response
```

### Option 3: Hybrid Approach (Best of Both Worlds)

**Use Case**: Backend handles generation, n8n adds custom notifications/integrations

```yaml
Workflow:
  1. Webhook Trigger

  2. Call Backend Migration API
     → Starts full migration process

  3. Poll Status (loop until complete)

  4. When completed:
     - Send Slack notification
     - Create Jira ticket
     - Upload to S3/Cloud Storage
     - Trigger CI/CD pipeline
     - Send email with download link
```

## 📝 Configuration

### Backend Configuration

Update `platform/backend/.env`:

```bash
# n8n webhook for notifications (optional)
N8N_WEBHOOK_URL=https://ark-at-scale.space/n8n/webhook/migration-status
N8N_API_URL=https://ark-at-scale.space/n8n/api/v1

# ARK API (if calling ARK agents directly)
ARK_API_URL=http://ark-api.ark-system.svc.cluster.local:80
ARK_NAMESPACE=banque-migration
```

### n8n Configuration

In your n8n workflow, set these variables:

```javascript
// Backend API URL
backend_url: "http://backend:4000"

// Polling interval (milliseconds)
poll_interval: 5000

// Max wait time (milliseconds)
max_wait: 600000  // 10 minutes
```

## 🎬 How It Works Together

### Current Setup (Backend Orchestration)

```
User → Frontend → Backend API → ARK Agents + Generators → Result
                       ↓
                   WebSocket
                       ↓
                   Frontend
                  (Real-time updates)
```

### With n8n Integration

```
User/System → n8n Webhook → Backend API → ARK Agents + Generators → Result
                                 ↓                                      ↓
                            WebSocket                               n8n Workflow
                                 ↓                                      ↓
                            Frontend                            Custom Actions
                         (Real-time updates)                    (Notify, Deploy, etc.)
```

## 🚀 Quick Start

### 1. Deploy Platform to Cloud

```bash
# Deploy with Docker Compose
./QUICK-DEPLOY.sh
```

### 2. Import n8n Workflow

```bash
# Login to n8n
open https://ark-at-scale.space/n8n

# Import workflow
# File: platform/n8n-workflow-migration.json
```

### 3. Test Integration

```bash
# Get webhook URL from n8n
WEBHOOK_URL="https://ark-at-scale.space/n8n/webhook/migration"

# Trigger migration
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/test/banking-app"
  }'

# Monitor in n8n
# View execution in n8n UI → Executions
```

### 4. Monitor Progress

```bash
# Watch backend logs
docker-compose -f docker-compose.cloud.yml logs -f backend

# Check migration status
curl http://localhost:4000/api/repo-migration/<migration-id>/status

# View in frontend
open http://localhost:3000/dashboard
```

## 🔍 Debugging

### Check ARK Agents

```bash
# If using Kubernetes
kubectl get agents -n banque-migration
kubectl describe agent code-analyzer -n banque-migration

# View agent logs
kubectl logs -n banque-migration -l app=code-analyzer --tail=100
```

### Check n8n Workflow

```bash
# View executions in n8n UI
https://ark-at-scale.space/n8n/executions

# Check webhook is active
curl https://ark-at-scale.space/n8n/webhook/migration

# Test webhook manually
curl -X POST https://ark-at-scale.space/n8n/webhook/migration \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Check Backend Integration

```bash
# Test backend directly
curl -X POST http://localhost:4000/api/repo-migration \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryPath": "/home/hbaqa/Desktop/test-app"
  }'

# Check WebSocket connection
# Open browser console on frontend
# Check for "WebSocket connected" message
```

## 📚 Resources

- **ARK Documentation**: https://mckinsey.github.io/agents-at-scale-ark/
- **n8n Documentation**: https://docs.n8n.io/
- **Your ARK Agents**: `ark/agents/*.yaml`
- **Backend Routes**: `platform/backend/src/routes/repoMigrationRoutes.ts`
- **Migration Service**: `platform/backend/src/services/migrationService.ts`

## 🎯 Next Steps

1. ✅ Import n8n workflow
2. ✅ Configure backend connection
3. ✅ Test migration flow
4. 🔄 Add custom integrations (Slack, email, etc.)
5. 🔄 Set up monitoring and alerts
6. 🔄 Create additional workflows for specific use cases

---

**Integration Status**: Ready for n8n workflow import
**Backend**: Handles ARK agent orchestration + code generation
**n8n**: Triggers migrations + monitors status + custom actions
