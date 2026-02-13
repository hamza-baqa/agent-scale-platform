# OpenAI Setup for ARK Agents

## Quick Setup

Run this command with your OpenAI API key:

```bash
kubectl create secret generic openai-api-key \
  --from-literal=api-key="YOUR_OPENAI_API_KEY_HERE" \
  -n default
```

Replace `YOUR_OPENAI_API_KEY_HERE` with your actual OpenAI API key (starts with `sk-`).

## Then Apply the Configuration

```bash
# 1. Apply the OpenAI model
kubectl apply -f ark/models/openai-gpt4.yaml

# 2. Delete old agents (they were using Anthropic model)
kubectl delete agent code-analyzer migration-planner service-generator frontend-migrator quality-validator -n default --ignore-not-found

# 3. Apply updated agents (now using OpenAI model)
kubectl apply -f ark/agents-ark/

# 4. Wait for agents to become available (takes 30-60 seconds)
kubectl get agents -n default -w
```

## Verify Setup

Check agent status:
```bash
kubectl get agents -n default
```

All agents should show `AVAILABLE True` after 30-60 seconds.

## Get Your OpenAI API Key

If you don't have an OpenAI API key:
1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Use it in the kubectl command above

## Alternative: Use Environment Variable

```bash
# Set your API key as environment variable
export OPENAI_API_KEY="sk-your-key-here"

# Create the secret
kubectl create secret generic openai-api-key \
  --from-literal=api-key="$OPENAI_API_KEY" \
  -n default
```

## Cost Estimate

OpenAI GPT-4 pricing (as of 2024):
- Input: ~$0.01 per 1K tokens
- Output: ~$0.03 per 1K tokens

For this migration platform:
- Code analysis: ~$0.50-$2 per repository
- Migration planning: ~$1-$3 per migration
- Code generation: ~$2-$5 per service

Estimated total per migration: **$5-$15**
