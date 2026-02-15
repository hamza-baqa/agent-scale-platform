# 🔧 Fix n8n Workflow - Step by Step

## Issue: Workflow imported but not working

### Step 1: Activate the Workflow

1. In n8n UI, look at top-right corner
2. Find the **"Active"** toggle switch
3. Click to turn it **ON** (should turn green)

---

### Step 2: Configure ARK API Nodes

You need to update these 5 nodes with the correct ARK API URL:

#### Node 1: ARK Agent: Code Analyzer

1. Click on **"ARK Agent: Code Analyzer"** node
2. Find the **"URL"** field
3. Check if it says: `https://ark-at-scale.space/ark-api/v1/agents/execute`
4. If different, update it to match your ARK API URL

**Possible ARK API URLs:**
- `https://ark-at-scale.space/ark-api/v1/agents/execute`
- `http://ark-api.ark-system.svc.cluster.local:80/v1/agents/execute` (internal K8s)
- `http://localhost:8080/v1/agents/execute` (if ARK is on same server)

#### Node 2: ARK Agent: Migration Planner

1. Click on **"ARK Agent: Migration Planner"** node
2. Update **"URL"** field to your ARK API
3. Keep the JSON body as is

#### Node 3: ARK Agent: Service Generator

1. Click on **"ARK Agent: Service Generator"** node
2. Update **"URL"** field to your ARK API

#### Node 4: ARK Agent: Frontend Migrator

1. Click on **"ARK Agent: Frontend Migrator"** node
2. Update **"URL"** field to your ARK API

#### Node 5: ARK Agent: Quality Validator

1. Click on **"ARK Agent: Quality Validator"** node
2. Update **"URL"** field to your ARK API

---

### Step 3: Test ARK API Connectivity

Before running the workflow, test if ARK API is accessible:

```bash
# Test ARK API
curl -X POST https://ark-at-scale.space/ark-api/v1/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "banque-migration",
    "agent": "code-analyzer",
    "input": {"test": true}
  }'
```

**Expected response:**
- Status 200 or 201
- JSON response with agent execution details

**If error:**
- 404 Not Found → ARK API URL is wrong
- 401 Unauthorized → Need authentication
- 500 Server Error → ARK agent doesn't exist

---

### Step 4: Fix Common Errors

#### Error: "Unrecognized node type"

This is OK! It just means n8n doesn't have a custom ARK node type. We're using HTTP Request nodes instead.

**Fix:** Nothing to fix, this is expected.

#### Error: "Workflow must be active"

**Fix:** Toggle "Active" switch ON

#### Error: "ARK API not found"

**Fix:** Update ARK API URL in all ARK Agent nodes

#### Error: "Agent not found in namespace"

**Fix:** Deploy ARK agents:
```bash
kubectl apply -f ark/agents/
```

---

### Step 5: Configure Webhook Trigger

1. Click on **"Webhook Trigger"** node (first node)
2. Look for **"Webhook URLs"** section
3. Copy the **Production URL**
4. Should look like: `https://ark-at-scale.space/n8n/webhook/migration-ark`

---

### Step 6: Test the Workflow

#### Test Method 1: Manual Test in n8n

1. Click the **"Execute Workflow"** button (top)
2. n8n will prompt you to add test data
3. Add this JSON:
```json
{
  "body": {
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }
}
```
4. Click **"Execute Workflow"**
5. Watch nodes turn green as they execute

#### Test Method 2: Webhook Test

1. Make sure workflow is **Active**
2. Open a terminal
3. Run:
```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }'
```

---

### Step 7: Monitor Execution

1. Go to **"Executions"** tab (left sidebar)
2. You'll see the running execution
3. Click on it to see details
4. Watch each node complete

---

## 🔍 Debugging Checklist

- [ ] Workflow is **Active** (toggle ON)
- [ ] All ARK Agent nodes have correct URL
- [ ] ARK API is accessible (test with curl)
- [ ] ARK agents exist (kubectl get agents -n banque-migration)
- [ ] Webhook URL is correct
- [ ] Test data is valid JSON
- [ ] No red error icons on nodes

---

