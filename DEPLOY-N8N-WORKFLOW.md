# Deploy Agent@Scale Platform with n8n Workflow

## 🎯 Overview

This guide shows how to deploy your Agent@Scale platform with the same n8n workflow as https://ark-at-scale.space/n8n/workflow/

The workflow includes:
- ✅ ARK Agent: Code Analyzer
- ✅ ARK Agent: Migration Planner
- ✅ ARK Agent: Service Generator
- ✅ ARK Agent: Frontend Migrator
- ✅ ARK Agent: Quality Validator
- ✅ Real-time notifications between steps
- ✅ Parallel execution for service + frontend generation
- ✅ Error handling

## 📋 Prerequisites

1. **Docker & Docker Compose** installed
2. **ARK API** deployed (or use mock ARK service)
3. **n8n instance** running (local or cloud)
4. **Backend API** running on port 4000

## 🚀 Step 1: Deploy ARK API (or Mock)

### Option A: Use Real ARK API on Kubernetes

```bash
# Deploy ARK agents
kubectl apply -f ark/agents/

# Verify agents are running
kubectl get agents -n banque-migration
```

### Option B: Use Mock ARK Service (Local Development)

```bash
# Start mock ARK service with Ollama
./start-mock-ark-ollama.sh

# OR use simple mock without AI
./start-mock-ark.sh

# Verify it's running
curl http://localhost:8080/v1/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "banque-migration",
    "agent": "code-analyzer",
    "input": {"test": true}
  }'
```

## 🚀 Step 2: Deploy Backend & Frontend

```bash
# Start all services with Docker Compose
docker-compose -f docker-compose.cloud.yml up -d

# Verify services
docker-compose -f docker-compose.cloud.yml ps

# Expected output:
# - backend: running on port 4000
# - frontend: running on port 3000
# - mongodb: running on port 27017
```

## 🚀 Step 3: Deploy n8n

### Option A: Use Docker Compose (Included)

The `docker-compose.cloud.yml` already includes n8n:

```yaml
n8n:
  image: n8nio/n8n:latest
  ports:
    - "5678:5678"
  environment:
    - N8N_BASIC_AUTH_ACTIVE=true
    - N8N_BASIC_AUTH_USER=admin
    - N8N_BASIC_AUTH_PASSWORD=admin
  volumes:
    - n8n_data:/home/node/.n8n
```

Start it:
```bash
docker-compose -f docker-compose.cloud.yml up -d n8n
```

Access n8n:
- URL: http://localhost:5678
- Username: admin
- Password: admin

### Option B: Use Existing n8n Instance

