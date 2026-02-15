#!/bin/bash

echo "🧪 Testing Frontend File Analysis with Platform Frontend"
echo "================================================================"

# Test path - the platform frontend itself
TEST_REPO="/home/hbaqa/Desktop/Banque app 2/banque-app-transformed/platform/frontend"

echo ""
echo "📂 Test Repository: $TEST_REPO"
echo ""

# Call the backend API to analyze this repository
echo "📡 Calling backend API to analyze repository..."
echo ""

curl -s -X POST http://localhost:4000/api/repo-migration \
  -H "Content-Type: application/json" \
  -d "{
    \"repoUrl\": \"$TEST_REPO\",
    \"options\": {
      \"includeDocs\": true,
      \"includeTests\": false
    }
  }" | jq -r '.migrationId // .id // "ERROR"' > /tmp/migration-id.txt

MIGRATION_ID=$(cat /tmp/migration-id.txt)

if [ "$MIGRATION_ID" = "ERROR" ] || [ -z "$MIGRATION_ID" ]; then
  echo "❌ Failed to start migration"
  exit 1
fi

echo "✅ Migration started: $MIGRATION_ID"
echo ""
echo "📊 Watching backend logs for frontend file detection..."
echo "================================================================"
echo ""

# Watch the backend logs for 30 seconds
timeout 30 tail -f /home/hbaqa/Desktop/Banque\ app\ 2/banque-app-transformed/.run-pids/backend.log | grep -E "Found.*source files|frontend|backend|Calling ARK" --color=auto

echo ""
echo "================================================================"
echo ""
echo "Check the full migration at: http://localhost:3000/dashboard?id=$MIGRATION_ID"
echo ""
