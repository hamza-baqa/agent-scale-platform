# 🚀 Complete Import Guide - Execute Immediately

## Goal
Import the workflow to **https://ark-at-scale.space/n8n/workflow** and execute it immediately with **zero configuration**.

---

## 📋 Prerequisites

Before starting, make sure you have:

1. ✅ Access to https://ark-at-scale.space/n8n (login credentials)
2. ✅ ARK agents deployed in `banque-migration` namespace
3. ✅ Internet connection
4. ✅ The workflow file: `platform/n8n-workflow-cloud.json`

---

## 🎯 Step-by-Step Import & Execute

### Step 1: Login to Cloud n8n (1 minute)

1. Open your browser
2. Go to: **https://ark-at-scale.space/n8n**
3. Enter your credentials
4. Click **"Login"**

**✅ You should see the n8n dashboard**

---

### Step 2: Import the Workflow (2 minutes)

1. In the left sidebar, click **"Workflows"**

2. Click the **"+ Add workflow"** button (top right)

3. You'll see a blank workflow canvas

4. Click the **"⋮"** menu button (three dots, top right corner)

5. Select **"Import from File"**

6. A file picker will open

7. Navigate to:
   ```
   /home/hbaqa/Desktop/Banque app 2/banque-app-transformed/platform/n8n-workflow-cloud.json
   ```

8. Select the file and click **"Open"**

9. n8n will import the workflow - you'll see all 21 nodes appear!

**✅ You should see the complete workflow with all nodes**

---

### Step 3: Verify Workflow Configuration (2 minutes)

Let's quickly verify the key settings:

#### 3.1 Check "Set Default Variables" Node

1. Click on the **"Set Default Variables"** node (2nd node)

2. You should see these values:
   ```javascript
   repositoryUrl: https://github.com/hamza-baqa/banque-app
   outputPath: /workspace/output
   repositoryPath: /workspace/repos/banque-app
   notificationUrl: https://ark-at-scale.space/api/webhook/notify
   ```

3. **Your repository is already set!** ✅

#### 3.2 Check ARK Agent URLs (Quick Check)

Click on these nodes and verify the URL field:

**Node: "ARK Agent: Code Analyzer"**
- URL should be: `https://ark-at-scale.space/ark-api/v1/agents/execute`

**If the URL is different**, update it to match your ARK API endpoint.

**Repeat for these nodes:**
- ARK Agent: Migration Planner
- ARK Agent: Service Generator
- ARK Agent: Frontend Migrator
- ARK Agent: Quality Validator

**✅ All ARK nodes should have the correct cloud URL**

---

### Step 4: Save & Activate the Workflow (1 minute)

1. Click the **"Save"** button (top right)

2. Enter a workflow name: **"Banque App Migration"**

3. Click **"Save"**

4. Toggle the **"Active"** switch to **ON** (top right)
   - The switch should turn blue/green
   - Status should show "Active"

**✅ Workflow is now active and ready to receive webhooks!**

---

### Step 5: Get the Webhook URL (1 minute)

1. Click on the **"Webhook Trigger"** node (first node)

2. Look for the **"Webhook URLs"** section

3. You'll see two URLs:
   - **Test URL**: `https://ark-at-scale.space/n8n/webhook-test/migration-ark`
   - **Production URL**: `https://ark-at-scale.space/n8n/webhook/migration-ark`

4. Copy the **Production URL**

**✅ Your webhook URL is ready!**

---

### Step 6: Test Execution (30 seconds)

Now let's trigger the migration!

#### Option A: Test from Terminal

Open terminal and run:

```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }'
```

#### Option B: Test in Browser (Postman/Insomnia)

- **URL**: `https://ark-at-scale.space/n8n/webhook/migration-ark`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
  "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
}
```

#### Option C: Test with Empty JSON (Uses Default Repo)

```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{}'
```

**✅ You should get a response immediately!**

---

### Step 7: Monitor Execution (10-15 minutes)

1. In n8n, click **"Executions"** in the left sidebar

2. You'll see your running execution at the top

3. Click on it to see real-time progress

4. Watch the nodes turn green as they complete:

```
🟢 Webhook Trigger (instant)
🟢 Set Default Variables (instant)
🟡 ARK Agent: Code Analyzer (2-3 min) ← analyzing your repo
⚪ ARK Agent: Migration Planner (3-5 min)
⚪ ARK Agent: Service Generator (5-8 min)
⚪ ARK Agent: Frontend Migrator (5-8 min)
⚪ ARK Agent: Quality Validator (3-5 min)
⚪ Webhook Response
```

**Timeline:**
- Code Analyzer: 2-3 minutes
- Migration Planner: 3-5 minutes
- Service + Frontend (parallel): 5-8 minutes
- Quality Validator: 3-5 minutes
- **Total: 10-15 minutes**

**✅ Your migration is running!**

---

## 🎨 Execution Timeline Visual

```
START: Webhook triggered
  ↓ (instant)
Set Variables: Repository = https://github.com/hamza-baqa/banque-app
  ↓ (2-3 min)
Code Analyzer: Analyzing Spring Boot + Blazor code...
  ↓ (3-5 min)
