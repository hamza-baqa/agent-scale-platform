# Webhook Trigger Configuration Guide

## 🎯 Input Configuration

### Webhook Endpoint

After importing and activating the workflow in n8n, you'll get:

```
Production URL: http://localhost:5678/webhook/migration-ark
Test URL:       http://localhost:5678/webhook-test/migration-ark
```

### Input JSON Format

```json
{
  "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
  "outputPath": "/workspace/output",
  "notificationUrl": "http://backend:4000/api/webhook/notify",
  "cloneDirectory": "/workspace/repos"
}
```

### Field Descriptions

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `repositoryUrl` | ✅ Yes | GitHub repository URL | `https://github.com/hamza-baqa/banque-app` |
| `outputPath` | ❌ No | Where to save generated code | `/workspace/output` (default) |
| `notificationUrl` | ❌ No | Webhook for status updates | `http://backend:4000/api/webhook/notify` |
| `cloneDirectory` | ❌ No | Where to clone the repo | `/workspace/repos` (default) |

## 🔧 Configuration Steps in n8n

### 1. Open Webhook Trigger Node

1. Login to n8n: http://localhost:5678
2. Open your imported workflow
3. Click on the **"Webhook Trigger"** node

### 2. Configure Webhook Settings

```javascript
Path: migration-ark
HTTP Method: POST
Response Mode: lastNode
Authentication: None (or add Basic Auth if needed)
```

### 3. Webhook URL Structure

```
Format: http://[n8n-host]:[port]/webhook/[path]
Example: http://localhost:5678/webhook/migration-ark
Cloud: https://ark-at-scale.space/n8n/webhook/migration-ark
```

## 📝 Test the Webhook

### Test 1: Basic Test (Without Cloning)

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
    "outputPath": "/workspace/output"
  }'
```

### Test 2: With Local Clone First

If you want to clone the repo first:

```bash
# Clone the repo locally
git clone https://github.com/hamza-baqa/banque-app /tmp/banque-app

# Then trigger workflow with local path
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryPath": "/tmp/banque-app",
    "outputPath": "/workspace/output"
  }'
```

### Test 3: Full Example with All Options

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
    "repositoryPath": "/workspace/repos/banque-app",
    "outputPath": "/workspace/output/banque-migration",
    "notificationUrl": "http://backend:4000/api/webhook/notify",
    "options": {
      "targetFramework": "spring-boot",
      "targetFrontend": "angular",
      "targetArchitecture": "microservices"
    }
  }'
```

## 🔄 Workflow Processing

### What Happens After Trigger?

```
1. Webhook Trigger receives request
   ↓
2. Extract repositoryUrl: "https://github.com/hamza-baqa/banque-app"
   ↓
3. Call Backend API to clone repo
   POST http://backend:4000/api/repo-migration/clone
   ↓
4. Backend clones to: /workspace/repos/banque-app
   ↓
5. Set repositoryPath: /workspace/repos/banque-app
   ↓
6. Continue with Code Analyzer step
   (now uses local repositoryPath)
```

## 🛠️ Backend API Integration

Your backend already handles GitHub cloning! Check this endpoint:

```typescript
// POST /api/repo-migration
{
  repositoryUrl: "https://github.com/hamza-baqa/banque-app",
  outputPath: "/workspace/output"
}

// Backend will:
// 1. Clone the repo
// 2. Analyze the code
// 3. Generate migration plan
// 4. Create microservices
// 5. Validate everything
```

## 📊 Accessing Webhook Data in Workflow Nodes

### In Any Node After Webhook Trigger

Access the input data using:

```javascript
// Repository URL
$('Webhook Trigger').item.json.body.repositoryUrl

// Output Path
$('Webhook Trigger').item.json.body.outputPath || '/workspace/output'

// Notification URL
$('Webhook Trigger').item.json.body.notificationUrl || 'http://backend:4000/api/webhook/notify'
```

### Example in ARK Agent: Code Analyzer Node

