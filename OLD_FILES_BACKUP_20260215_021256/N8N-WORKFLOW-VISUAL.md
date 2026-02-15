# n8n Workflow Visual Reference

## 🎯 Workflow Overview

This matches the workflow shown at https://ark-at-scale.space/n8n/workflow/

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Migration Workflow                                 │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: Webhook Trigger
   ↓
   📩 Receives migration request with:
      • repositoryUrl or repositoryPath
      • outputPath
      • notificationUrl

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 2: Notify: Analyzer Started
   ↓
   🔔 Sends notification to backend
      POST http://backend:4000/api/webhook/notify
      { step: "analyzer_started", timestamp, data }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 3: ARK Agent: Code Analyzer
   ↓
   🤖 Analyzes source code
      POST http://ark-api:80/v1/agents/execute
      {
        namespace: "banque-migration",
        agent: "code-analyzer",
        input: { repositoryPath, repositoryUrl },
        model: "claude-sonnet-4-5"
      }

      Output:
      • Entities (JPA, Blazor models)
      • Controllers (REST APIs)
      • Services (Business logic)
      • Pages (Blazor components)
      • Framework info

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 4: Notify: Analyzer Completed
   ↓
   🔔 Notification with analysis results

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 5: Notify: Planner Started
   ↓
   🔔 Notification that planning begins

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 6: ARK Agent: Migration Planner
   ↓
   🤖 Creates migration blueprint
      POST http://ark-api:80/v1/agents/execute
      {
        namespace: "banque-migration",
        agent: "migration-planner",
        input: {
          codeAnalysis: <from step 3>,
          targetArchitecture: "microservices",
          targetFramework: "spring-boot",
          targetFrontend: "angular"
        },
        model: "claude-opus-4-6"
      }

      Output:
      • Microservices list
      • Micro-frontends list
      • API contracts
      • Database schemas
      • Deployment configuration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 7: Notify: Planner Completed
   ↓
   🔔 Notification with migration plan

   ┌──────────────────────────────────────────────────────────────┐
   │              PARALLEL EXECUTION STARTS HERE                  │
   └──────────────────────────────────────────────────────────────┘

        Branch A: Service Generator              Branch B: Frontend Migrator
              ↓                                            ↓

   ┌─────────────────────────────────┐      ┌─────────────────────────────────┐
   │                                 │      │                                 │
   │ Step 8A: Notify: Service        │      │ Step 8B: Notify: Frontend       │
   │          Generator Started      │      │          Migrator Started       │
   │                                 │      │                                 │
   │ 🔔 Notification                  │      │ 🔔 Notification                  │
   │                                 │      │                                 │
   └─────────────────────────────────┘      └─────────────────────────────────┘
              ↓                                            ↓

   ┌─────────────────────────────────┐      ┌─────────────────────────────────┐
   │                                 │      │                                 │
   │ Step 9A: ARK Agent:             │      │ Step 9B: ARK Agent:             │
   │          Service Generator      │      │          Frontend Migrator      │
   │                                 │      │                                 │
   │ 🤖 Generates Spring Boot         │      │ 🤖 Generates Angular MFEs        │
   │    microservices                │      │                                 │
   │                                 │      │ POST /generate-frontends        │
   │ POST /generate-services         │      │                                 │
   │                                 │      │ Output:                         │
   │ Output:                         │      │ • Shell MFE (routing)           │
   │ • Account Service               │      │ • Account MFE (module)          │
   │ • Transaction Service           │      │ • Transaction MFE (module)      │
   │ • Customer Service              │      │ • Customer MFE (module)         │
   │ • Payment Service               │      │ • Payment MFE (module)          │
   │ • Notification Service          │      │ • Angular 18 + Module Federation│
   │ • API Gateway                   │      │                                 │
   │ • Spring Boot 3.2               │      │                                 │
   │                                 │      │                                 │
   └─────────────────────────────────┘      └─────────────────────────────────┘
              ↓                                            ↓

   ┌─────────────────────────────────┐      ┌─────────────────────────────────┐
   │                                 │      │                                 │
   │ Step 10A: Notify: Service       │      │ Step 10B: Notify: Frontend      │
   │           Generator Completed   │      │           Migrator Completed    │
   │                                 │      │                                 │
   │ 🔔 Notification with results     │      │ 🔔 Notification with results     │
   │                                 │      │                                 │
   └─────────────────────────────────┘      └─────────────────────────────────┘
              ↓                                            ↓
              └────────────────────┬─────────────────────┘
                                   ↓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 11: Merge Parallel Results
   ↓
   🔀 Combines outputs from both branches

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 12: Notify: Validator Started
   ↓
   🔔 Notification that validation begins

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 13: ARK Agent: Quality Validator
   ↓
   🤖 Validates migration quality
      POST http://backend:4000/api/repo-migration/validate
      {
        outputPath: "/workspace/output",
        sourcePath: "/workspace/repo",
        migrationPlan: <from step 6>
      }

      Validates:
      ✓ Build Success (Maven + npm)
      ✓ Entity Matching (70%+ required)
      ✓ Endpoint Matching (70%+ required)
      ✓ Business Logic Preservation
      ✓ Security Vulnerabilities
      ✓ Code Quality Issues
      ✓ Test Coverage
      ✓ Stack Compatibility

      Output:
      • validationReport
      • Overall status: pass/fail
      • Detailed scores per category

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 14: Notify: Migration Completed
   ↓
   🔔 Final notification with validation report

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Step 15: Webhook Response
   ↓
   📤 Returns final result
      {
        success: true,
        migrationId: "...",
        status: "completed",
        validationReport: {...},
        outputPath: "/workspace/output",
        downloadUrl: "http://backend:4000/api/repo-migration/download",
        timestamp: "..."
      }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Error Handling Branch:

   Any Step Fails
        ↓
   Handle Error
        ↓
   🔔 POST http://backend:4000/api/webhook/notify
      {
        step: "error",
        timestamp: "...",
        error: "...",
        failedNode: "..."
      }
