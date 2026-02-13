#!/bin/bash

echo "============================================"
echo "Starting Mock ARK Service"
echo "============================================"
echo ""

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  ANTHROPIC_API_KEY not set"
    echo ""
    read -p "Enter your Anthropic API key: " api_key
    if [ -z "$api_key" ]; then
        echo "❌ API key required to run Mock ARK"
        exit 1
    fi
    export ANTHROPIC_API_KEY=$api_key
fi

echo "✓ API key configured"
echo ""

# Start the mock service
echo "Starting Mock ARK on port 8080..."
echo ""
node mock-ark-service.js
