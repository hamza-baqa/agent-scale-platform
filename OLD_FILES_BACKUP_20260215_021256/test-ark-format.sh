#!/bin/bash

# Test ARK service-generator output format

echo "Testing ARK service-generator format..."

RESPONSE=$(kubectl port-forward -n default svc/ark-api 8080:80 > /dev/null 2>&1 &
ARK_PID=$!
sleep 2

curl -s -X POST http://localhost:8080/openai/v1/chat/completions \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "agent/service-generator",
    "messages": [{
      "role": "user",
      "content": "Generate a minimal auth-service. Must include: 1 entity User.java, 1 controller AuthController.java, pom.xml. Use EXACT format: **auth-service/pom.xml:**\n```xml\ncode\n```"
    }]
  }' | jq -r '.choices[0].message.content')

kill $ARK_PID 2>/dev/null

echo "===== ARK RESPONSE ====="
echo "$RESPONSE"
echo ""
echo "===== CHECKING FOR SERVICE HEADERS ====="
echo "$RESPONSE" | grep -E "##.*service"
echo ""
echo "===== CHECKING FOR CODE BLOCKS ====="
echo "$RESPONSE" | grep -E "\*\*.*:\*\*"
