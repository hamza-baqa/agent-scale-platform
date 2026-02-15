# 🔄 Intelligent Retry System with Error Feedback

## 🎯 Overview

The platform now includes an **intelligent retry mechanism** that automatically detects critical errors in validation tests, analyzes them using AI, adjusts the generation prompts, and retries the migration until code is generated with **ZERO critical issues**.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    MIGRATION PIPELINE                            │
└─────────────────────────────────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ Code Gen     │ ← Uses initial prompts
    │ (Services +  │
    │  Frontend)   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Unit Tests   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ Integration  │
    │ Tests        │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ E2E Tests    │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────────┐
    │ ❌ Critical Errors?  │
    └──────┬───────────────┘
           │
           ├─── NO ──→ ✅ Success! Allow Download
           │
           └─── YES ──→ ┌────────────────────┐
                        │ Error Analyzer     │ ← ARK Agent
                        │ (AI Analysis)      │
                        └────────┬───────────┘
                                 │
                                 ▼
                        ┌────────────────────┐
                        │ Extract Errors     │
                        │ - Build issues     │
                        │ - DB errors        │
                        │ - API problems     │
                        │ - Security issues  │
                        └────────┬───────────┘
                                 │
                                 ▼
                        ┌────────────────────┐
                        │ AI Suggests Fixes  │
                        │ - Adjust prompts   │
                        │ - Add emphasis     │
                        │ - Fix config       │
                        └────────┬───────────┘
                                 │
                                 ▼
                        ┌────────────────────┐
                        │ Retry Generation   │ ← With adjusted prompts
                        │ (Attempt 2/3)      │
                        └────────┬───────────┘
                                 │
                                 └──→ Repeat until SUCCESS or MAX 3 retries
```

---

## 🔥 Key Features

### 1. **Automatic Error Detection**
- Scans validation reports from Unit, Integration, and E2E tests
- Identifies CRITICAL and HIGH severity errors
- Extracts error details: category, location, description, impact

### 2. **AI-Powered Error Analysis**
- Uses ARK `error-analyzer` agent
- Analyzes root causes of failures
- Suggests specific prompt adjustments
- Provides confidence score for retry success

### 3. **Intelligent Prompt Adjustment**
- Modifies service-generator prompts
- Modifies frontend-migrator prompts
- Adds emphasis on critical requirements
- Includes specific fixes for identified issues

### 4. **Automatic Retry (Max 3 Attempts)**
- Cleans workspace
- Applies adjusted prompts
- Regenerates code
- Revalidates
- Repeats until success or max retries

### 5. **Download Protection**
- **Blocks download** if critical errors remain
- Only allows download when validation passes with 0 critical issues
- Provides clear error messages explaining why download is blocked

---

## 📊 Error Categories Analyzed

### 1. Build/Compilation Errors
- **Examples**: Missing dependencies, compilation failures
- **AI Fix**: Add required dependencies to pom.xml/package.json

### 2. Database/JPA Errors
- **Examples**: Missing @Entity, wrong mappings, connection failures
- **AI Fix**: Add proper JPA annotations, fix database configuration

### 3. API/REST Errors
- **Examples**: Missing endpoints, wrong HTTP methods
- **AI Fix**: Add @RestController, fix endpoint mappings

### 4. Authentication/Security Errors
- **Examples**: JWT config missing, Spring Security misconfiguration
- **AI Fix**: Add Security config, JWT utilities

### 5. Frontend/Angular Errors
- **Examples**: Module Federation issues, routing errors
- **AI Fix**: Fix webpack config, add proper routing

### 6. Integration Errors
- **Examples**: Services can't communicate, service discovery issues
- **AI Fix**: Add Eureka config, fix inter-service communication

### 7. Docker/Container Errors
- **Examples**: Dockerfile build failures, missing ENV vars
- **AI Fix**: Fix Dockerfile, add proper configurations

---

## 🔧 How It Works

### Step 1: Run Migration
```bash
curl -X POST http://localhost:4000/api/repo-migration/analyze-and-generate \
  -H 'Content-Type: application/json' \
  -d '{"repoPath": "/path/to/your/repo"}'
