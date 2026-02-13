# Quick Start: Configure Webhook for Your Repository

## 🎯 Your Repository
**URL:** https://github.com/hamza-baqa/banque-app

## 🚀 3-Step Quick Start

### Step 1: Deploy Services (2 minutes)

```bash
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"
./deploy-with-n8n.sh
```

Wait for all services to start. You'll see:
- ✅ Backend running on http://localhost:4000
- ✅ Frontend running on http://localhost:3000
- ✅ n8n running on http://localhost:5678

---

### Step 2: Import & Configure Workflow (5 minutes)

#### 2.1 Login to n8n
```bash
# Open n8n
open http://localhost:5678

# Credentials
Username: admin
Password: admin123
```

#### 2.2 Import Workflow
1. Click **"Workflows"** in left sidebar
2. Click **"+ Add workflow"** button
3. Click **"Import from File"**
4. Select file: **`platform/n8n-workflow-ark-agents.json`**
5. Click **"Import"**

#### 2.3 Configure Node URLs

The workflow has several nodes that need URL configuration:

**Node 1: Webhook Trigger**
- ✅ Already configured!
- Path: `migration-ark`
- Method: `POST`
- No changes needed

**Node 2: Notify Nodes (9 nodes)**
- URL: `http://backend:4000/api/webhook/notify`
- Already configured, but verify URL is correct

**Node 3: ARK Agent: Code Analyzer**
- Click on the node
- Find the "URL" field
- Set to: `http://mock-ark:8080/v1/agents/execute`
- Update the JSON body:
```json
{
  "namespace": "banque-migration",
  "agent": "code-analyzer",
  "input": {
    "repositoryUrl": "={{ $('Webhook Trigger').item.json.body.repositoryUrl }}",
    "repositoryPath": "={{ $('Webhook Trigger').item.json.body.repositoryPath || '/workspace/repos/banque-app' }}"
  },
  "model": "claude-sonnet-4-5"
}
```

**Node 4: ARK Agent: Migration Planner**
- URL: `http://mock-ark:8080/v1/agents/execute`
- JSON body:
```json
{
  "namespace": "banque-migration",
  "agent": "migration-planner",
  "input": {
    "codeAnalysis": "={{ $('ARK Agent: Code Analyzer').item.json.result }}",
    "targetArchitecture": "microservices",
    "targetFramework": "spring-boot",
    "targetFrontend": "angular"
  },
  "model": "claude-opus-4-6"
}
```

**Node 5: ARK Agent: Service Generator**
- URL: `http://backend:4000/api/repo-migration/generate-services`
- JSON body:
```json
{
  "migrationPlan": "={{ $('ARK Agent: Migration Planner').item.json.result }}",
  "outputPath": "={{ $('Webhook Trigger').item.json.body.outputPath || '/workspace/output' }}"
}
```

**Node 6: ARK Agent: Frontend Migrator**
- URL: `http://backend:4000/api/repo-migration/generate-frontends`
- JSON body:
```json
{
  "migrationPlan": "={{ $('ARK Agent: Migration Planner').item.json.result }}",
  "outputPath": "={{ $('Webhook Trigger').item.json.body.outputPath || '/workspace/output' }}"
}
```

**Node 7: ARK Agent: Quality Validator**
- URL: `http://backend:4000/api/repo-migration/validate`
- JSON body:
```json
{
  "outputPath": "={{ $('Webhook Trigger').item.json.body.outputPath || '/workspace/output' }}",
  "sourcePath": "={{ $('Webhook Trigger').item.json.body.repositoryPath }}",
  "migrationPlan": "={{ $('ARK Agent: Migration Planner').item.json.result }}"
}
```

#### 2.4 Save & Activate
1. Click **"Save"** button (top right)
2. Toggle workflow to **"Active"** (top right switch)
3. Note the webhook URL shown in the Webhook Trigger node

---

### Step 3: Test Migration (1 minute)

#### Option A: Using the Test Script (Recommended)

```bash
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"
./test-webhook.sh
```

This will:
- ✅ Check all services are running
- ✅ Verify GitHub repository is accessible
- ✅ Trigger the migration workflow
- ✅ Show monitoring URLs

#### Option B: Using curl

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
    "outputPath": "/workspace/output"
  }'
```

#### Option C: Using Browser/Postman

**URL:** `http://localhost:5678/webhook/migration-ark`
**Method:** `POST`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
  "outputPath": "/workspace/output"
}
```

---

## 📊 Monitor Execution

### Real-time Monitoring Options

**1. n8n Execution View** (Best for workflow debugging)
```
URL: http://localhost:5678/executions
Login: admin / admin123

You'll see:
- Live execution progress
- Each node's input/output data
- Error details if any step fails
- Total execution time
```

**2. Backend Logs** (Best for code generation details)
```bash
docker-compose -f docker-compose.cloud.yml logs -f backend

