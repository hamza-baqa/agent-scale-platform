# How to Change Models in ARK

## Why Can't I Change Models in the Dashboard?

The ARK Dashboard (http://localhost:3001) is **read-only** for model configuration. This is intentional for safety and consistency. Models are Kubernetes Custom Resources that must be changed via:
- ✅ kubectl commands
- ✅ YAML configuration files
- ❌ NOT via the dashboard UI

## Current Models

You have 2 models configured:

| Name | Provider | Model | Speed | Status |
|------|----------|-------|-------|--------|
| **default** | OpenAI | gpt-4o-mini | Slow | ⚠️ Not recommended for production |
| **gpt** | Azure | gpt-4o | Fast | ✅ **Recommended** (2-3x faster) |

## Option 1: Change Which Model an Agent Uses

Each agent references a model. To change which model an agent uses:

### Method A: Edit YAML File (Recommended)

```bash
# 1. Edit the agent file
nano ark/agents/migration-planner.yaml

# 2. Find and change the modelRef section:
spec:
  modelRef:
    name: gpt      # Change to: gpt or default

# 3. Apply changes
kubectl delete agent migration-planner -n default
kubectl create -f ark/agents/migration-planner.yaml

# 4. Verify
kubectl get agent migration-planner -n default
```

### Method B: Use kubectl patch (Quick)

```bash
# Switch to 'gpt' model (recommended - faster)
kubectl patch agent migration-planner -n default --type=merge \
  -p '{"spec":{"modelRef":{"name":"gpt"}}}'

# Or switch to 'default' model
kubectl patch agent migration-planner -n default --type=merge \
  -p '{"spec":{"modelRef":{"name":"default"}}}'

# Verify the change
kubectl get agent migration-planner -n default -o yaml | grep "modelRef:" -A2
```

### Method C: Bulk Update All Agents

```bash
# Switch ALL agents to use 'gpt' model
for agent in code-analyzer migration-planner service-generator frontend-migrator \
             unit-test-validator integration-test-validator e2e-test-validator; do
  echo "Updating $agent..."
  kubectl patch agent $agent -n default --type=merge \
    -p '{"spec":{"modelRef":{"name":"gpt"}}}'
done

# Verify
kubectl get agents -n default -o custom-columns=NAME:.metadata.name,MODEL:.spec.modelRef.name
```

## Option 2: Change Model Configuration

If you want to change what "default" or "gpt" models point to:

### Change the 'default' Model to Use gpt-4o Instead of gpt-4o-mini

```bash
# 1. Edit the model
kubectl edit model default -n default

# 2. Find and change:
spec:
  model:
    value: gpt-4o-mini    # Change to: gpt-4o

# 3. Save and exit (:wq in vim)

# 4. Verify
kubectl get model default -n default -o yaml | grep "value:"
```

### Change the 'gpt' Model to Use a Different Azure Deployment

```bash
# 1. Edit the model
kubectl edit model gpt -n default

# 2. Change the Azure configuration:
spec:
  model:
    value: gpt-4o           # Change model name
  config:
    azure:
      baseUrl:
        value: https://YOUR-DEPLOYMENT.openai.azure.com/
      apiVersion:
        value: 2024-12-01-preview

# 3. Save and exit
```

## Option 3: Create a New Model

```bash
cat <<EOF | kubectl apply -f -
apiVersion: ark.mckinsey.com/v1alpha1
kind: Model
metadata:
  name: my-custom-model
  namespace: default
spec:
  provider: openai
  model:
    value: gpt-4-turbo      # Or gpt-4o, gpt-3.5-turbo, etc.
  config:
    openai:
      baseUrl:
        value: "https://api.openai.com/v1"
      apiKey:
        valueFrom:
          secretKeyRef:
            name: openai-secret
            key: token
EOF

# Verify
kubectl get models -n default
```

Then update agents to use this model:
```bash
kubectl patch agent migration-planner -n default --type=merge \
  -p '{"spec":{"modelRef":{"name":"my-custom-model"}}}'
```

## View Models in ARK Dashboard

While you can't **edit** models in the dashboard, you can **view** them:

1. Open: http://localhost:3001
2. Click "Models" in the sidebar
3. View model configurations, status, and which agents use them

## Check Which Agent Uses Which Model

```bash
# List all agents and their models
kubectl get agents -n default -o custom-columns=\
NAME:.metadata.name,\
MODEL:.spec.modelRef.name,\
AVAILABLE:.status.conditions[0].status

# Example output:
# NAME                         MODEL     AVAILABLE
# code-analyzer                gpt       True
# migration-planner            gpt       True
# service-generator            default   True
```

## Recommended Configuration

For best performance, use the **gpt** model (Azure gpt-4o) for all agents:

```bash
# Quick setup: Switch all agents to gpt model
for agent in $(kubectl get agents -n default --no-headers | awk '{print $1}'); do
  kubectl patch agent $agent -n default --type=merge \
    -p '{"spec":{"modelRef":{"name":"gpt"}}}'
done

# Verify
kubectl get agents -n default -o custom-columns=NAME:.metadata.name,MODEL:.spec.modelRef.name
```

## Why gpt-4o is Better

| Feature | gpt-4o-mini (default) | gpt-4o (gpt) |
|---------|----------------------|--------------|
| Speed | Slow (5+ min) | Fast (2-3 min) |
| Quality | Basic | Excellent |
| Complex Tasks | Struggles | Handles easily |
| Cost per 1K tokens | $0.150 | $0.250 |
| **Recommendation** | ❌ Avoid | ✅ **Use this!** |

## Troubleshooting

### "Error: unable to update model"
- **Cause**: ARK webhook not ready or model in use
- **Solution**: Wait 30 seconds, then try again

### "Model not found"
- **Cause**: Model doesn't exist or wrong namespace
- **Solution**: Check available models:
  ```bash
  kubectl get models -n default
  ```

### "Agent still using old model"
- **Cause**: Agent not restarted
- **Solution**: Restart the platform:
  ```bash
  ./STOP-ALL.sh
  ./RUN-SIMPLE.sh
  ```

## Summary

✅ **To change which model an agent uses**: Edit agent YAML or use `kubectl patch`
✅ **To change model configuration**: Use `kubectl edit model <name>`
✅ **To view models**: Use ARK Dashboard or `kubectl get models`
❌ **Cannot**: Change models through the dashboard UI (by design)

---

**Last Updated**: 2026-02-13
**Status**: Both default and gpt models available and working