```

### Step 2: System Validates Code
- Unit tests run
- Integration tests run
- E2E tests run

### Step 3: Critical Errors Detected
If errors found, system automatically:
1. Extracts error details
2. Calls Error Analyzer AI agent
3. Gets prompt adjustments
4. Retries generation

### Step 4: Retry with Fixes
System regenerates code with:
- Adjusted prompts emphasizing fixes
- Specific instructions for problematic areas
- Enhanced validation requirements

### Step 5: Success or Max Retries
- ✅ **Success**: Code generated with 0 critical issues → Download allowed
- ❌ **Max Retries**: After 3 attempts → Download blocked, manual review needed

---

## 📥 Download Behavior

### ✅ Download Allowed When:
```
✅ Status: completed
✅ Critical Issues: 0
✅ Validation: Passed
```

**Response**:
```
HTTP 200 OK
Content-Type: application/zip
```

### ❌ Download Blocked When:

#### Case 1: Still Retrying
```json
{
  "error": "Migration is retrying",
  "message": "Critical errors found. System is automatically retrying...",
  "retryAttempt": 2,
  "maxRetries": 3
}
```
**Response**: `HTTP 400 Bad Request`

#### Case 2: Critical Errors Remain
```json
{
  "error": "Download blocked - critical errors remain",
  "message": "Code has critical errors that must be resolved.",
  "criticalIssues": 5,
  "summary": "Build errors: missing PostgreSQL driver in 3 services"
}
```
**Response**: `HTTP 400 Bad Request`

#### Case 3: Max Retries Exceeded
```json
{
  "error": "Migration failed",
  "message": "Failed after 3 retry attempts with critical errors",
  "criticalIssues": 2,
  "recommendation": "Manual review required"
}
```
**Response**: `HTTP 400 Bad Request`

---

## 🎯 Migration Statuses

| Status | Description | Download Allowed? |
|--------|-------------|-------------------|
| `analyzing` | Analyzing source code | ❌ No |
| `planning` | Creating migration plan | ❌ No |
| `generating` | Generating code | ❌ No |
| `validating` | Running tests | ❌ No |
| `retrying` | Auto-retry in progress | ❌ No |
| `completed` | ✅ Success, 0 critical issues | ✅ **YES** |
| `completed_with_errors` | Has critical errors | ❌ No |
| `failed` | Max retries exceeded | ❌ No |

---

## 📋 Example: Retry Flow

### Attempt 1: Initial Generation
```
🔨 Generating auth-service...
✅ Code generated
🧪 Running integration tests...
❌ CRITICAL: PostgreSQL driver not found
❌ CRITICAL: JWT utilities missing
```

### Error Analysis
```json
{
  "analysis": {
    "criticalIssues": [
      {
        "category": "Build",
        "description": "PostgreSQL JDBC driver not in pom.xml",
        "impact": "Cannot connect to database"
      },
      {
        "category": "Security",
        "description": "JWT token utilities missing",
        "impact": "Authentication fails"
      }
    ]
  },
  "adjustments": {
    "serviceGeneratorPrompt": {
      "additions": [
        "MANDATORY: Include PostgreSQL driver dependency",
        "MANDATORY: Generate complete JWT utility classes"
      ]
    }
  },
  "retryStrategy": {
    "shouldRetry": true,
    "confidence": 0.90,
    "estimatedSuccessRate": "High"
  }
}
```

### Attempt 2: Retry with Fixes
```
🔄 Retrying with adjusted prompts...
🔨 Regenerating auth-service...
✅ Code generated (with PostgreSQL driver + JWT utils)
🧪 Running integration tests...
✅ All tests passed!
✅ 0 critical issues - SUCCESS!
```

---

## 🛠️ Configuration

### Max Retries
Set in code (default: 3):
```typescript
const maxRetries = 3;
```

### Error Analyzer Agent
Location: `ark/agents/error-analyzer.yaml`

Deploy:
```bash
kubectl apply -f ark/agents/error-analyzer.yaml
```

### Confidence Threshold
Retry only if confidence > 0.5 (configurable)

---

## 🧪 Testing the System

### Test 1: Successful Migration (No Errors)
```bash
# Create migration
MIGRATION_ID=$(curl -s -X POST http://localhost:4000/api/repo-migration/analyze-and-generate \
  -H 'Content-Type: application/json' \
  -d '{"repoPath": "/path/to/clean/repo"}' | jq -r '.migrationId')

# Wait for completion
watch -n 5 "curl -s http://localhost:4000/api/migrations/$MIGRATION_ID | jq -r '.status'"

