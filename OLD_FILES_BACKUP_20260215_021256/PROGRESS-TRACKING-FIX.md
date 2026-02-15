# Progress Tracking Fix - Complete Guide

## THE PROBLEM

**Dashboard shows EMPTY because `migration.progress[]` array is never populated.**

- `repoMigrationRoutes.ts` emits WebSocket events (`emitAgentStarted`, `emitAgentCompleted`)
- But it NEVER saves agent status to `migration.progress` array
- Frontend dashboard reads from `migration.progress` to display agents
- Result: Dashboard always empty

## THE SOLUTION

Call `migrationService.updateAgentProgress()` alongside every `emitAgentStarted/emitAgentCompleted` call.

## EXACT IMPLEMENTATION

### Location: `platform/backend/src/routes/repoMigrationRoutes.ts`

### Pattern to Follow:

**BEFORE (broken):**
```typescript
emitAgentStarted(migrationId, 'agent-name');
// ... agent does work ...
emitAgentCompleted(migrationId, 'agent-name', output);
```

**AFTER (fixed):**
```typescript
emitAgentStarted(migrationId, 'agent-name');
migrationService.updateAgentProgress(migrationId, {
  agent: 'agent-name',
  status: 'running',
  timestamp: new Date().toISOString()
});

// ... agent does work ...

emitAgentCompleted(migrationId, 'agent-name', output);
migrationService.updateAgentProgress(migrationId, {
  agent: 'agent-name',
  status: 'completed',
  output: output,
  timestamp: new Date().toISOString()
});
```

## ALL LOCATIONS TO FIX

Search for these patterns in `repoMigrationRoutes.ts` and add `updateAgentProgress` after each:

### 1. Code Analyzer
**Line ~184:**
```typescript
emitAgentStarted(migrationId, 'code-analyzer');
// ADD THIS:
migrationService.updateAgentProgress(migrationId, {
  agent: 'code-analyzer',
  status: 'running',
  timestamp: new Date().toISOString()
});
```

**Line ~1125:**
```typescript
emitAgentCompleted(migrationId, 'code-analyzer', JSON.stringify(codeAnalyzerOutput));
// ADD THIS:
migrationService.updateAgentProgress(migrationId, {
  agent: 'code-analyzer',
  status: 'completed',
  output: JSON.stringify(codeAnalyzerOutput),
  timestamp: new Date().toISOString()
});
```

### 2. Migration Planner
**Line ~1134:** (start)
**Line ~1205:** (complete)

### 3. Service Generator
**Line ~1283:** (start)
**Line ~1405:** (complete)

### 4. Frontend Migrator
**Line ~1410:** (start)
**Line ~1500:** (complete)

### 5. Unit Test Validator
**Line ~1617:** (start)
**Line ~1653:** (complete)

### 6. Integration Test Validator
**Line ~1668:** (start)
**Line ~1731:** (complete)

### 7. E2E Test Validator
**Line ~1746:** (start)
**Line ~1809:** (complete)

### 8. Build Validator (NEW!)
**Line ~2407:** (start - IF you added build validator)
**Line ~2442:** (complete - IF you added build validator)

### 9. Container Deployer
**Line ~2407:** (start)
**Line ~2429:** (complete)

## ALTERNATIVE: Helper Functions (Cleaner)

Add these functions after line 41 in `repoMigrationRoutes.ts`:

```typescript
/**
 * Helper to start agent - emits WebSocket AND saves progress
 */
function trackAgentStart(migration: Migration, agentName: string): void {
  emitAgentStarted(migration.id, agentName);
  migrationService.updateAgentProgress(migration.id, {
    agent: agentName as any,
    status: 'running',
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper to complete agent - emits WebSocket AND saves progress
 */
function trackAgentComplete(migration: Migration, agentName: string, output?: string): void {
  emitAgentCompleted(migration.id, agentName, output);
  migrationService.updateAgentProgress(migration.id, {
    agent: agentName as any,
    status: 'completed',
    output: output,
    timestamp: new Date().toISOString()
  });
}
```

Then replace:
- `emitAgentStarted(migrationId, 'agent-name')` → `trackAgentStart(migration, 'agent-name')`
- `emitAgentCompleted(migrationId, 'agent-name', output)` → `trackAgentComplete(migration, 'agent-name', output)`

## DON'T FORGET

Also add `'build-validator'` to `AgentType` in `platform/backend/src/types/migration.types.ts`:

```typescript
export type AgentType =
  | 'code-analyzer'
  | 'migration-planner'
  | 'service-generator'
  | 'frontend-migrator'
  | 'unit-test-validator'
  | 'integration-test-validator'
  | 'e2e-test-validator'
  | 'build-validator'  // ← ADD THIS
  | 'container-deployer';
```

## HOW TO TEST

1. Apply the fix
2. Restart backend: `cd platform/backend && npm run dev`
3. Start a migration
4. Check progress array:
```bash
curl -s "http://localhost:4000/api/migrations/MIGRATION_ID" | jq '.progress | length'
```
5. Should be > 0 (not empty!)
6. Open dashboard: `http://localhost:3000/dashboard?id=MIGRATION_ID`
7. You should NOW see agent cards!

## WHY IT KEEPS BREAKING WHEN I TRY TO FIX IT

- Runtime errors from incorrect method calls
- TypeScript compilation issues
- Circular dependency risks
- Backend crashes during migration processing

## RECOMMENDATION

Apply this fix manually when you have time, test incrementally (one agent at a time), and verify backend doesn't crash before proceeding to the next agent.

I apologize for not being able to deliver a working fix. The codebase is complex and my automated fixes keep introducing errors.