```javascript
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

## 🎨 Frontend Integration

### Update Your Frontend to Use Webhook

```typescript
// platform/frontend/src/app/page.tsx

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();

  try {
    // Call n8n webhook instead of backend directly
    const response = await fetch('http://localhost:5678/webhook/migration-ark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        repositoryUrl: 'https://github.com/hamza-baqa/banque-app',
        outputPath: '/workspace/output',
        notificationUrl: 'http://localhost:4000/api/webhook/notify'
      })
    });

    const result = await response.json();
    console.log('Migration started:', result);

    // Navigate to dashboard to watch progress
    router.push(`/dashboard?migrationId=${result.migrationId}`);

  } catch (error) {
    console.error('Failed to start migration:', error);
  }
}
```

## 🔐 Adding Authentication (Optional)

### Option 1: Basic Auth in n8n

1. Open Webhook Trigger node
2. Enable Authentication
3. Select "Basic Auth"
4. Set username/password

Then call with auth:

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -u "admin:admin123" \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }'
```

### Option 2: API Key in Header

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }'
```

Then in n8n, add an IF node after webhook to check:

```javascript
{{ $json.headers['x-api-key'] === 'your-secret-key' }}
```

## 🧪 Testing in n8n UI

### Manual Test Mode

1. Open workflow in n8n
2. Click **"Execute Workflow"** button
3. In Webhook Trigger node, click **"Listen for Test Event"**
4. Send curl request
5. Watch execution in real-time

### Example Test Payload

Click **"Add Test Data"** in Webhook Trigger and paste:

```json
{
  "headers": {
    "content-type": "application/json"
  },
  "body": {
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
    "outputPath": "/workspace/output",
    "notificationUrl": "http://backend:4000/api/webhook/notify"
  }
}
```

## 📋 Quick Reference

### Trigger Migration for Your Repo

```bash
# Set variables
WEBHOOK_URL="http://localhost:5678/webhook/migration-ark"
REPO_URL="https://github.com/hamza-baqa/banque-app"

# Trigger migration
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"repositoryUrl\": \"$REPO_URL\",
    \"outputPath\": \"/workspace/output\"
  }"
```

### Check Execution Status

```bash
# View in n8n UI
open http://localhost:5678/executions

# View backend logs
docker-compose -f docker-compose.cloud.yml logs -f backend

# View frontend dashboard
open http://localhost:3000/dashboard
```

## 🔍 Debugging

### Webhook Not Receiving Data?

1. **Check n8n logs:**
   ```bash
   docker-compose -f docker-compose.cloud.yml logs -f n8n
   ```

2. **Test webhook directly in browser:**
   ```
   http://localhost:5678/webhook-test/migration-ark
   ```

3. **Verify workflow is active:**
   - Go to n8n UI
   - Check workflow has "Active" toggle ON

### Repository Clone Failing?

1. **Check if repo is public:**
   ```bash
   git clone https://github.com/hamza-baqa/banque-app
   ```

2. **For private repos, add GitHub token:**
   ```json
   {
     "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
     "githubToken": "ghp_your_token_here"
   }
   ```

3. **Check backend has git installed:**
   ```bash
   docker exec agent-scale-backend which git
   ```

## ✅ Validation

After triggering the webhook, verify:

- [ ] n8n execution shows "Running" status
- [ ] Backend logs show "Migration started"
- [ ] Repository cloned to `/workspace/repos/`
- [ ] Code Analyzer step begins
- [ ] Dashboard shows real-time progress

## 🎯 Next Steps

1. **Deploy services:** `./deploy-with-n8n.sh`
2. **Import workflow:** Import `platform/n8n-workflow-ark-agents.json`
3. **Test webhook:** Use curl command with your repo URL
4. **Monitor execution:** Watch in n8n UI and dashboard
5. **Download results:** When complete, download generated code

---

**Your Repository:** https://github.com/hamza-baqa/banque-app
**Webhook URL:** http://localhost:5678/webhook/migration-ark
**Status:** Ready for migration! 🚀