Migration Planner: Creating microservices architecture...
  ↓ (splits into 2 parallel branches)
  ├─ Service Generator (5-8 min)     ┐
  │  Generating Spring Boot services  │ Run in parallel
  │                                    │
  └─ Frontend Migrator (5-8 min)     │
     Generating Angular MFEs          ┘
  ↓ (3-5 min)
Quality Validator: Validating builds, tests, security...
  ↓ (instant)
COMPLETE: Migration finished!
```

---

## 📊 What to Watch For

### Green Nodes = Success ✅
Each node turns green when complete. Click on it to see:
- **Input data**: What the node received
- **Output data**: What the node produced
- **Execution time**: How long it took

### Yellow Node = Running 🟡
The currently executing node is highlighted. This is normal!

### Red Node = Error ❌
If a node turns red:
1. Click on it
2. Read the error message
3. Common errors:
   - **ARK API not found**: Wrong URL
   - **Agent not found**: ARK agents not deployed
   - **Timeout**: Repository too large (normal, will retry)

---

## 🔍 Troubleshooting

### Issue 1: Webhook Returns "Workflow not found"

**Error**: `404 Not Found`

**Fix**:
1. Make sure workflow is **Active** (toggle ON)
2. Copy webhook URL from "Webhook Trigger" node
3. Verify path ends with `/webhook/migration-ark`

---

### Issue 2: "Agent not found in namespace"

**Error**: `Agent 'code-analyzer' not found in namespace 'banque-migration'`

**Fix**: Deploy ARK agents

```bash
# Check if agents exist
kubectl get agents -n banque-migration

# If not found, deploy them
kubectl apply -f /home/hbaqa/Desktop/Banque\ app\ 2/banque-app-transformed/ark/agents/
```

---

### Issue 3: ARK API Connection Failed

**Error**: `ECONNREFUSED` or `404`

**Fix**: Update ARK API URL

The workflow assumes ARK is at: `https://ark-at-scale.space/ark-api`

If different, update all 5 ARK Agent nodes:
1. Click on node
2. Change URL field
3. Save workflow

**Find your ARK API URL:**
```bash
cd /home/hbaqa/Desktop/Banque\ app\ 2/banque-app-transformed
./check-ark-url.sh
```

---

### Issue 4: Nothing Happens

**Check**:
1. ✅ Workflow is Active (toggle ON)
2. ✅ Webhook URL is correct
3. ✅ ARK agents are deployed
4. ✅ ARK API URL is correct in nodes
5. ✅ Internet connection works

---

## 📈 Expected Results

After 10-15 minutes, the execution will complete and show:

### ✅ Success Response

```json
{
  "success": true,
  "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
  "status": "completed",
  "validationReport": {
    "overall": "pass",
    "builds": "pass",
    "tests": "pass",
    "security": "pass",
    "functionalMatch": 85
  },
  "outputPath": "/workspace/output",
  "downloadUrl": "https://ark-at-scale.space/api/download",
  "timestamp": "2026-02-10T12:45:00Z"
}
```

### 📦 Generated Output

Your migrated code will include:

**Spring Boot Microservices (5-7 services):**
- account-service
- transaction-service
- customer-service
- payment-service
- notification-service
- api-gateway

**Angular Micro-Frontends (4-5 MFEs):**
- shell-mfe (routing host)
- account-mfe
- transaction-mfe
- customer-mfe
- payment-mfe

**DevOps Files:**
- Dockerfiles for each service
- docker-compose.yml
- Kubernetes manifests
- CI/CD pipeline templates

**Validation Report:**
- Build status
- Test results
- Security scan
- Functional equivalence score

---

## 🎯 Quick Command Reference

### Trigger Migration
```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}'
```

### Check ARK Agents
```bash
kubectl get agents -n banque-migration
```

### Deploy ARK Agents
```bash
kubectl apply -f ~/Desktop/Banque\ app\ 2/banque-app-transformed/ark/agents/
```

### View Executions
```
https://ark-at-scale.space/n8n/executions
```

---

## ✅ Final Checklist

Before executing:

- [ ] Logged into https://ark-at-scale.space/n8n
- [ ] Imported `platform/n8n-workflow-cloud.json`
- [ ] Verified repository URL in "Set Default Variables"
- [ ] Checked ARK API URLs in 5 ARK Agent nodes
- [ ] Saved workflow
- [ ] Activated workflow (toggle ON)
- [ ] Copied webhook URL
- [ ] ARK agents deployed (kubectl check)

After executing:

- [ ] Webhook returns success response
- [ ] Execution appears in "Executions" tab
- [ ] Nodes turn green one by one
- [ ] No red error nodes
- [ ] After 10-15 minutes, execution completes
- [ ] Response shows "status": "completed"

---

## 🎉 You're Ready!

**Your workflow is ready to execute immediately after import!**

Just follow these steps:
1. Import → 2. Activate → 3. Trigger → 4. Monitor

**Webhook URL**: `https://ark-at-scale.space/n8n/webhook/migration-ark`

**Your Repository**: `https://github.com/hamza-baqa/banque-app`

**Execution Time**: 10-15 minutes

**Everything is pre-configured!** 🚀