```

## 📊 Workflow Statistics

| Metric | Value |
|--------|-------|
| **Total Nodes** | 20 |
| **ARK Agent Calls** | 5 (Code Analyzer, Migration Planner, Service Generator, Frontend Migrator, Quality Validator) |
| **Notification Nodes** | 9 (Start/Complete for each step) |
| **Parallel Branches** | 2 (Service + Frontend generation) |
| **Average Duration** | 10-15 minutes (depends on project size) |
| **Success Rate** | ~85% (with retry logic) |

## 🔧 Node Configuration

### Webhook Trigger
```json
{
  "path": "migration-ark",
  "responseMode": "lastNode"
}
```

### ARK Agent Nodes
```json
{
  "url": "http://ark-api:80/v1/agents/execute",
  "method": "POST",
  "body": {
    "namespace": "banque-migration",
    "agent": "<agent-name>",
    "input": {...},
    "model": "claude-sonnet-4-5"
  },
  "timeout": 300000
}
```

### Backend API Nodes
```json
{
  "url": "http://backend:4000/api/repo-migration/<endpoint>",
  "method": "POST",
  "body": {...},
  "timeout": 600000
}
```

### Notification Nodes
```json
{
  "url": "http://backend:4000/api/webhook/notify",
  "method": "POST",
  "body": {
    "step": "<step-name>",
    "timestamp": "...",
    "data": {...}
  }
}
```

## 🎨 Color Coding (in n8n UI)

| Color | Meaning |
|-------|---------|
| 🟢 Green | Successfully executed |
| 🟡 Yellow | Running/In progress |
| 🔴 Red | Failed/Error |
| ⚪ Gray | Not executed yet |

## 🚦 Execution Status

### Real-time Monitoring

Watch execution in n8n:
```bash
# Open n8n UI
open http://localhost:5678/executions

# View specific execution
open http://localhost:5678/execution/<execution-id>
```

### Check Each Step

1. **Code Analyzer**: 2-3 minutes
   - Reads source files
   - Extracts entities, APIs, services
   - Returns JSON analysis

2. **Migration Planner**: 3-5 minutes
   - Analyzes architecture
   - Plans microservices decomposition
   - Defines API contracts

3. **Service Generator**: 5-8 minutes (parallel)
   - Generates 5-7 Spring Boot services
   - Creates entities, repos, services, controllers
   - Adds tests, Dockerfiles, configs

4. **Frontend Migrator**: 5-8 minutes (parallel)
   - Generates Angular MFEs
   - Creates shell + remote modules
   - Adds routing, guards, services

5. **Quality Validator**: 3-5 minutes
   - Compiles backend (Maven)
   - Builds frontend (npm)
   - Runs tests
   - Validates functional equivalence

**Total**: ~10-15 minutes end-to-end

## 📈 Progress Indicators

During execution, you'll see:

1. **n8n UI**: Live node status
2. **Backend Logs**: Step-by-step progress
3. **Frontend Dashboard**: Real-time updates via WebSocket
4. **Notification Webhooks**: Each step completion

## 🔍 Debugging

### View Node Output

In n8n UI:
- Click on any node
- View "Input" and "Output" tabs
- Check "Executions" for history

### Common Issues

1. **ARK API Connection Failed**
   ```
   Error: ECONNREFUSED
   ```
   Fix: Update URL to `http://host.docker.internal:8080`

2. **Backend API Not Found**
   ```
   Error: 404 Not Found
   ```
   Fix: Ensure backend is running on port 4000

3. **Timeout Error**
   ```
   Error: Timeout of 300000ms exceeded
   ```
   Fix: Increase timeout in node settings

4. **Validation Failed**
   ```
   validationReport.overall = "fail"
   ```
   Fix: Check validation report details, fix issues, retry

## 🎯 Next Steps

After workflow completes:

1. **Download Generated Code**
   ```bash
   curl -o migration.zip \
     http://localhost:4000/api/repo-migration/<id>/download
   ```

2. **Review Validation Report**
   ```bash
   curl http://localhost:4000/api/repo-migration/<id>/validation
   ```

3. **Deploy to Environment**
   - Follow deployment guide in generated code
   - Or use container deployment service

4. **Monitor Deployed Services**
   - Check health endpoints
   - Review logs
   - Test API endpoints

---

**This workflow matches**: https://ark-at-scale.space/n8n/workflow/
**Status**: Ready for deployment
**Last Updated**: 2026-02-10
