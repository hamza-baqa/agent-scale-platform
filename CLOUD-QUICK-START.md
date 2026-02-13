# ☁️ Cloud Quick Start - ark-at-scale.space

## 🎯 Goal
Import your workflow to **https://ark-at-scale.space/n8n** where ARK is already running.

## Your Repository
**https://github.com/hamza-baqa/banque-app** (already set as default!)

---

## 🚀 2-Step Deployment

### Step 1: Import Workflow to Cloud n8n

1. **Login to Cloud n8n:**
   ```
   URL: https://ark-at-scale.space/n8n
   ```

2. **Import Workflow:**
   - Click **"Workflows"** → **"+ Add workflow"**
   - Click **"Import from File"**
   - Select file: **`platform/n8n-workflow-cloud.json`**
   - Click **"Import"**

3. **Activate:**
   - Toggle **"Active"** switch (top right)

**✅ Done!** Workflow is live on cloud!

---

### Step 2: Test Migration

```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }'
```

**Or use default (empty JSON):**

```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📊 Monitor Execution

**n8n Executions View:**
```
https://ark-at-scale.space/n8n/executions
```

You'll see real-time progress through all steps:
1. ✅ Webhook Trigger
2. ✅ Set Default Variables (your repo is here!)
3. 🟡 ARK Agent: Code Analyzer (analyzing...)
4. 🟡 ARK Agent: Migration Planner (planning...)
5. 🟡 ARK Agent: Service Generator (generating...)
6. 🟡 ARK Agent: Frontend Migrator (generating...)
7. 🟡 ARK Agent: Quality Validator (validating...)
8. ✅ Complete!

**Timeline:** 10-15 minutes

---

## ☁️ Cloud URLs (Pre-configured)

All URLs in the workflow are already set for cloud:

| Component | URL |
|-----------|-----|
| **ARK API** | `https://ark-at-scale.space/ark-api/v1/agents/execute` |
| **Webhook** | `https://ark-at-scale.space/n8n/webhook/migration-ark` |
| **Notifications** | `https://ark-at-scale.space/api/webhook/notify` |

**No configuration needed!** Just import and activate.

---

## 🎨 Change Default Repository

### In n8n UI:

1. Open workflow
2. Click **"Set Default Variables"** node (2nd node)
3. Change this line:
   ```javascript
   "value": "https://github.com/hamza-baqa/banque-app"
   ```
4. Save

---

## 🔧 ARK Agents Used

Your workflow uses these cloud ARK agents:

| Agent | Namespace | Model | Purpose |
|-------|-----------|-------|---------|
| **code-analyzer** | banque-migration | claude-sonnet-4-5 | Analyze repository |
| **migration-planner** | banque-migration | claude-opus-4-6 | Create migration plan |
| **service-generator** | banque-migration | claude-sonnet-4-5 | Generate Spring Boot services |
| **frontend-migrator** | banque-migration | claude-sonnet-4-5 | Generate Angular MFEs |
| **quality-validator** | banque-migration | claude-sonnet-4-5 | Validate migration |

**These must exist in your ARK deployment!**

---

## ✅ Verify ARK Agents

If you have kubectl access:

```bash
kubectl get agents -n banque-migration
```

Should show:
```
code-analyzer
migration-planner
service-generator
frontend-migrator
quality-validator
```

If agents don't exist, deploy them:

```bash
kubectl apply -f ark/agents/
```

---

## 📝 Workflow File

**File to import:** `platform/n8n-workflow-cloud.json`

**What's included:**
- ✅ 21 nodes (complete workflow)
- ✅ All cloud URLs configured
- ✅ Your repository as default
- ✅ Parallel execution (service + frontend)
- ✅ Error handling
- ✅ Real-time notifications

---

## 🧪 Test Examples

### Example 1: Default Repository

```bash
# Uses https://github.com/hamza-baqa/banque-app
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Example 2: Different Repository

```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/other-user/other-repo"
  }'
```

### Example 3: With Options

```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
    "outputPath": "/workspace/banque-v2",
    "notificationUrl": "https://your-webhook.com/notify"
  }'
```

---

## 🔍 Troubleshooting

### Issue: "Agent not found"

**Error:**
```
Agent 'code-analyzer' not found in namespace 'banque-migration'
```

**Fix:**
```bash
# Deploy ARK agents
kubectl apply -f ark/agents/code-analyzer.yaml
kubectl apply -f ark/agents/migration-planner.yaml
kubectl apply -f ark/agents/service-generator.yaml
kubectl apply -f ark/agents/frontend-migrator.yaml
kubectl apply -f ark/agents/quality-validator.yaml
```

### Issue: "Webhook not found"

**Error:**
```
404 Not Found
```

**Fix:**
1. Check workflow is **Active** (toggle must be ON)
2. Copy webhook URL from n8n UI
3. Verify path: `/webhook/migration-ark`

### Issue: "Timeout"

**Error:**
```
Timeout exceeded
```

**Fix:**
- Normal for large repos
- Check ARK agents are running
- View logs in n8n execution view

---

## 📈 Expected Output

After 10-15 minutes, you'll get:

```
✅ Spring Boot Microservices (5-7)
   - account-service
   - transaction-service
   - customer-service
   - payment-service
   - notification-service

✅ Angular Micro-Frontends (4-5)
   - shell-mfe
   - account-mfe
   - transaction-mfe
   - customer-mfe
   - payment-mfe

✅ DevOps Setup
   - Dockerfiles
   - docker-compose.yml
   - Kubernetes manifests

✅ Validation Report
   - Build status
   - Test results
   - Security scan
   - Functional equivalence
```

---

## ⚡ Quick Commands

**Import workflow:**
```
1. Go to: https://ark-at-scale.space/n8n
2. Import: platform/n8n-workflow-cloud.json
3. Activate workflow
```

**Trigger migration:**
```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}'
```

**Monitor:**
```
https://ark-at-scale.space/n8n/executions
```

---

## ✅ Checklist

- [ ] Login to https://ark-at-scale.space/n8n
- [ ] Import `platform/n8n-workflow-cloud.json`
- [ ] Verify default repo URL in "Set Default Variables"
- [ ] Activate workflow (toggle ON)
- [ ] Copy webhook URL
- [ ] Test with curl command
- [ ] Monitor in n8n executions view
- [ ] Wait 10-15 minutes for completion
- [ ] Download results

---

## 🎉 You're Ready!

**Import this file:** `platform/n8n-workflow-cloud.json`

**Webhook URL:** `https://ark-at-scale.space/n8n/webhook/migration-ark`

**Your repo:** `https://github.com/hamza-baqa/banque-app`

**Everything is pre-configured for cloud ARK environment!** 🚀
