#!/bin/bash

echo "🚀 Starting a NEW migration to test real-time updates..."
echo ""
echo "📋 INSTRUCTIONS:"
echo "1. Open this URL in your browser RIGHT NOW:"
echo "   http://localhost:3000"
echo ""
echo "2. Press ENTER when browser is open..."
read

echo ""
echo "🔄 Starting migration..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/repo-migration \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/hamza-baqa/banque-app",
    "options": {
      "includeDocs": true,
      "includeTests": false
    }
  }')

MIGRATION_ID=$(echo "$RESPONSE" | jq -r '.migrationId // .id // "ERROR"')

if [ "$MIGRATION_ID" = "ERROR" ] || [ -z "$MIGRATION_ID" ]; then
  echo "❌ Failed to start migration"
  echo "$RESPONSE"
  exit 1
fi

echo ""
echo "✅ Migration started: $MIGRATION_ID"
echo ""
echo "🎯 NOW GO TO THIS URL TO SEE REAL-TIME UPDATES:"
echo ""
echo "   http://localhost:3000/dashboard?id=$MIGRATION_ID"
echo ""
echo "You should see:"
echo "  ⚡ Agents lighting up with animations"
echo "  📊 Logs appearing in real-time in the Logs tab"
echo "  🔄 Status changing: pending → running → completed"
echo ""
