# Agent Prompt Editing - How It Works

## What Happens When You Edit an Agent Prompt?

```
┌─────────────────────────────────────────────────────────┐
│                    ARK Dashboard                         │
│                  http://localhost:3001                   │
│                                                          │
│  You edit agent prompt in the UI → Click "Save"         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│              Kubernetes API (Minikube)                   │
│                                                          │
│  Agent resource updated with new prompt                 │
│  kubectl get agent code-analyzer -o yaml                │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│                  ARK Controller                          │
│                                                          │
│  Detects change → Validates → Marks agent as available  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────┐
│           Migration Platform Backend                     │
│              http://localhost:4000                       │
│                                                          │
│  Calls agent → ARK uses NEW PROMPT → Returns response   │
└─────────────────────────────────────────────────────────┘
```

## Impact of Prompt Changes

### ✅ What WILL Change:
- **Agent behavior**: The agent will follow the new instructions
- **Agent responses**: Responses will reflect the new prompt
- **Migration results**: If you edit migration-planner, plans will change
- **Code generation**: If you edit service-generator, generated code will change

### ❌ What WON'T Change:
- **Dashboard UI**: The dashboard interface stays the same
- **Other agents**: Only the edited agent is affected
- **Previous responses**: Past migrations/responses are unchanged

## Example Scenarios

### Scenario 1: Make code-analyzer more detailed

**Original prompt:**
```
You are a code analysis expert...
```

**Updated prompt:**
```
You are a code analysis expert. ALWAYS include:
1. Detailed entity relationship diagrams
2. Complete API endpoint documentation
3. Security vulnerability assessment
...
```

**Result:** Code analysis will be MORE detailed and comprehensive.

---

### Scenario 2: Change migration-planner strategy

**Original prompt:**
```
Create a detailed migration plan that includes:
- Auth Service
- Client Service
- Account Service
...
```

**Updated prompt:**
```
Create a detailed migration plan with MONOREPO structure:
- Single repository with multiple services
- Shared libraries for common code
- Unified build system
...
```

**Result:** Migration plans will use monorepo pattern instead of separate services.

---

### Scenario 3: Customize service-generator output

**Original prompt:**
```
Generate production-ready microservices code...
```

**Updated prompt:**
```
Generate production-ready microservices code with:
- Swagger UI enabled by default
- Actuator endpoints for health checks
- Lombok for reducing boilerplate
- MapStruct for DTO mapping
...
```

**Result:** Generated Spring Boot code will include these additional features.

## How to Test Your Changes

### Option 1: Quick Test via Script

```bash
./test-agent-prompt-change.sh
```

This will:
1. Show current prompt
2. Wait for you to edit in dashboard
3. Show updated prompt
4. Test the agent with a simple request

### Option 2: Test via Migration Platform

1. Edit agent prompt in ARK Dashboard
2. Start a new migration at http://localhost:3000
3. Observe the changes in agent behavior

### Option 3: Test via ARK API Directly

```bash
# Test code-analyzer agent
curl -X POST http://localhost:8080/v1/agents/code-analyzer/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Analyze this code: class User { String name; }"
      }
    ]
  }' | jq '.choices[0].message.content'
```

## Best Practices for Prompt Editing

### ✅ DO:
- **Test changes**: Always test after editing prompts
- **Be specific**: Clear instructions = better results
- **Use examples**: Show the agent what you want
- **Version control**: Keep a backup of working prompts (export from dashboard)
- **Iterate**: Make small changes and test

### ❌ DON'T:
- **Make drastic changes**: Small iterations work better
- **Forget context**: Agents need context about the migration workflow
- **Remove critical requirements**: Keep core functionality intact
- **Ignore validation**: Bad prompts = bad results

## Reverting Changes

If you want to go back to the original prompt:

```bash
# Revert to original YAML
kubectl apply -f ark/agents-ark/code-analyzer.yaml
```

Or edit in the dashboard and paste the original prompt from:
`ark/agents-ark/code-analyzer.yaml`

## Advanced: Edit via kubectl

You can also edit directly via command line:

```bash
# Edit agent prompt
kubectl edit agent code-analyzer -n default

# Or update from file
kubectl apply -f ark/agents-ark/code-analyzer.yaml
```

## Monitoring Changes

Check when an agent was last updated:

```bash
kubectl get agent code-analyzer -n default -o jsonpath='{.metadata.managedFields[0].time}'
```

View full agent configuration:

```bash
kubectl get agent code-analyzer -n default -o yaml
```

## Summary

**Yes**, editing agent prompts in the ARK Dashboard **immediately affects agent behavior**!

- Changes are saved to Kubernetes
- Agents use the new prompt right away
- Your migration platform will use the updated agents
- No restart needed - changes are live!

This makes it easy to:
- Customize agents for your specific needs
- Improve results through iteration
- Experiment with different strategies
- Fine-tune code generation quality