You'll see:
- Repository cloning progress
- Code analysis results
- Service generation logs
- Validation reports
```

**3. Frontend Dashboard** (Best for user-friendly view)
```
URL: http://localhost:3000/dashboard

You'll see:
- Visual workflow progress
- Current step indicator
- Real-time status updates via WebSocket
- Validation results
```

---

## 🎨 Webhook Input Examples

### Example 1: Basic Migration

```json
{
  "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
}
```

Uses defaults:
- Output path: `/workspace/output`
- Clone to: `/workspace/repos/banque-app`

### Example 2: Custom Output Path

```json
{
  "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
  "outputPath": "/workspace/migrations/banque-v2"
}
```

### Example 3: With Options

```json
{
  "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
  "outputPath": "/workspace/output",
  "options": {
    "targetFramework": "spring-boot",
    "targetFrontend": "angular",
    "targetArchitecture": "microservices",
    "javaVersion": "17",
    "springBootVersion": "3.2.0",
    "angularVersion": "18"
  }
}
```

### Example 4: Pre-cloned Repository

If you've already cloned the repo locally:

```json
{
  "repositoryPath": "/workspace/repos/banque-app",
  "outputPath": "/workspace/output"
}
```

---

## ✅ Expected Workflow Timeline

| Step | Duration | Status Indicator |
|------|----------|------------------|
| 1. Webhook Trigger | Instant | 🟢 Received request |
| 2. Code Analyzer | 2-3 min | 🟡 Analyzing Spring Boot + Blazor code |
| 3. Migration Planner | 3-5 min | 🟡 Creating microservices plan |
| 4. Service Generator | 5-8 min | 🟡 Generating 5-7 Spring Boot services |
| 5. Frontend Migrator | 5-8 min | 🟡 Generating Angular MFEs |
| 6. Quality Validator | 3-5 min | 🟡 Validating builds, tests, security |
| **Total** | **10-15 min** | 🟢 **Complete!** |

Note: Steps 4 & 5 run in parallel.

---

## 🔍 Verify Configuration

### Quick Checklist

Before running the first migration, verify:

- [ ] All services running: `docker-compose -f docker-compose.cloud.yml ps`
- [ ] n8n accessible: `curl http://localhost:5678/healthz`
- [ ] Backend accessible: `curl http://localhost:4000/health`
- [ ] Workflow imported and active in n8n
- [ ] All node URLs point to correct services
- [ ] Webhook URL is: `http://localhost:5678/webhook/migration-ark`

### Test Service Connectivity

```bash
# Test Mock ARK
curl http://localhost:8080/v1/agents/execute \
  -H "Content-Type: application/json" \
  -d '{"namespace":"banque-migration","agent":"code-analyzer","input":{}}'

# Test Backend
curl http://localhost:4000/health

# Test n8n
curl http://localhost:5678/healthz
```

---

## 🎯 What Happens During Migration

```
┌─────────────────────────────────────────────────────────────┐
│  Your Repository: https://github.com/hamza-baqa/banque-app │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    [Webhook Triggered]
                              ↓
        ┌─────────────────────────────────────┐
        │  Backend clones repository          │
        │  to: /workspace/repos/banque-app    │
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │  ARK Agent analyzes code:           │
        │  • Spring Boot entities             │
        │  • REST controllers                 │
        │  • Service layer                    │
        │  • Blazor components                │
        │  • Configuration files              │
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │  ARK Agent creates migration plan:  │
        │  • Account microservice             │
        │  • Transaction microservice         │
        │  • Customer microservice            │
        │  • Payment microservice             │
        │  • Notification microservice        │
        │  • Account MFE                      │
        │  • Transaction MFE                  │
        │  • Customer MFE                     │
        │  • Payment MFE                      │
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │  Generators create code:            │
        │  • Spring Boot 3.2 services         │
        │  • Angular 18 micro-frontends       │
        │  • Docker files                     │
        │  • Tests                            │
        │  • OpenAPI specs                    │
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │  Validator checks:                  │
        │  ✓ Maven builds pass                │
        │  ✓ npm builds pass                  │
        │  ✓ Tests pass                       │
        │  ✓ No security vulnerabilities      │
        │  ✓ Entities match source (70%+)     │
        │  ✓ Endpoints match source (70%+)    │
        │  ✓ Business logic preserved         │
        └─────────────────────────────────────┘
                              ↓
        ┌─────────────────────────────────────┐
        │  Output ready at:                   │
        │  /workspace/output/                 │
        │                                     │
        │  Download:                          │
        │  http://localhost:4000/api/         │
        │  repo-migration/{id}/download       │
        └─────────────────────────────────────┘
```

---

## 🚀 Ready to Start!

**Quick Start Command:**
```bash
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"
./test-webhook.sh
```

**Or manually:**
```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}'
```

**Then monitor at:**
- n8n: http://localhost:5678/executions
- Dashboard: http://localhost:3000/dashboard
- Logs: `docker-compose -f docker-compose.cloud.yml logs -f backend`

---

**Your repository is ready for migration!** 🎉
