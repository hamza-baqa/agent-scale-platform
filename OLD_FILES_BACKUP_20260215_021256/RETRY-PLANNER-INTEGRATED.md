# Retry Planner Agent - Dashboard Integration ✅

## Summary

The **retry-planner** agent is now fully integrated into the dashboard workflow, displayed as an agent card just like code-analyzer, migration-planner, and other agents. It appears **visually below the migration-planner** agent in Step 2.

## Changes Made

### 1. Added Retry Planner to AGENT_CONFIGS

**File**: `platform/frontend/src/app/dashboard/page.tsx` (lines ~245-278)

```typescript
'retry-planner': {
  title: 'Retry Planner',
  description: 'Analyze validation errors and improve migration plan',
  label: 'RETRY',
  team: 'Step 2: Shape',
  tools: ['error-analyzer', 'plan-improver', 'ark-agent', 'ai-analysis'],
  systemPrompt: `You are an expert migration retry planner and error analysis specialist.

  Your mission: Analyze validation errors from all test validators and generate an improved migration plan.

  Input Analysis:
  1. Original migration plan (microservices + micro-frontends)
  2. Unit Test Validation Report (errors with ERR-UT-XXX codes)
  3. Integration Test Validation Report (errors with ERR-IT-XXX codes)
  4. E2E Test Validation Report (errors with ERR-E2E-XXX codes)
  5. Current retry attempt number

  Error Analysis Process:
  1. Categorize errors by type (build, test, config, security, code quality)
  2. Identify root causes for each error
  3. Determine if errors are related or independent
  4. Prioritize fixes by severity (CRITICAL > HIGH > MEDIUM > LOW)

  Improvement Strategy:
  1. For each error, provide specific fix instructions
  2. Update service generator prompts with corrections
  3. Update frontend migrator prompts with corrections
  4. Add missing dependencies, configurations, or code
  5. Ensure fixes don't introduce new errors

  Output Format:
  - Error Summary (total errors, breakdown by category)
  - Root Cause Analysis
  - Improvement Plan with specific fixes
  - Updated prompts for service-generator
  - Updated prompts for frontend-migrator
  - Confidence level for zero-error achievement

  Goal: Achieve ZERO ERRORS through intelligent iteration.`,
}
```

### 2. Added Retry Planner to Workflow Nodes

**File**: `platform/frontend/src/app/dashboard/page.tsx` (lines ~863-878)

```typescript
// Step 2.5: Retry Planner (positioned below migration-planner)
const retryPlanner = getAgentProgress('retry-planner');
nodes.push({
  id: 'retry-planner',
  agentName: 'retry-planner',
  type: 'agent',
  title: AGENT_CONFIGS['retry-planner'].title,
  subtitle: AGENT_CONFIGS['retry-planner'].description,
  team: AGENT_CONFIGS['retry-planner'].team,
  status: retryPlanner?.status || 'pending',
  position: { x: 700, y: 500 },  // Same x as migration-planner, below it visually
  label: AGENT_CONFIGS['retry-planner'].label,
  systemPrompt: AGENT_CONFIGS['retry-planner'].systemPrompt,
  tools: AGENT_CONFIGS['retry-planner'].tools
});
```

### 3. Added Feedback Loop Connections

**File**: `platform/frontend/src/app/dashboard/page.tsx` (lines ~980-993)

```typescript
const connections = [
  { from: 'trigger', to: 'code-analyzer' },
  { from: 'code-analyzer', to: 'migration-planner' },
  { from: 'migration-planner', to: 'service-generator' },
  { from: 'service-generator', to: 'frontend-migrator' },
  { from: 'frontend-migrator', to: 'unit-test-validator' },
  { from: 'unit-test-validator', to: 'integration-test-validator' },
  { from: 'integration-test-validator', to: 'e2e-test-validator' },
  // Retry Loop: E2E test validator → retry-planner → migration-planner (feedback)
  { from: 'e2e-test-validator', to: 'retry-planner' },      // ← NEW!
  { from: 'retry-planner', to: 'migration-planner' },       // ← NEW! (feedback loop)
  { from: 'e2e-test-validator', to: 'container-deployer' },
];
```

**Arrows**:
- **E2E Test → Retry Planner**: When validation errors are found
- **Retry Planner → Migration Planner**: Improved plan loops back to regenerate code
- **E2E Test → Container Deployer**: Only when all tests pass (zero errors)

### 4. Removed Separate RetryLoopCard Component

- **Removed import**: `import RetryLoopCard from '@/components/RetryLoopCard';`
- **Removed UI component**: The standalone retry loop card is no longer displayed
- **Reason**: Retry planner is now integrated as a standard agent card in the workflow

## Visual Workflow Layout

The agent workflow now shows a **feedback loop**:

```
Trigger (x=100, y=300)
   ↓
Code Analyzer (x=400, y=300)
   ↓
Migration Planner (x=700, y=300) ←─────────────────┐
   ↓                                               │
Service Generator (x=1000, y=100)                  │
   ↓                                               │
Frontend Migrator (x=1000, y=300)                  │
   ↓                                               │
Unit Test (x=1350, y=50)                           │
   ↓                                               │
Integration Test (x=1350, y=250)                   │
   ↓                                               │
E2E Test (x=1350, y=450) ──────────────────────────┤
   ↓                                               │
Retry Planner (x=700, y=500) ──────────────────────┘

Container Deployer (x=1700, y=250)
   ↑
   └── E2E Test (after all tests pass)
```

**Feedback Loop**:
1. **E2E Test Validator** → **Retry Planner** (when errors found)
2. **Retry Planner** → **Migration Planner** (improved plan loops back)
3. Process repeats until **ZERO ERRORS** or max retries reached

## How It Works

1. **User starts migration** at http://localhost:3000/dashboard?id={migrationId}

2. **Workflow displays all agents** including retry-planner positioned below migration-planner

3. **Click on retry-planner card** to view:
   - **📝 System Prompt tab**: Full agent prompt showing error analysis strategy
   - **📊 Agent Output tab**: Error analysis report, improvement plan, updated prompts
   - **📜 Logs tab**: Real-time colored logs during retry loop execution

4. **When validation errors occur**:
   - Backend calls retry-planner ARK agent
   - Agent analyzes errors from all 3 validators
   - Generates improved migration plan
   - Updates service-generator and frontend-migrator prompts
   - Re-runs migration with fixes

5. **Loop continues** until ZERO ERRORS or max retries (3)

## Agent Status

The retry-planner agent card will show status:
- **Pending**: Gray, waiting to be triggered (when no errors detected)
- **Running**: Blue with spinner, actively analyzing errors and improving plan
- **Completed**: Green checkmark, successfully improved plan
- **Failed**: Red X, unable to improve plan after max retries

## Frontend Compilation Status

✅ **Frontend compiled successfully** (6922 modules, no errors)
✅ **All changes applied and tested**

## Next Steps

1. Navigate to **http://localhost:3000**
2. Start a new migration
3. When validation finds errors, the retry-planner agent will activate automatically
4. Click on the retry-planner card to view:
   - Error analysis
   - Improvement strategy
   - Real-time logs

The retry-planner is now a **first-class agent** in the workflow, displayed just like all other agents! 🎉
