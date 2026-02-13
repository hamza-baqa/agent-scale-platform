#!/bin/bash

# Setup script for AI-powered migration planning chat
# This script helps you configure Claude Opus 4.6 for intelligent migration assistance

echo "============================================"
echo "AI-Powered Migration Chat Setup"
echo "Using Claude Opus 4.6 (Most Advanced Model)"
echo "============================================"
echo ""

# Check if Anthropic SDK is installed
if ! grep -q "@anthropic-ai/sdk" platform/backend/package.json; then
    echo "[ERROR] Anthropic SDK not installed"
    echo "Running: npm install @anthropic-ai/sdk"
    cd platform/backend && npm install @anthropic-ai/sdk
    cd ../..
fi

# Check for API key in .env
if [ -f platform/backend/.env ]; then
    CURRENT_KEY=$(grep "ANTHROPIC_API_KEY=" platform/backend/.env | cut -d= -f2)

    if [ -n "$CURRENT_KEY" ] && [ "$CURRENT_KEY" != "your-api-key-here" ]; then
        echo "[SUCCESS] Anthropic API key already configured"
        echo "Current key: ${CURRENT_KEY:0:20}..."
        echo ""
        read -p "Do you want to update it? (y/N): " update
        if [ "$update" != "y" ] && [ "$update" != "Y" ]; then
            echo "Keeping existing key."
            exit 0
        fi
    fi
fi

echo ""
echo "To use AI-powered chat, you need an Anthropic API key."
echo ""
echo "Steps to get your API key:"
echo "1. Go to: https://console.anthropic.com/"
echo "2. Sign in or create an account"
echo "3. Navigate to 'API Keys'"
echo "4. Click 'Create Key'"
echo "5. Copy the key (starts with sk-ant-)"
echo ""

read -p "Do you have an API key? (y/N): " has_key

if [ "$has_key" != "y" ] && [ "$has_key" != "Y" ]; then
    echo ""
    echo "Please get an API key first, then run this script again."
    echo "Visit: https://console.anthropic.com/"
    exit 0
fi

echo ""
read -p "Enter your Anthropic API key: " api_key

if [ -z "$api_key" ]; then
    echo "[ERROR] No API key provided"
    exit 1
fi

# Validate key format
if [[ ! $api_key =~ ^sk-ant- ]]; then
    echo "[WARNING] API key doesn't start with 'sk-ant-'"
    echo "Are you sure this is correct?"
    read -p "Continue anyway? (y/N): " continue
    if [ "$continue" != "y" ] && [ "$continue" != "Y" ]; then
        exit 1
    fi
fi

# Update .env file
if grep -q "ANTHROPIC_API_KEY=" platform/backend/.env; then
    # Update existing line
    sed -i "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" platform/backend/.env
    echo "[SUCCESS] API key updated in .env file"
else
    # Add new line
    echo "" >> platform/backend/.env
    echo "# Anthropic API Key for AI-powered migration planning chat" >> platform/backend/.env
    echo "ANTHROPIC_API_KEY=$api_key" >> platform/backend/.env
    echo "[SUCCESS] API key added to .env file"
fi

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "The AI chat is now configured with Claude Opus 4.6"
echo ""
echo "Next steps:"
echo "1. Restart the backend:"
echo "   cd platform/backend"
echo "   npm run dev"
echo ""
echo "2. Open the migration planner in your browser"
echo ""
echo "3. Start chatting! Try asking:"
echo "   - 'Why did you create 5 microservices?'"
echo "   - 'Combine the auth and client services'"
echo "   - 'What are the best practices for this architecture?'"
echo ""
echo "Features:"
echo "- Intelligent responses using Opus 4.6"
echo "- Can modify your migration plan"
echo "- Automatically regenerates code when plan changes"
echo "- Maintains conversation context"
echo ""
echo "For more information, see: AI_CHAT_SETUP.md"
echo ""
