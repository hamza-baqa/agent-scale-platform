# 🚀 Start Here - Deploy with Your Repository

## Your Repository
**URL:** https://github.com/hamza-baqa/banque-app

## ✨ What's New?

✅ **Repository URL is now a VARIABLE!**
   - Easily change default repo in n8n UI
   - Override via webhook anytime
   - No code changes needed

✅ **Two Workflow Options:**
   1. **With Variables** (Recommended) - `platform/n8n-workflow-with-variables.json`
   2. **Original** - `platform/n8n-workflow-ark-agents.json`

## 🎯 Quick Start (3 Steps)

### Step 1: Deploy All Services

```bash
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"
./deploy-with-n8n.sh
```

**Wait for services to start (2-3 minutes):**
- ✅ Backend: http://localhost:4000
- ✅ Frontend: http://localhost:3000
- ✅ n8n: http://localhost:5678
- ✅ Mock ARK: http://localhost:8080

---

### Step 2: Import Workflow with Variables

1. **Login to n8n:**
   ```
   URL: http://localhost:5678
   Username: admin
   Password: admin123
   ```

2. **Import Workflow:**
   - Click **"Workflows"** → **"+ Add workflow"** → **"Import from File"**
   - Select: **`platform/n8n-workflow-with-variables.json`**
   - Click **"Import"**

3. **Check Default Repository:**
   - Click on **"Set Default Variables"** node (2nd node)
   - You'll see:
     ```javascript
     repositoryUrl: https://github.com/hamza-baqa/banque-app
     ```
   - ✅ Your repo is already set as default!

4. **Activate Workflow:**
   - Toggle **"Active"** switch (top right)
   - Note webhook URL: `http://localhost:5678/webhook/migration-ark`

---

### Step 3: Test Migration

#### Option A: Quick Test (Recommended)

```bash
./test-webhook.sh
```

This will:
- ✅ Verify all services are running
- ✅ Test GitHub repo access
- ✅ Trigger migration with your repo
- ✅ Show monitoring URLs

#### Option B: Manual Test

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Note:** Empty JSON `{}` will use your default repository!

#### Option C: Specify Repository

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }'
```

---

## 📊 Monitor Migration

### Real-time Monitoring

**1. n8n UI** (Best for workflow debugging)
```
http://localhost:5678/executions
```

**2. Backend Logs** (Best for detailed logs)
```bash
docker-compose -f docker-compose.cloud.yml logs -f backend
```

**3. Frontend Dashboard** (Best for user-friendly view)
```
http://localhost:3000/dashboard
```

---

## 🎨 How to Change Default Repository

### Method 1: In n8n UI (Easiest!)

1. Open workflow in n8n
2. Click **"Set Default Variables"** node
3. Change `repositoryUrl` value:
   ```javascript
   // Change this line:
   "value": "https://github.com/NEW-USER/NEW-REPO"
   ```
4. Click **"Save"**

**No restart needed!** Changes take effect immediately.

### Method 2: Via Webhook (Dynamic)

Always provide `repositoryUrl` in webhook:

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/DIFFERENT-REPO"
  }'
```

---

## 🔧 Configuration

### Default Values (in "Set Default Variables" node)

```javascript
{
  "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
  "outputPath": "/workspace/output",
  "repositoryPath": "/workspace/repos/banque-app",
  "notificationUrl": "http://backend:4000/api/webhook/notify"
}
```

### Override Any Value via Webhook

```json
{
  "repositoryUrl": "https://github.com/custom/repo",
  "outputPath": "/custom/output/path",
  "notificationUrl": "https://your-webhook.com/notify"
}
```

---

## ✅ Expected Migration Flow

```
1. Webhook receives request (instant)
   ↓
2. Set default variables (instant)
   ↓
3. Code Analyzer analyzes your repo (2-3 min)
   ↓
4. Migration Planner creates plan (3-5 min)
   ↓
5. Service + Frontend generators run in parallel (5-8 min)
   ↓
6. Quality Validator validates everything (3-5 min)
   ↓
7. Complete! Download results ✅

Total time: 10-15 minutes
```

---

## 📁 Generated Output

After migration completes, you'll get:

```
/workspace/output/
├── services/
│   ├── account-service/          (Spring Boot 3.2)
│   ├── transaction-service/
│   ├── customer-service/
│   ├── payment-service/
│   └── notification-service/
├── frontends/
│   ├── shell-mfe/                (Angular 18)
│   ├── account-mfe/
│   ├── transaction-mfe/
│   ├── customer-mfe/
│   └── payment-mfe/
├── docker-compose.yml
├── README.md
└── validation-report.json
```

---

## 🎯 Common Use Cases

### Use Case 1: Default Repository (Your Repo)

```bash
# Trigger with empty JSON - uses default
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Use Case 2: Different Branch

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
    "branch": "develop"
  }'
```

### Use Case 3: Custom Output Path

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
    "outputPath": "/workspace/migrations/v2.0"
  }'
```

### Use Case 4: Different Repository

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/other-user/other-repo"
  }'
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| **START-HERE.md** | This file - Quick start guide |
| **QUICK-START-WEBHOOK.md** | Detailed webhook configuration |
| **WEBHOOK-VARIABLES-SETUP.md** | How to use variables |
| **DEPLOY-N8N-WORKFLOW.md** | Complete deployment guide |
| **N8N-WORKFLOW-VISUAL.md** | Visual workflow diagram |
| **WEBHOOK-CONFIGURATION-GUIDE.md** | Webhook input reference |
| **test-webhook.sh** | Automated test script |
| **deploy-with-n8n.sh** | Automated deployment |

---

## 🔍 Troubleshooting

### Issue 1: Services Not Starting

```bash
# Check service status
docker-compose -f docker-compose.cloud.yml ps

# Restart all services
docker-compose -f docker-compose.cloud.yml restart

# View logs
docker-compose -f docker-compose.cloud.yml logs -f [service-name]
```

### Issue 2: Webhook Not Responding

```bash
# Check n8n is running
curl http://localhost:5678/healthz

# Check workflow is active
# Go to n8n UI and verify "Active" toggle is ON

# Test webhook
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Issue 3: Repository Clone Failed

```bash
# Test repo access
git ls-remote https://github.com/hamza-baqa/banque-app

# For private repos, add token:
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
    "githubToken": "ghp_YOUR_TOKEN_HERE"
  }'
```

---

## ✨ Quick Commands

### Deploy Everything
```bash
./deploy-with-n8n.sh
```

### Test Migration
```bash
./test-webhook.sh
```

### View Logs
```bash
docker-compose -f docker-compose.cloud.yml logs -f backend
```

### Stop All Services
```bash
docker-compose -f docker-compose.cloud.yml down
```

### Restart Services
```bash
docker-compose -f docker-compose.cloud.yml restart
```

---

## 🎉 Ready!

Your platform is configured to migrate:
**https://github.com/hamza-baqa/banque-app**

**Start migration now:**
```bash
./deploy-with-n8n.sh  # Deploy services
./test-webhook.sh     # Test migration
```

**Monitor at:**
- n8n: http://localhost:5678/executions
- Dashboard: http://localhost:3000/dashboard

**Questions?** Check the documentation files above! 🚀
