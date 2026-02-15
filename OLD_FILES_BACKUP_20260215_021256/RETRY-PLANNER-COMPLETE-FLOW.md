# Retry Planner - Complete Agent Flow ✅

## Overview

The retry-planner agent now properly **starts**, **executes**, and **updates** the migration-planner to restart the migration with intelligent fixes.

## Complete Flow

### 1. **Initial Migration** (First Attempt)

```
Code Analyzer → Migration Planner → Service Generator → Frontend Migrator
  → Unit Test Validator → Integration Test Validator → E2E Test Validator
```

If **errors found** → Trigger Retry Loop

---

### 2. **Retry Loop Activation**

When E2E Test Validator completes with errors:

1. **Count Total Errors** from all 3 validators (unit, integration, E2E)
2. Check if `errors > 0` AND `currentAttempt < maxRetries`
3. If yes → **Start Retry Loop**

---

### 3. **PHASE 1: Retry Planner Agent Starts** ⭐ **NEW!**

**Backend Code** (`repoMigrationRoutes.ts` lines ~1910-1925):

```typescript
// Start retry-planner agent (update status in DB and notify frontend)
emitAgentStarted(migrationId, 'retry-planner');
emitAgentLog(migrationId, 'retry-planner', 'info', '🤖 Starting error analysis with AI...');

const improvement = await retryPlannerService.analyzeAndImprove({
  originalMigrationPlan: migrationPlan,
  unitTestReport: unitTestOutput,
  integrationTestReport: integrationTestOutput,
  e2eTestReport: e2eTestOutput,
  currentAttempt,
  maxRetries
});
```

**What Happens**:
- ✅ Retry-planner **agent status → "running"** in database
- ✅ Frontend shows retry-planner card as **RUNNING** with spinner
- ✅ WebSocket emits `agent-started` event
- 🤖 Calls ARK `retry-planner` agent to analyze all errors
- 📊 Agent returns: error analysis, root causes, prioritized fixes, enhanced guidance

**Frontend Effect**:
- Retry-planner card changes from **Pending** (gray) → **Running** (blue spinner)
- Real-time logs show: "🤖 Starting error analysis with AI..."

---

### 4. **PHASE 2: Retry Planner Completes** ⭐ **NEW!**

**Backend Code** (`repoMigrationRoutes.ts` lines ~1950-2020):

```typescript
// Format retry-planner output for display
const retryPlannerOutput = `# Retry Planner Analysis - Attempt ${currentAttempt + 1}/${maxRetries}
## Error Analysis Summary
**Total Errors**: ${improvement.analysis.totalErrors}
...
`;

// Complete retry-planner agent (save output and notify frontend)
emitAgentCompleted(migrationId, 'retry-planner', retryPlannerOutput);
emitAgentLog(migrationId, 'retry-planner', 'info', `✅ Analysis complete - ${improvement.improvementStrategy.prioritizedFixes.length} fixes identified`);
```

**What Happens**:
- ✅ Retry-planner **agent status → "completed"** in database
- ✅ Frontend shows retry-planner card as **COMPLETED** with green checkmark
- ✅ WebSocket emits `agent-completed` event with full analysis output
- 📄 Output saved to database for user viewing

**Frontend Effect**:
- Retry-planner card changes from **Running** (blue) → **Completed** (green checkmark)
- Click on retry-planner card → View full analysis in **Agent Output tab**
- Shows: Error summary, root causes, prioritized fixes, enhanced guidance

---

### 5. **PHASE 3: Re-invoke Migration Planner** ⭐ **NEW!**

**Backend Code** (`repoMigrationRoutes.ts` lines ~1975-2010):

```typescript
// Restart migration-planner agent with enhanced prompt
emitAgentStarted(migrationId, 'migration-planner');
emitAgentLog(migrationId, 'migration-planner', 'info', `🔄 Retry ${currentAttempt + 1}/${maxRetries} - Regenerating plan with ${improvement.improvementStrategy.prioritizedFixes.length} fixes`);

// Build enhanced prompt with retry guidance
const enhancedContext = `
## RETRY CONTEXT - Attempt ${currentAttempt + 1}/${maxRetries}

### Previous Issues Detected:
${improvement.analysis.rootCauseAnalysis}

### Critical Fixes Required:
${improvement.improvementStrategy.prioritizedFixes.map((fix, idx) =>
  `${idx + 1}. [${fix.priority}] ${fix.fix}\n   Impact: ${fix.impact}`
).join('\n')}
...
`;

// Store enhanced context for migration planner
(migration as any).enhancedPlannerContext = enhancedContext;
```

**What Happens**:
- ✅ Migration-planner **agent status → "running"** again
- 📝 Enhanced context stored with specific fixes from retry-planner
- 🔄 Migration continues to migration-planner step (line 1154)
- Migration-planner receives enhanced context as additional prompt

**Migration Planner Invocation** (`repoMigrationRoutes.ts` lines ~1154-1162):

```typescript
// Check if this is a retry with enhanced context from retry-planner
const enhancedContext = (migration as any).enhancedPlannerContext;
if (enhancedContext) {
  emitAgentLog(migrationId, 'migration-planner', 'info', '🔄 Using enhanced context from retry-planner for improved plan');
}

const plannerResult = await arkChatService.createMigrationPlanWithARK(analysis, actualRepoPath, enhancedContext);
```

**ARK Service** (`arkChatService.ts` lines ~1077-1100):

