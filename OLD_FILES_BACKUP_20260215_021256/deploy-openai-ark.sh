#!/bin/bash

set -e

echo "=========================================="
echo "Deploying ARK with OpenAI Model"
echo "=========================================="
echo ""

# Check if secret exists
echo "1. Checking for OpenAI API key secret..."
if ! kubectl get secret openai-api-key -n default &> /dev/null; then
  echo "❌ OpenAI API key secret not found!"
  echo ""
  echo "Please create it first:"
  echo "kubectl create secret generic openai-api-key \\"
  echo "  --from-literal=api-key=\"YOUR_OPENAI_API_KEY\" \\"
  echo "  -n default"
  echo ""
  echo "Get your API key from: https://platform.openai.com/api-keys"
  exit 1
fi
echo "✅ OpenAI API key secret found"
echo ""

# Apply OpenAI model
echo "2. Applying OpenAI model configuration..."
kubectl apply -f ark/models/openai-gpt4.yaml
echo "✅ OpenAI model created"
echo ""

# Delete old agents (using old namespace or old model)
echo "3. Deleting old agents..."
kubectl delete agent code-analyzer migration-planner service-generator frontend-migrator quality-validator -n default --ignore-not-found 2>/dev/null || true
kubectl delete agent code-analyzer migration-planner service-generator frontend-migrator quality-validator -n banque-migration --ignore-not-found 2>/dev/null || true
echo "✅ Old agents deleted"
echo ""

# Apply new agents
echo "4. Deploying updated agents..."
kubectl apply -f ark/agents-ark/
echo "✅ Agents deployed"
echo ""

# Wait for agents to become available
echo "5. Waiting for agents to become available..."
echo "   (This takes 30-60 seconds)"
echo ""

sleep 5

for i in {1..12}; do
  echo "   Check $i/12..."

  # Get agent status
  AVAILABLE=$(kubectl get agents -n default -o json | jq -r '.items[] | select(.status.conditions[]?.type == "Available") | select(.status.conditions[]?.status == "True") | .metadata.name' 2>/dev/null | wc -l)
  TOTAL=$(kubectl get agents -n default --no-headers 2>/dev/null | wc -l)

  echo "   Available: $AVAILABLE/$TOTAL agents"

  if [ "$AVAILABLE" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
    echo ""
    echo "✅ All agents are available!"
    echo ""
    kubectl get agents -n default
    echo ""
    echo "=========================================="
    echo "🎉 ARK Setup Complete!"
    echo "=========================================="
    echo ""
    echo "ARK Dashboard: http://localhost:3001"
    echo ""
    echo "Your agents:"
    echo "  - code-analyzer: Analyzes source code"
    echo "  - migration-planner: Plans microservices decomposition"
    echo "  - service-generator: Generates Spring Boot services"
    echo "  - frontend-migrator: Generates Angular micro-frontends"
    echo "  - quality-validator: Validates generated code"
    echo ""
    exit 0
  fi

  sleep 5
done

echo ""
echo "⚠️  Agents are taking longer than expected to become available"
echo ""
echo "Current status:"
kubectl get agents -n default
echo ""
echo "Check agent details:"
echo "kubectl describe agent code-analyzer -n default"
echo ""
echo "Check model status:"
kubectl get model openai-gpt4 -n default
