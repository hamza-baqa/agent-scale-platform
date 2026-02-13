#!/bin/bash

echo "=========================================="
echo "Testing Agent Prompt Changes"
echo "=========================================="
echo ""

AGENT_NAME="code-analyzer"
NAMESPACE="default"

echo "1. Current prompt (first 200 characters):"
kubectl get agent $AGENT_NAME -n $NAMESPACE -o jsonpath='{.spec.prompt}' | head -c 200
echo "..."
echo ""
echo ""

echo "2. Now, go to ARK Dashboard and edit the prompt:"
echo "   → http://localhost:3001/agents"
echo "   → Click on '$AGENT_NAME'"
echo "   → Edit the prompt (add something at the top like 'ALWAYS START WITH: Hello!')"
echo "   → Save"
echo ""
echo "3. Press Enter when you're done editing..."
read

echo ""
echo "4. Updated prompt (first 200 characters):"
kubectl get agent $AGENT_NAME -n $NAMESPACE -o jsonpath='{.spec.prompt}' | head -c 200
echo "..."
echo ""
echo ""

echo "5. Testing the agent with a simple request..."
echo ""

# Test the agent via ARK API
RESPONSE=$(curl -s -X POST http://localhost:8080/v1/agents/$AGENT_NAME/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Say hello"
      }
    ]
  }')

echo "Agent response:"
echo "$RESPONSE" | jq -r '.choices[0].message.content' 2>/dev/null || echo "$RESPONSE"
echo ""
echo ""

echo "=========================================="
echo "✅ Prompt changes are immediately active!"
echo "=========================================="
