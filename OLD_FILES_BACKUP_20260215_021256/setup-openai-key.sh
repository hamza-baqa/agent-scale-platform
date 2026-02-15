#!/bin/bash

echo "=========================================="
echo "OpenAI API Key Setup for ARK"
echo "=========================================="
echo ""
echo "Please enter your OpenAI API key (starts with sk-):"
read -s OPENAI_API_KEY
echo ""

if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ No API key provided. Exiting."
  exit 1
fi

if [[ ! "$OPENAI_API_KEY" =~ ^sk- ]]; then
  echo "⚠️  Warning: OpenAI API keys typically start with 'sk-'"
  echo "Do you want to continue anyway? (y/n)"
  read -r confirm
  if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 1
  fi
fi

echo "Creating Kubernetes secret..."
kubectl create secret generic openai-api-key \
  --from-literal=api-key="$OPENAI_API_KEY" \
  -n default

if [ $? -eq 0 ]; then
  echo "✅ OpenAI API key secret created successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Apply the OpenAI model: kubectl apply -f ark/models/openai-gpt4.yaml"
  echo "2. Update agents to use openai-gpt4 model"
  echo "3. Wait for agents to become available"
else
  echo "❌ Failed to create secret"
  exit 1
fi