# Download when completed
curl -o output.zip "http://localhost:4000/api/migrations/$MIGRATION_ID/download"
# Expected: HTTP 200 OK
```

### Test 2: Migration with Critical Errors (Auto-Retry)
```bash
# Create migration (repo with issues)
MIGRATION_ID=$(curl -s -X POST http://localhost:4000/api/repo-migration/analyze-and-generate \
  -H 'Content-Type: application/json' \
  -d '{"repoPath": "/path/to/problematic/repo"}' | jq -r '.migrationId')

# Monitor status
curl -s "http://localhost:4000/api/migrations/$MIGRATION_ID" | jq '{
  status: .status,
  retryAttempt: .retryAttempt,
  criticalIssues: .errorAnalysis.analysis.criticalIssues | length
}'

# Try to download while retrying
curl -s "http://localhost:4000/api/migrations/$MIGRATION_ID/download"
# Expected: HTTP 400 - "Migration is retrying"

# Wait for retry to complete
# Try download again
curl -s "http://localhost:4000/api/migrations/$MIGRATION_ID/download"
# Expected: HTTP 200 if retry succeeded, HTTP 400 if errors remain
```

### Test 3: Check Error Analysis
```bash
curl -s "http://localhost:4000/api/migrations/$MIGRATION_ID" | jq '.errorAnalysis'
```

---

## 📊 Monitoring

### Check Migration Status
```bash
curl -s "http://localhost:4000/api/migrations/{id}" | jq '{
  status: .status,
  retryAttempt: .retryAttempt,
  hasErrors: (.errorAnalysis != null),
  criticalIssues: .errorAnalysis.analysis.criticalIssues | length
}'
```

### View Error Analysis
```bash
curl -s "http://localhost:4000/api/migrations/{id}" | jq '.errorAnalysis.analysis'
```

### View Prompt Adjustments
```bash
curl -s "http://localhost:4000/api/migrations/{id}" | jq '.errorAnalysis.adjustments'
```

### View Retry History
```bash
curl -s "http://localhost:4000/api/migrations/{id}" | jq '.previousAdjustments'
```

---

## ✅ Success Criteria

A migration is considered **successful** and download is allowed when:

1. ✅ Status = `completed`
2. ✅ All validators passed (Unit + Integration + E2E)
3. ✅ Critical errors = 0
4. ✅ Build succeeds
5. ✅ All services start
6. ✅ API endpoints respond
7. ✅ Database connections work
8. ✅ Authentication functions
9. ✅ Frontend loads

---

## 🚀 Benefits

1. **Zero Manual Intervention** - System automatically fixes common issues
2. **Faster Turnaround** - No waiting for manual fixes
3. **Learning System** - AI learns from errors and improves
4. **Quality Guarantee** - Only production-ready code can be downloaded
5. **Transparency** - Full error analysis and retry history available
6. **Cost Effective** - Fixes issues automatically instead of manual debugging

---

## 🎓 Best Practices

1. **Monitor Retry Attempts** - If consistently hitting max retries, review base prompts
2. **Review Error Patterns** - Look for recurring issues and update agent prompts
3. **Set Realistic Expectations** - Some architectural issues may need manual fixes
4. **Use Confidence Scores** - Low confidence (<0.6) may indicate need for human review
5. **Track Success Rates** - Monitor which error categories are successfully auto-fixed

---

## 📝 Files Created/Modified

### New Files:
- `ark/agents/error-analyzer.yaml` - AI agent for error analysis
- `platform/backend/src/services/errorAnalyzer.ts` - Error analysis service
- `INTELLIGENT-RETRY-SYSTEM.md` - This documentation

### Modified Files:
- `platform/backend/src/routes/repoMigrationRoutes.ts` - Added retry logic
- `platform/backend/src/routes/migrationRoutes.ts` - Added download validation

---

## 🎯 Summary

**Your migration platform now has an intelligent, self-healing retry system that ensures you can ONLY download code that passes ALL validation tests with ZERO critical issues!** 🎉

The system automatically:
1. ✅ Detects critical errors
2. ✅ Analyzes root causes with AI
3. ✅ Adjusts prompts intelligently
4. ✅ Retries generation
5. ✅ Blocks download until success
6. ✅ Provides detailed error feedback

**Result**: Production-ready, validated, error-free microservices architecture every time!
