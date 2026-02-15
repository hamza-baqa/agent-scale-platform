# Agent Reset - Fresh Restart Flow ✅

## Overview

When retry-planner provides a new adjusted prompt, **all agents from migration-planner onwards reset to "pending"** and restart fresh, as if it's the first time.

## Complete Flow

### 1. **Retry-Planner Completes Analysis**

```typescript
// Retry-planner analyzes errors and generates adjusted prompt
const improvement = await retryPlannerService.analyzeAndImprove({...});

// Complete retry-planner agent
emitAgentCompleted(migrationId, 'retry-planner', retryPlannerOutput);
```

### 2. **Reset All Agents to Pending** ⭐ **NEW!**

**Backend Code** (`repoMigrationRoutes.ts` lines ~2005-2035):

```typescript
// Reset all agents to pending (they will execute again from scratch)
const agentsToReset = [
  'migration-planner',      // ← Reset to pending
  'service-generator',       // ← Reset to pending
  'frontend-migrator',       // ← Reset to pending
  'unit-test-validator',     // ← Reset to pending
  'integration-test-validator', // ← Reset to pending
  'e2e-test-validator',      // ← Reset to pending
  'container-deployer'       // ← Reset to pending
];

// Update agent progress in database - set all to pending
migration.agentProgress = migration.agentProgress.map((progress: any) => {
  if (agentsToReset.includes(progress.agentName)) {
    return {
      ...progress,
      status: 'pending',  // ← Status changed from "completed" to "pending"
      output: '',          // ← Clear previous output
      updatedAt: new Date()
    };
  }
  return progress;
});

// Emit reset events to frontend
for (const agentName of agentsToReset) {
  emitAgentReset(migrationId, agentName);  // ← Notify frontend ⭐
  emitAgentLog(migrationId, agentName, 'info', '🔄 Reset to pending - will restart fresh');
}
```

**What Gets Reset**:
- ✅ **Status**: `completed` → `pending`
- ✅ **Output**: Cleared (empty string)
- ✅ **UpdatedAt**: Set to current time

**What DOESN'T Get Reset**:
- ❌ **code-analyzer**: Keeps "completed" status (no need to re-analyze source code)
- ❌ **retry-planner**: Keeps "completed" status (just finished analyzing)

### 3. **Frontend Receives Reset Events** ⭐ **NEW!**

**WebSocket Event** (`websocketHandler.ts`):
```typescript
export const emitAgentReset = (migrationId: string, agent: string) => {
  ioInstance.to(`migration-${migrationId}`).emit('agent-reset', {
    migrationId,
    agent,
    timestamp: new Date().toISOString()
  });
};
```

**Frontend Handler** (`dashboard/page.tsx`):
```typescript
const handleAgentReset = (data: any) => {
  if (data.migrationId === migrationId) {
    console.log('🔄 Agent reset to pending:', data.agent);
    addActivity('info', data.agent, `🔄 Agent ${data.agent} reset to pending - restarting fresh`);
    setMigration((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        progress: updateAgentProgress(prev.progress, data.agent, 'pending', ''),
      };
    });
  }
};

// Subscribe to reset events
websocketService.on('agent-reset', handleAgentReset);
```

**Visual Effect**:
- Agent cards change from **✅ Completed (green)** → **⏸ Pending (gray)**
- Activity feed shows: "🔄 Agent {name} reset to pending - restarting fresh"

### 4. **Migration-Planner Starts Fresh**

After all agents are reset:

```typescript
// Restart migration-planner with adjusted prompt
emitAgentStarted(migrationId, 'migration-planner');

const adjustedPrompt = improvement.adjustedMigrationPlannerPrompt;
const plannerResult = await arkChatService.createMigrationPlanWithARK(
  analysis,
  actualRepoPath,
  adjustedPrompt  // ← Uses new adjusted prompt
);
```

**Status Changes**:
- Migration-planner: `pending` → **`running`** (blue spinner)
- Other agents: Stay `pending` (gray)

### 5. **Complete Fresh Execution**

The entire workflow executes fresh from migration-planner:

```
Code Analyzer ✅ (stays completed - NOT reset)
   ↓
Retry Planner ✅ (stays completed - just finished)
   ↓
Migration Planner ⏸ → 🔄 (pending → running with adjusted prompt)
   ↓
Service Generator ⏸ → 🔄 (pending → running when migration-planner completes)
   ↓
Frontend Migrator ⏸ → 🔄 (pending → running when service-generator completes)
   ↓
Unit Test Validator ⏸ → 🔄 (pending → running when frontend-migrator completes)
   ↓
Integration Test Validator ⏸ → 🔄 (pending → running when unit-test completes)
   ↓
E2E Test Validator ⏸ → 🔄 (pending → running when integration-test completes)
   ↓
Container Deployer ⏸ → 🔄 (pending → running when e2e-test completes)
```

