# Configure Repository URL as Variable in n8n

## 🎯 Make Repository URL Dynamic

Instead of hardcoding the repository URL, you can set it as a variable that can be changed easily.

## Method 1: Workflow Variables (Recommended)

### Step 1: Add Workflow Variables in n8n

1. Open your workflow in n8n
2. Click **"Settings"** (gear icon in top right)
3. Go to **"Variables"** section
4. Add these variables:

```javascript
// Workflow Variables
REPOSITORY_URL: https://github.com/hamza-baqa/banque-app
OUTPUT_PATH: /workspace/output
NOTIFICATION_URL: http://backend:4000/api/webhook/notify
```

### Step 2: Use Variables in Nodes

In the **"ARK Agent: Code Analyzer"** node, update the JSON body:

```json
{
  "namespace": "banque-migration",
  "agent": "code-analyzer",
  "input": {
    "repositoryUrl": "={{ $('Webhook Trigger').item.json.body.repositoryUrl || $workflow.settings.variables.REPOSITORY_URL }}",
    "repositoryPath": "={{ $('Webhook Trigger').item.json.body.repositoryPath || '/workspace/repos/banque-app' }}"
  },
  "model": "claude-sonnet-4-5"
}
```

**Explanation:**
- If webhook provides `repositoryUrl`, use that
- Otherwise, use the workflow variable `REPOSITORY_URL`
- This allows both dynamic (webhook) and default (variable) values

---

## Method 2: Environment Variables

### Step 1: Set Environment Variables in Docker

Edit `docker-compose.cloud.yml`:

```yaml
n8n:
  image: n8nio/n8n:latest
  environment:
    # ... existing variables ...
    - DEFAULT_REPO_URL=https://github.com/hamza-baqa/banque-app
    - DEFAULT_OUTPUT_PATH=/workspace/output
```

### Step 2: Use in Workflow

```json
{
  "repositoryUrl": "={{ $('Webhook Trigger').item.json.body.repositoryUrl || $env.DEFAULT_REPO_URL }}"
}
```

---

## Method 3: Set Node (Easiest!)

### Add a "Set Default Variables" Node

1. After **"Webhook Trigger"**, add a **"Set"** node
2. Name it: **"Set Default Variables"**
3. Configure it:

```javascript
// In the Set node, add these fields:

Field 1:
  Name: repositoryUrl
  Value: ={{ $json.body.repositoryUrl || 'https://github.com/hamza-baqa/banque-app' }}

Field 2:
  Name: outputPath
  Value: ={{ $json.body.outputPath || '/workspace/output' }}

Field 3:
  Name: notificationUrl
  Value: ={{ $json.body.notificationUrl || 'http://backend:4000/api/webhook/notify' }}

Field 4:
  Name: repositoryPath
  Value: ={{ $json.body.repositoryPath || '/workspace/repos/banque-app' }}
```

### Updated Workflow Structure

```
Webhook Trigger
   ↓
Set Default Variables  ← NEW NODE
   ↓
Notify: Analyzer Started
   ↓
ARK Agent: Code Analyzer
   ↓
...
```

### Update Other Nodes to Use Set Node

In **"ARK Agent: Code Analyzer"**:

```json
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

In **"Notify: Analyzer Started"**:

```json
{
  "step": "analyzer_started",
  "timestamp": "={{ new Date().toISOString() }}",
  "repositoryUrl": "={{ $('Set Default Variables').item.json.repositoryUrl }}"
}
```

---

## Method 4: n8n Credentials (For Private Repos)

If your repository is private:

### Step 1: Add GitHub Credentials

1. In n8n, go to **"Credentials"**
2. Click **"+ Add Credential"**
3. Select **"GitHub"**
4. Add:
   - **Name:** `GitHub - Hamza Baqa`
   - **Access Token:** Your GitHub Personal Access Token
   - **URL:** `https://github.com/hamza-baqa/banque-app`

### Step 2: Use in Webhook

```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app",
    "githubToken": "{{ $credentials.GitHub.accessToken }}"
  }'
```

---

## Complete Updated Workflow (Method 3)

Let me create the updated workflow file with the Set node:

```json
{
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [120, 460]
    },
    {
      "name": "Set Default Variables",
      "type": "n8n-nodes-base.set",
      "position": [340, 460],
      "parameters": {
        "values": {
          "string": [
            {
              "name": "repositoryUrl",
              "value": "={{ $json.body.repositoryUrl || 'https://github.com/hamza-baqa/banque-app' }}"
            },
            {
              "name": "outputPath",
              "value": "={{ $json.body.outputPath || '/workspace/output' }}"
            },
            {
              "name": "repositoryPath",
              "value": "={{ $json.body.repositoryPath || '/workspace/repos/banque-app' }}"
            },
            {
              "name": "notificationUrl",
              "value": "={{ $json.body.notificationUrl || 'http://backend:4000/api/webhook/notify' }}"
            }
          ]
        }
      }
    },
    // ... rest of nodes
  ]
}
```

---

## Testing with Variables

### Test 1: Use Default Repository (Your Repo)

```bash
# No repositoryUrl provided, uses default
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{}'
```

Result: Uses `https://github.com/hamza-baqa/banque-app`

### Test 2: Override with Different Repository

```bash
# Provide different repo
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/other-user/other-repo"
  }'
```

Result: Uses the provided repo URL

### Test 3: Your Repository Explicitly

```bash
# Explicitly provide your repo
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }'
```

---

## Update Test Script with Variable

Update `test-webhook.sh` to allow variable repo:

```bash
#!/bin/bash

# Allow override via environment variable
REPO_URL="${REPO_URL:-https://github.com/hamza-baqa/banque-app}"

echo "Using repository: $REPO_URL"

curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d "{
    \"repositoryUrl\": \"$REPO_URL\"
  }"
```

### Usage:

```bash
# Use default (your repo)
./test-webhook.sh

# Use different repo
REPO_URL="https://github.com/other/repo" ./test-webhook.sh
```

---

## Frontend Configuration

Update frontend to make repository URL configurable:

```typescript
// platform/frontend/src/app/page.tsx

const [repoUrl, setRepoUrl] = useState('https://github.com/hamza-baqa/banque-app');

const handleSubmit = async () => {
  const response = await fetch('http://localhost:5678/webhook/migration-ark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      repositoryUrl: repoUrl  // Dynamic value from input
    })
  });
};

// JSX
<input
  type="text"
  value={repoUrl}
  onChange={(e) => setRepoUrl(e.target.value)}
  placeholder="GitHub Repository URL"
  className="w-full px-4 py-3 rounded-lg"
/>
```

---

## Quick Reference

### Change Default Repository

**Method 1: Edit Set Node in n8n**
1. Open workflow
2. Click "Set Default Variables" node
3. Change `repositoryUrl` value
4. Save workflow

**Method 2: Environment Variable**
```bash
# In docker-compose.cloud.yml
DEFAULT_REPO_URL=https://github.com/hamza-baqa/banque-app
```

**Method 3: Always Provide in Webhook**
```bash
curl -X POST http://localhost:5678/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"YOUR_REPO_URL"}'
```

---

## ✅ Recommended Setup

**Best Practice:** Use Method 3 (Set Node) because:
- ✅ Easy to change in n8n UI
- ✅ No need to restart containers
- ✅ Clear default values
- ✅ Supports webhook override
- ✅ No code changes needed

---

**Your repository URL is now a variable!** 🎉

You can:
1. Set default to: `https://github.com/hamza-baqa/banque-app`
2. Override via webhook anytime
3. Change default in n8n without redeploying