## 🎯 What ARK API URL Should You Use?

**Ask yourself:**

1. **Is ARK running on the same server as n8n?**
   - Yes → Use `http://localhost:8080/v1/agents/execute`
   - No → Continue to question 2

2. **Is ARK in the same Kubernetes cluster?**
   - Yes → Use `http://ark-api.ark-system.svc.cluster.local:80/v1/agents/execute`
   - No → Continue to question 3

3. **Is ARK accessible via public URL?**
   - Yes → Use `https://ark-at-scale.space/ark-api/v1/agents/execute`
   - No → You need to set up ARK access first

**Most likely for ark-at-scale.space:**
```
https://ark-at-scale.space/ark-api/v1/agents/execute
```

---

## 🚨 Quick Fix Commands

### Find ARK API URL

```bash
# If you have kubectl access
kubectl get svc -n ark-system

# Look for ark-api service
# Note the CLUSTER-IP and PORT
```

### Test ARK API

```bash
# Replace URL with your ARK API
curl -X POST YOUR_ARK_API_URL/v1/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "banque-migration",
    "agent": "code-analyzer",
    "input": {}
  }'
```

### Check ARK Agents

```bash
# List all agents in your namespace
kubectl get agents -n banque-migration

# Should show:
# code-analyzer
# migration-planner
# service-generator
# frontend-migrator
# quality-validator
```

### Deploy Missing Agents

```bash
# Deploy all agents
kubectl apply -f ark/agents/

# Or deploy individually
kubectl apply -f ark/agents/code-analyzer.yaml
```

---

## 📝 Node-by-Node Configuration

### 1. Webhook Trigger (Node 1)
```
✅ No changes needed
Path: migration-ark
Method: POST
```

### 2. Set Default Variables (Node 2)
```
✅ Check your repository URL is correct:
repositoryUrl: https://github.com/hamza-baqa/banque-app
```

### 3-7. Notify Nodes
```
✅ Update notification URL if needed:
URL: https://ark-at-scale.space/api/webhook/notify
```

### 8. ARK Agent: Code Analyzer
```
⚠️ MUST UPDATE:
URL: https://ark-at-scale.space/ark-api/v1/agents/execute

Body:
{
  "namespace": "banque-migration",
  "agent": "code-analyzer",
  "input": {
    "repositoryUrl": "={{ $('Set Default Variables').item.json.repositoryUrl }}",
    "repositoryPath": "={{ $('Set Default Variables').item.json.repositoryPath }}"
  },
  "model": "claude-sonnet-4-5"
}
```

### 9. ARK Agent: Migration Planner
```
⚠️ MUST UPDATE:
URL: https://ark-at-scale.space/ark-api/v1/agents/execute
```

### 10. ARK Agent: Service Generator
```
⚠️ MUST UPDATE:
URL: https://ark-at-scale.space/ark-api/v1/agents/execute
```

### 11. ARK Agent: Frontend Migrator
```
⚠️ MUST UPDATE:
URL: https://ark-at-scale.space/ark-api/v1/agents/execute
```

### 12. ARK Agent: Quality Validator
```
⚠️ MUST UPDATE:
URL: https://ark-at-scale.space/ark-api/v1/agents/execute
```

---

## ✅ Final Checklist

Before triggering workflow:

- [ ] All 5 ARK Agent nodes have correct URL
- [ ] ARK API URL tested with curl (returns 200)
- [ ] ARK agents deployed (kubectl shows them)
- [ ] Workflow is Active (toggle ON)
- [ ] Webhook URL copied
- [ ] Repository URL is correct in "Set Default Variables"
- [ ] No red error icons on any nodes

---

## 🎯 Next Steps

1. **Fix ARK API URLs** in all 5 ARK Agent nodes
2. **Activate workflow** (toggle ON)
3. **Save workflow**
4. **Test with webhook:**
   ```bash
   curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
     -H "Content-Type: application/json" \
     -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}'
   ```
5. **Monitor** at https://ark-at-scale.space/n8n/executions

---

**The most common issue is the ARK API URL!** Make sure all 5 ARK Agent nodes point to the correct URL! 🎯
