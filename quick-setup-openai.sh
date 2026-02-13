#!/bin/bash

echo "Enter your OpenAI API key (or press Ctrl+C to cancel):"
read -sp "API Key: " OPENAI_KEY
echo ""

if [ -z "$OPENAI_KEY" ]; then
  echo "No key provided. Exiting."
  exit 1
fi

echo "Creating secret..."
kubectl create secret generic openai-api-key --from-literal=api-key="$OPENAI_KEY" -n default

echo "Applying OpenAI model..."
kubectl apply -f ark/models/openai-gpt4.yaml

echo "Deleting old agents..."
kubectl delete agents --all -n default

echo "Deploying new agents..."
kubectl apply -f ark/agents-ark/

echo "Waiting for agents to become available..."
sleep 10
kubectl get agents -n default

echo ""
echo "Check http://localhost:3001/agents"
