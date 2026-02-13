#!/bin/bash

# Quick test to verify folder structure is correct

echo "🧪 Testing Folder Structure Fix"
echo "================================"
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "❌ Backend not running!"
  echo "Run: cd platform/backend && npm run dev"
  exit 1
fi

echo "✅ Backend is ready"
echo ""

# Create a test migration
echo "📤 Creating test migration..."

RESPONSE=$(curl -s -X POST http://localhost:3001/api/repo-migrations/upload \
  -F "repoUrl=https://github.com/example/test-repo" \
  -F "name=test-structure" \
  -F "description=Testing folder structure")

MIGRATION_ID=$(echo "$RESPONSE" | jq -r '.migrationId')

if [ "$MIGRATION_ID" = "null" ] || [ -z "$MIGRATION_ID" ]; then
  echo "❌ Failed to create migration"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Migration created: $MIGRATION_ID"
echo ""

# Wait a bit for migration to process
echo "⏳ Waiting for migration to complete (this may take a few minutes)..."
sleep 120

# Check workspace folder structure
WORKSPACE_DIR="/home/hbaqa/Desktop/Banque app 2/banque-app-transformed/workspace/$MIGRATION_ID/output"

if [ ! -d "$WORKSPACE_DIR" ]; then
  echo "⚠️  Workspace not created yet, waiting longer..."
  sleep 60
fi

echo ""
echo "📁 Checking folder structure..."
echo ""

if [ -d "$WORKSPACE_DIR/backend" ]; then
  echo "✅ backend/ folder exists (CORRECT!)"
  ls -la "$WORKSPACE_DIR/backend/" | head -10
else
  echo "❌ backend/ folder NOT found"
fi

echo ""

if [ -d "$WORKSPACE_DIR/frontend" ]; then
  echo "✅ frontend/ folder exists (CORRECT!)"
  ls -la "$WORKSPACE_DIR/frontend/" | head -10
else
  echo "❌ frontend/ folder NOT found"
fi

echo ""

if [ -d "$WORKSPACE_DIR/microservices" ]; then
  echo "⚠️  microservices/ folder exists (OLD NAME - SHOULD BE backend/)"
fi

if [ -d "$WORKSPACE_DIR/micro-frontends" ]; then
  echo "⚠️  micro-frontends/ folder exists (OLD NAME - SHOULD BE frontend/)"
fi

echo ""
echo "================================"
echo "Test complete!"
