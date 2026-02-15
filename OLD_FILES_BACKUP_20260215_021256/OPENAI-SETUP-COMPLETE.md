# ✅ OpenAI ARK Setup - Ready to Deploy

## 📋 What Changed

I've switched all ARK agents from **Anthropic** model (incompatible) to **OpenAI GPT-4** model.

### Modified Files:
- ✅ `ark/models/openai-gpt4.yaml` - New OpenAI model configuration
- ✅ `ark/agents-ark/code-analyzer.yaml` - Updated to use openai-gpt4
- ✅ `ark/agents-ark/migration-planner.yaml` - Updated to use openai-gpt4
- ✅ `ark/agents-ark/service-generator.yaml` - Updated to use openai-gpt4
- ✅ `ark/agents-ark/frontend-migrator.yaml` - Updated to use openai-gpt4
- ✅ `ark/agents-ark/quality-validator.yaml` - Updated to use openai-gpt4

All agents now in `default` namespace for dashboard visibility.

## 🚀 Quick Deploy (2 Commands)

### Step 1: Create OpenAI API Key Secret

```bash
# Replace with your actual OpenAI API key
kubectl create secret generic openai-api-key \
  --from-literal=api-key="sk-YOUR_ACTUAL_KEY_HERE" \
  -n default
```

**Get your API key**: https://platform.openai.com/api-keys

### Step 2: Deploy Everything

```bash
./deploy-openai-ark.sh
```

This will:
1. ✅ Verify API key secret exists
2. ✅ Apply OpenAI model configuration
3. ✅ Delete old agents (using Anthropic model)
4. ✅ Deploy new agents (using OpenAI model)
5. ✅ Wait for agents to become available
6. ✅ Show agent status

## ⏱️ Expected Timeline

- **Model deployment**: ~5 seconds
- **Agent deployment**: ~5 seconds
- **Agent availability**: ~30-60 seconds
- **Total time**: ~1-2 minutes

## ✅ Success Indicators

After deployment, you should see:

```
NAME                 AVAILABLE   MODEL         AGE
code-analyzer        True        openai-gpt4   1m
frontend-migrator    True        openai-gpt4   1m
migration-planner    True        openai-gpt4   1m
quality-validator    True        openai-gpt4   1m
service-generator    True        openai-gpt4   1m
```

All agents showing **AVAILABLE True** ✅

## 🎯 What This Fixes

### Before (Anthropic Model):
```
❌ AVAILABLE False
Reason: "Invalid bearer token (401)"
Issue: ARK's OpenAI provider incompatible with Anthropic API
```

### After (OpenAI Model):
```
✅ AVAILABLE True
Model: openai-gpt4 (GPT-4o)
Status: Ready to accept requests
```

## 💰 Cost Estimate

OpenAI GPT-4o pricing:
- **Input**: ~$0.0025 per 1K tokens (4x cheaper than GPT-4)
- **Output**: ~$0.01 per 1K tokens (3x cheaper than GPT-4)

Per migration:
- Code analysis: $0.10-$0.50
- Planning: $0.20-$1.00
- Generation: $0.50-$2.00
- Validation: $0.20-$1.00

**Total per migration**: ~$1-$5 (much cheaper than GPT-4 Turbo)

## 🔍 Troubleshooting

### If agents don't become available:

```bash
# Check model status
kubectl get model openai-gpt4 -n default

# Check agent details
kubectl describe agent code-analyzer -n default

# Check ARK controller logs
kubectl logs -n ark-system -l app=ark-controller --tail=50
```

### If you see "secret not found":

```bash
# Verify secret exists
kubectl get secret openai-api-key -n default

# If not, create it
kubectl create secret generic openai-api-key \
  --from-literal=api-key="YOUR_KEY" \
  -n default
```

## 📊 Architecture

```
┌─────────────────────────────────────────┐
│         ARK Platform (Minikube)         │
├─────────────────────────────────────────┤
│                                         │
│  Model: openai-gpt4                     │
│  ├─ Provider: OpenAI                    │
│  ├─ Model: gpt-4o                       │
│  └─ API: api.openai.com/v1             │
│                                         │
│  Agents (all using openai-gpt4):        │
│  ├─ code-analyzer                       │
│  ├─ migration-planner                   │
│  ├─ service-generator                   │
│  ├─ frontend-migrator                   │
│  └─ quality-validator                   │
│                                         │
│  ARK Dashboard: localhost:3001          │
│  ARK API: localhost:8080                │
│                                         │
└─────────────────────────────────────────┘
```

## 🎉 Next Steps After Deployment

1. **Open ARK Dashboard**: http://localhost:3001
2. **Test an agent** by sending a chat request
3. **Start a migration** through the platform UI at http://localhost:3000
4. **Monitor agent activity** in the ARK dashboard

## 📝 Alternative: Use Mock ARK (Free)

If you prefer not to use OpenAI (no API costs), you can use Mock ARK:

```bash
# Stop ARK port forwarding
kill $(cat .run-pids/ark-port-forward.pid) 2>/dev/null || true

# Start Mock ARK (uses Anthropic API directly)
node mock-ark-service.js
```

Mock ARK works perfectly with Anthropic API and costs less ($0.001-$0.01 per migration).