```typescript
async createMigrationPlanWithARK(
  analysis: any,
  repoPath: string,
  enhancedContext?: string  // ⭐ NEW PARAMETER
): Promise<{...}> {
  // Build comprehensive prompt for migration-planner
  let userMessage = `**MIGRATION PLANNING REQUEST**\n\n`;
  userMessage += `**Repository Path:** ${repoPath}\n`;
  userMessage += `**Framework:** ${analysis.framework || 'Unknown'}\n\n`;

  // Add enhanced context from retry-planner (if retrying)
  if (enhancedContext) {
    userMessage += `---\n${enhancedContext}\n---\n\n`;
    logger.info('✅ [MIGRATION-PLANNER] Enhanced context from retry-planner included');
  }
  ...
}
```

**Frontend Effect**:
- Migration-planner card shows **Running** again
- Logs show: "🔄 Using enhanced context from retry-planner for improved plan"

---

### 6. **PHASE 4: Regenerate Everything Fresh**

After migration-planner completes with improved plan:

```
Migration Planner (with enhanced context) ✅
  ↓
Service Generator (generates code with improved plan) ✅
  ↓
Frontend Migrator (generates MFEs with improved plan) ✅
  ↓
Unit Test Validator (validates again) ✅
  ↓
Integration Test Validator (validates again) ✅
  ↓
E2E Test Validator (validates again) ✅
```

**Expected Result**:
- ✅ Fewer errors (or ZERO errors!)
- ✅ If errors remain AND attempts < maxRetries → Retry loop again
- ✅ If ZERO errors → Migration completes successfully
- ❌ If maxRetries reached → Migration fails with errors

---

## Visual Workflow in Dashboard

### Agent Cards Status Flow

**Before Errors (First Attempt)**:
```
Code Analyzer: ✅ Completed
Migration Planner: ✅ Completed
Service Generator: ✅ Completed
Frontend Migrator: ✅ Completed
Unit Test Validator: ✅ Completed (with errors)
Integration Test Validator: ✅ Completed (with errors)
E2E Test Validator: ✅ Completed (with errors)
Retry Planner: ⏸ Pending (gray)
```

**During Retry Loop (Attempt 2)**:
```
Retry Planner: 🔄 Running (blue spinner) → Analyzing errors...
```

**After Retry Planner Analysis**:
```
Retry Planner: ✅ Completed (green) → Click to view analysis
Migration Planner: 🔄 Running (blue spinner) → Regenerating with fixes...
```

**Regeneration in Progress**:
```
Migration Planner: ✅ Completed (improved plan)
Service Generator: 🔄 Running (regenerating microservices)
Frontend Migrator: 🔄 Running (regenerating MFEs)
Unit Test Validator: 🔄 Running (re-validating)
Integration Test Validator: 🔄 Running (re-validating)
E2E Test Validator: 🔄 Running (re-validating)
```

**Success (Zero Errors)**:
```
All agents: ✅ Completed (green checkmarks)
🎉 Zero errors achieved!
```

---

## Arrow Connections

The workflow arrows show the retry feedback loop:

```
E2E Test Validator ──(amber dashed)──> Retry Planner
                                            │
                                            │ (emerald dashed)
                                            ↓
Migration Planner ←────────────────────────┘
```

- **Amber arrow**: Error detection (E2E → Retry Planner)
- **Emerald arrow**: Feedback loop (Retry → Migration Planner)
- **Both arrows route AROUND cards** (no crossing)

---

## Backend Files Modified

1. **`repoMigrationRoutes.ts`**:
   - Added `emitAgentStarted('retry-planner')` before analysis
   - Added `emitAgentCompleted('retry-planner', output)` after analysis
   - Stores enhanced context in migration object
   - Passes enhanced context to migration-planner on retry

2. **`arkChatService.ts`**:
   - Updated `createMigrationPlanWithARK()` to accept `enhancedContext` parameter
   - Includes enhanced context in ARK agent prompt when retrying

3. **`retryPlannerService.ts`**:
   - Already configured to call ARK `retry-planner` agent
   - Returns structured analysis with fixes

---

## Frontend Files Modified

1. **`dashboard/page.tsx`**:
   - Added retry-planner to `AGENT_CONFIGS`
   - Added retry-planner node to workflow (x=700, y=500)
   - Updated connections to show feedback loop

2. **SVG Arrow Rendering**:
   - Special paths for retry-planner connections
   - Amber dashed arrow (E2E → Retry Planner)
   - Emerald dashed arrow (Retry → Migration Planner)
   - Both route around cards

---

## Testing

**To test the complete flow**:

1. Start a migration that will have errors (e.g., missing dependencies)
2. Watch the dashboard:
   - Validators complete with errors
   - **Retry-planner agent starts** (card turns blue)
   - **Retry-planner agent completes** (card turns green)
   - **Migration-planner restarts** with enhanced context
   - **All agents regenerate** fresh
   - Validators run again with improved code
3. Expected: Fewer errors (or zero errors!)

---

## Status

✅ **Retry-planner agent tracking** - COMPLETE
✅ **Enhanced context passed to migration-planner** - COMPLETE
✅ **Migration-planner restarts with fixes** - COMPLETE
✅ **All subsequent steps regenerate** - COMPLETE
✅ **Frontend visualization** - COMPLETE
✅ **Arrow routing** - COMPLETE

**Ready to test!** 🚀