If you already have n8n running (e.g., at https://ark-at-scale.space/n8n):
- Just note the URL
- You'll need admin access to import workflows

## 🚀 Step 4: Import n8n Workflow

### Import Advanced ARK Agents Workflow

1. **Login to n8n**
   ```bash
   # Local
   open http://localhost:5678

   # Or cloud
   open https://ark-at-scale.space/n8n
   ```

2. **Import Workflow**
   - Click **"Workflows"** → **"Import from File"**
   - Select: `platform/n8n-workflow-ark-agents.json`
   - Click **"Import"**

3. **Configure ARK API URL**

   Edit each "ARK Agent" node and update the URL:

   ```javascript
   // For local mock ARK
   URL: http://host.docker.internal:8080/v1/agents/execute

   // For Kubernetes ARK API
   URL: http://ark-api.ark-system.svc.cluster.local:80/v1/agents/execute

   // For cloud ARK API
   URL: https://ark-at-scale.space/ark-api/v1/agents/execute
   ```

4. **Configure Backend API URL**

   Edit these nodes:
   - "ARK Agent: Service Generator"
   - "ARK Agent: Frontend Migrator"
   - "ARK Agent: Quality Validator"

   Update URLs:
   ```javascript
   // For Docker Compose
   URL: http://backend:4000/api/...

   // For local development
   URL: http://host.docker.internal:4000/api/...

   // For cloud deployment
   URL: https://your-domain.com/api/...
   ```

5. **Configure Notification URLs (Optional)**

   The workflow sends notifications to your backend. If you want to disable:
   - Remove all "Notify:" nodes
   - Or set a valid notification endpoint in your backend

6. **Activate Workflow**
   - Toggle the workflow to **"Active"**
   - Note the webhook URL (e.g., `http://localhost:5678/webhook/migration-ark`)

## 🚀 Step 5: Test the Workflow

### Test with curl

```bash
# Get webhook URL from n8n
WEBHOOK_URL="http://localhost:5678/webhook/migration-ark"

# Trigger migration
curl -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/test/banking-app",
    "repositoryPath": "/workspace/repo",
    "outputPath": "/workspace/output",
    "notificationUrl": "http://backend:4000/api/webhook/notify"
  }'
```

### Monitor Execution

1. **n8n Executions View**
   - Go to: n8n → Executions
   - Watch real-time progress
   - See data flow between nodes

2. **Backend Logs**
   ```bash
   docker-compose -f docker-compose.cloud.yml logs -f backend
   ```

3. **Frontend Dashboard**
   ```bash
   open http://localhost:3000/dashboard
   ```

## 🔧 Troubleshooting

### Issue 1: "Unrecognized node type: arkAgent.undefined"

**Cause**: ARK agent nodes are configured as generic HTTP Request nodes, not custom ARK nodes.

**Solution**: This is expected! The workflow uses HTTP Request nodes to call ARK API. Just ensure the URL is correct:

```javascript
// Check each ARK Agent node has this URL format:
http://ark-api:80/v1/agents/execute
```

### Issue 2: ARK API Connection Failed

**Symptoms**:
```
Error: connect ECONNREFUSED
```

**Solution**:

1. **If using Docker Compose**: Update URLs to use `host.docker.internal`
   ```javascript
   // In n8n workflow nodes
   URL: http://host.docker.internal:8080/v1/agents/execute
   ```

2. **If using Kubernetes**: Ensure ARK API service is accessible
   ```bash
   kubectl get svc -n ark-system
   kubectl port-forward -n ark-system svc/ark-api 8080:80
   ```

3. **Test ARK API directly**:
   ```bash
   curl http://localhost:8080/v1/agents/execute \
     -H "Content-Type: application/json" \
     -d '{
       "namespace": "banque-migration",
       "agent": "code-analyzer",
       "input": {}
     }'
   ```

### Issue 3: Backend API Not Reachable from n8n

**Symptoms**:
```
Error: getaddrinfo ENOTFOUND backend
```

**Solution**:

If n8n is in Docker and backend is on host:
```javascript
// Change backend URLs to:
http://host.docker.internal:4000/api/...
```

If both are in same Docker Compose:
```javascript
// Use service name:
http://backend:4000/api/...
```

If backend is on Kubernetes:
```javascript
// Use full service DNS:
http://backend.default.svc.cluster.local:4000/api/...
```

### Issue 4: Notifications Failing

**Symptoms**:
```
Error 404: /api/webhook/notify not found
```

**Solution**: Add notification endpoint to backend or disable notifications:

```typescript
// platform/backend/src/server.ts
app.post('/api/webhook/notify', (req, res) => {
  console.log('Notification:', req.body);
  res.json({ success: true });
});
```

Or remove all "Notify:" nodes from workflow.

### Issue 5: Timeouts During Code Generation

**Symptoms**:
```
Error: Timeout of 300000ms exceeded
```

**Solution**: Increase timeout in n8n nodes:

```javascript
// In "ARK Agent" nodes, set options:
{
  "timeout": 600000  // 10 minutes
}
```

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        n8n Workflow                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │      Webhook Trigger                │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Notify: Analyzer Started           │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  ARK Agent: Code Analyzer           │
        │  → ARK API                          │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Notify: Analyzer Completed         │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Notify: Planner Started            │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  ARK Agent: Migration Planner       │
        │  → ARK API                          │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Notify: Planner Completed          │
        └─────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ Service Generator Branch  │   │ Frontend Migrator Branch  │
│ → Backend API             │   │ → Backend API             │
└───────────────────────────┘   └───────────────────────────┘
            │                                   │
            └─────────────────┬─────────────────┘
                              ▼
        ┌─────────────────────────────────────┐
        │  Merge Parallel Results             │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Notify: Validator Started          │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  ARK Agent: Quality Validator       │
        │  → Backend API                      │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Notify: Migration Completed        │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │  Webhook Response                   │
        └─────────────────────────────────────┘
```

## 🎯 Next Steps

### 1. Integrate with Frontend

Update frontend to trigger n8n workflow instead of direct backend:

```typescript
// platform/frontend/src/app/page.tsx
const response = await fetch('http://localhost:5678/webhook/migration-ark', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repositoryUrl: repoUrl,
    notificationUrl: 'http://localhost:4000/api/webhook/notify'
  })
});
```

### 2. Add Custom Integrations

Extend n8n workflow with:
- Slack notifications
- Email alerts
- Jira ticket creation
- GitHub PR creation
- Cloud storage upload
- CI/CD pipeline trigger

### 3. Production Deployment

For production:
1. Use HTTPS for all endpoints
2. Add authentication to n8n webhook
3. Use Kubernetes secrets for credentials
4. Enable n8n workflow versioning
5. Set up monitoring and alerting

### 4. Advanced Features

Consider adding:
- **Retry logic** for failed nodes
- **Conditional branches** for different migration types
- **Manual approval steps** before deployment
- **Parallel validation** for multiple environments
- **Rollback workflows** for failed migrations

## 📚 Resources

- **n8n Documentation**: https://docs.n8n.io/
- **ARK Documentation**: https://mckinsey.github.io/agents-at-scale-ark/
- **Your ARK Agents**: `ark/agents/*.yaml`
- **Backend API**: `platform/backend/src/routes/repoMigrationRoutes.ts`
- **Workflow Files**:
  - `platform/n8n-workflow-ark-agents.json` (Advanced)
  - `platform/n8n-workflow-migration.json` (Simple)

## ✅ Checklist

- [ ] ARK API deployed and accessible
- [ ] Backend API running on port 4000
- [ ] Frontend running on port 3000
- [ ] n8n instance running
- [ ] Workflow imported to n8n
- [ ] ARK API URLs configured in workflow
- [ ] Backend API URLs configured in workflow
- [ ] Workflow activated
- [ ] Test migration successful
- [ ] Monitoring set up

---

**Status**: Ready for deployment with n8n workflow integration