**Result**: Everything regenerates fresh, like the first time!

---

## Visual Timeline

### Before Reset (After Errors Found)

```
✅ Code Analyzer: Completed
✅ Migration Planner: Completed
✅ Service Generator: Completed (with errors)
✅ Frontend Migrator: Completed (with errors)
✅ Unit Test Validator: Completed (25 errors)
✅ Integration Test Validator: Completed (15 errors)
✅ E2E Test Validator: Completed (10 errors)
⏸ Container Deployer: Pending
🔄 Retry Planner: Running → Analyzing errors...
```

### After Retry-Planner Completes

```
✅ Code Analyzer: Completed (NOT RESET)
✅ Retry Planner: Completed (just finished analysis)
⏸ Migration Planner: Pending ← RESET ✅
⏸ Service Generator: Pending ← RESET ✅
⏸ Frontend Migrator: Pending ← RESET ✅
⏸ Unit Test Validator: Pending ← RESET ✅
⏸ Integration Test Validator: Pending ← RESET ✅
⏸ E2E Test Validator: Pending ← RESET ✅
⏸ Container Deployer: Pending ← RESET ✅
```

### During Fresh Execution

```
✅ Code Analyzer: Completed
✅ Retry Planner: Completed
🔄 Migration Planner: Running (with adjusted prompt)
⏸ Service Generator: Pending (waiting)
⏸ Frontend Migrator: Pending (waiting)
⏸ Unit Test Validator: Pending (waiting)
⏸ Integration Test Validator: Pending (waiting)
⏸ E2E Test Validator: Pending (waiting)
⏸ Container Deployer: Pending (waiting)
```

### After Migration-Planner Completes

```
✅ Code Analyzer: Completed
✅ Retry Planner: Completed
✅ Migration Planner: Completed (improved plan)
🔄 Service Generator: Running (generating with improved plan)
⏸ Frontend Migrator: Pending (waiting)
⏸ Unit Test Validator: Pending (waiting)
⏸ Integration Test Validator: Pending (waiting)
⏸ E2E Test Validator: Pending (waiting)
⏸ Container Deployer: Pending (waiting)
```

... and so on until all agents complete.

---

## Activity Feed Messages

When agents reset, the activity feed shows:

```
🔄 Agent migration-planner reset to pending - restarting fresh
🔄 Agent service-generator reset to pending - restarting fresh
🔄 Agent frontend-migrator reset to pending - restarting fresh
🔄 Agent unit-test-validator reset to pending - restarting fresh
🔄 Agent integration-test-validator reset to pending - restarting fresh
🔄 Agent e2e-test-validator reset to pending - restarting fresh
🔄 Agent container-deployer reset to pending - restarting fresh
```

---

## Files Modified

### Backend

1. **`websocket/websocketHandler.ts`**:
   - Added `emitAgentReset()` function
   - Emits 'agent-reset' event to notify frontend

2. **`routes/repoMigrationRoutes.ts`**:
   - Added import for `emitAgentReset`
   - Resets agent statuses in database before restarting
   - Emits reset events for each agent
   - Logs reset operations

### Frontend

1. **`services/websocketService.ts`**:
   - Added listener for 'agent-reset' event
   - Emits to internal listeners

2. **`app/dashboard/page.tsx`**:
   - Added `handleAgentReset()` function
   - Subscribes to 'agent-reset' event
   - Updates agent status to 'pending' in UI
   - Clears previous output
   - Adds activity feed message

---

## Benefits

✅ **Clear Visual Feedback**: Users see agents reset from completed → pending
✅ **Fresh Start**: All agents execute from scratch with improved plan
✅ **No Confusion**: Clear distinction between first attempt and retry
✅ **Transparent**: Activity feed shows which agents were reset
✅ **Efficient**: Code-analyzer NOT reset (no need to re-analyze source)

---

## Testing

**To test the reset flow**:

1. Start a migration that will have errors
2. Wait for validators to complete with errors
3. Retry-planner analyzes and completes
4. **Watch the dashboard**:
   - All agent cards from migration-planner onwards change to gray (pending)
   - Activity feed shows reset messages
   - Migration-planner starts running again (blue spinner)
5. Watch all agents execute fresh in sequence
6. Expect better results (fewer errors)!

---

## Status

✅ **Backend agent reset logic** - COMPLETE
✅ **WebSocket reset events** - COMPLETE
✅ **Frontend reset handling** - COMPLETE
✅ **Visual status updates** - COMPLETE
✅ **Activity feed messages** - COMPLETE
✅ **Frontend compiled successfully** - COMPLETE

**Ready to test the fresh restart!** 🚀
