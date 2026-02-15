#!/bin/bash
# Test complet du bouton de téléchargement

set -e

echo "🧪 Testing Download Button Feature..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier services
echo "📋 Step 1: Checking services..."
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Frontend running${NC}"
else
  echo -e "${RED}❌ Frontend NOT running${NC}"
  exit 1
fi

if curl -s http://localhost:4000/health >/dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend running${NC}"
else
  echo -e "${RED}❌ Backend NOT running${NC}"
  exit 1
fi

echo ""

# 2. Créer migration
echo "📝 Step 2: Creating test migration..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/repo-migrations \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/example/test-banking-app",
    "sourceStack": {
      "language": "java",
      "framework": "spring-boot",
      "database": "postgresql"
    },
    "targetStack": {
      "backendFramework": "spring-boot-microservices",
      "frontendFramework": "angular-mfe",
      "database": "postgresql",
      "apiGateway": "spring-cloud-gateway"
    }
  }')

MIGRATION_ID=$(echo "$RESPONSE" | jq -r '.migrationId')

if [ "$MIGRATION_ID" = "null" ] || [ -z "$MIGRATION_ID" ]; then
  echo -e "${RED}❌ Failed to create migration${NC}"
  echo "$RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Migration created: $MIGRATION_ID${NC}"
echo ""

# 3. Attendre frontend-migrator
echo "⏳ Step 3: Waiting for frontend-migrator to complete..."
echo -e "${YELLOW}   This may take 2-5 minutes...${NC}"
echo ""

MAX_WAIT=600  # 10 minutes max
ELAPSED=0
SLEEP_INTERVAL=10

while [ $ELAPSED -lt $MAX_WAIT ]; do
  STATUS=$(curl -s http://localhost:4000/api/repo-migrations/$MIGRATION_ID 2>/dev/null | jq -r '.progress[] | select(.agent=="frontend-migrator") | .status' 2>/dev/null || echo "")

  if [ -z "$STATUS" ]; then
    echo "   ⏳ Waiting for frontend-migrator to start... (${ELAPSED}s)"
  elif [ "$STATUS" = "completed" ]; then
    echo -e "${GREEN}✅ Frontend Migrator completed!${NC}"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo -e "${RED}❌ Frontend Migrator failed!${NC}"
    exit 1
  else
    echo "   🔄 Status: $STATUS (${ELAPSED}s)"
  fi

  sleep $SLEEP_INTERVAL
  ELAPSED=$((ELAPSED + SLEEP_INTERVAL))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
  echo -e "${RED}❌ Timeout waiting for frontend-migrator${NC}"
  exit 1
fi

echo ""

# 4. Vérifier ZIP créé
echo "🔍 Step 4: Checking if ZIP was created..."
ZIP_PATH="outputs/${MIGRATION_ID}.zip"

if [ -f "$ZIP_PATH" ]; then
  SIZE=$(du -h "$ZIP_PATH" | cut -f1)
  echo -e "${GREEN}✅ ZIP file created: $ZIP_PATH ($SIZE)${NC}"
else
  echo -e "${RED}❌ ZIP file NOT found at: $ZIP_PATH${NC}"
  echo "   Checking outputs directory:"
  ls -la outputs/
  exit 1
fi

echo ""

# 5. Tester download endpoint
echo "📥 Step 5: Testing download endpoint..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:4000/api/migrations/$MIGRATION_ID/download")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Download endpoint working (HTTP $HTTP_CODE)${NC}"
else
  echo -e "${RED}❌ Download endpoint failed (HTTP $HTTP_CODE)${NC}"
  exit 1
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo "================================================"
echo ""
echo "📋 Migration Details:"
echo "   ID: $MIGRATION_ID"
echo "   ZIP: $ZIP_PATH"
echo "   Size: $(du -h "$ZIP_PATH" | cut -f1)"
echo ""
echo "🌐 Next Steps:"
echo "   1. Open: http://localhost:3000"
echo "   2. Click on the PINK 'Frontend Migrator' card"
echo "   3. Click the BIG GREEN button at the top"
echo "   4. Download will start: migration-${MIGRATION_ID}.zip"
echo ""
echo "💡 Or test directly:"
echo "   curl -O http://localhost:4000/api/migrations/$MIGRATION_ID/download"
echo ""
