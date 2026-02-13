#!/bin/bash

# COMPLETE CODE GENERATION TEST
# Tests the entire pipeline: ARK agents → extraction → ZIP creation
# Verifies COMPLETE code is generated for microservices + micro-frontends

set -e

echo "🧪 COMPLETE CODE GENERATION TEST"
echo "=================================="
echo ""

# Configuration
SOURCE_REPO="/home/hbaqa/Desktop/banque-app-main"
API_URL="http://localhost:3001/api"
WORKSPACE_DIR="/home/hbaqa/Desktop/Banque app 2/banque-app-transformed/workspace"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if [ ! -d "$SOURCE_REPO" ]; then
  echo -e "${RED}❌ Source repository not found at $SOURCE_REPO${NC}"
  exit 1
fi

if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo -e "${RED}❌ Backend not running at http://localhost:3001${NC}"
  echo "Run: cd platform/backend && npm run dev"
  exit 1
fi

if ! kubectl get agents -n default > /dev/null 2>&1; then
  echo -e "${RED}❌ ARK agents not available${NC}"
  echo "Run: ./RUN-SIMPLE.sh"
  exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Step 1: Upload source repository
echo "📤 Step 1: Uploading source repository..."

UPLOAD_RESPONSE=$(curl -s -X POST "$API_URL/repo-migrations/upload" \
  -F "file=@$SOURCE_REPO" \
  -F "name=banque-app" \
  -F "description=Test migration for complete code generation")

MIGRATION_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.migrationId')

if [ "$MIGRATION_ID" = "null" ] || [ -z "$MIGRATION_ID" ]; then
  echo -e "${RED}❌ Failed to upload repository${NC}"
  echo "$UPLOAD_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Repository uploaded: $MIGRATION_ID${NC}"
echo ""

# Step 2: Start migration
echo "🚀 Step 2: Starting migration..."

curl -s -X POST "$API_URL/repo-migrations/$MIGRATION_ID/start" > /dev/null

echo -e "${GREEN}✅ Migration started${NC}"
echo ""

# Step 3: Monitor migration progress
echo "📊 Step 3: Monitoring migration progress..."
echo ""

TIMEOUT=600  # 10 minutes
ELAPSED=0

while [ $ELAPSED -lt $TIMEOUT ]; do
  STATUS_RESPONSE=$(curl -s "$API_URL/repo-migrations/$MIGRATION_ID")
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
  CURRENT_STEP=$(echo "$STATUS_RESPONSE" | jq -r '.currentStep')

  echo -e "${YELLOW}Status: $STATUS | Step: $CURRENT_STEP${NC}"

  if [ "$STATUS" = "completed" ]; then
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    break
  fi

  if [ "$STATUS" = "failed" ] || [ "$STATUS" = "paused" ]; then
    echo -e "${RED}❌ Migration failed or paused${NC}"
    echo "$STATUS_RESPONSE" | jq '.error'
    exit 1
  fi

  sleep 10
  ELAPSED=$((ELAPSED + 10))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
  echo -e "${RED}❌ Migration timed out after 10 minutes${NC}"
  exit 1
fi

echo ""

# Step 4: Verify workspace files
echo "📁 Step 4: Verifying workspace files..."
echo ""

WORKSPACE_PATH="$WORKSPACE_DIR/$MIGRATION_ID/output"

if [ ! -d "$WORKSPACE_PATH" ]; then
  echo -e "${RED}❌ Workspace directory not found: $WORKSPACE_PATH${NC}"
  exit 1
fi

echo "Checking microservices..."
MICROSERVICES_DIR="$WORKSPACE_PATH/microservices"
if [ ! -d "$MICROSERVICES_DIR" ]; then
  echo -e "${RED}❌ Microservices directory not found${NC}"
  exit 1
fi

# Check each expected microservice
EXPECTED_SERVICES="auth-service client-service account-service transaction-service card-service"
for SERVICE in $EXPECTED_SERVICES; do
  if [ -d "$MICROSERVICES_DIR/$SERVICE" ]; then
    FILE_COUNT=$(find "$MICROSERVICES_DIR/$SERVICE" -type f | wc -l)
    if [ $FILE_COUNT -gt 0 ]; then
      echo -e "${GREEN}  ✅ $SERVICE: $FILE_COUNT files${NC}"

      # Check for critical files
      if [ -f "$MICROSERVICES_DIR/$SERVICE/pom.xml" ]; then
        echo "     - pom.xml ✅"
      else
        echo -e "${RED}     - pom.xml ❌ MISSING${NC}"
      fi

      if [ -f "$MICROSERVICES_DIR/$SERVICE/Dockerfile" ]; then
        echo "     - Dockerfile ✅"
      else
        echo -e "${RED}     - Dockerfile ❌ MISSING${NC}"
      fi
    else
      echo -e "${RED}  ❌ $SERVICE: EMPTY${NC}"
    fi
  else
    echo -e "${RED}  ❌ $SERVICE: NOT FOUND${NC}"
  fi
done

echo ""
echo "Checking micro-frontends..."
MFE_DIR="$WORKSPACE_PATH/micro-frontends"
if [ ! -d "$MFE_DIR" ]; then
  echo -e "${RED}❌ Micro-frontends directory not found${NC}"
  exit 1
fi

# Check each expected MFE
EXPECTED_MFES="shell-app auth-mfe dashboard-mfe transfers-mfe cards-mfe"
for MFE in $EXPECTED_MFES; do
  if [ -d "$MFE_DIR/$MFE" ]; then
    FILE_COUNT=$(find "$MFE_DIR/$MFE" -type f | wc -l)
    if [ $FILE_COUNT -gt 0 ]; then
      echo -e "${GREEN}  ✅ $MFE: $FILE_COUNT files${NC}"

      # Check for critical files
      if [ -f "$MFE_DIR/$MFE/package.json" ]; then
        echo "     - package.json ✅"
      else
        echo -e "${RED}     - package.json ❌ MISSING${NC}"
      fi

      if [ -f "$MFE_DIR/$MFE/webpack.config.js" ]; then
        echo "     - webpack.config.js ✅"
      else
        echo -e "${RED}     - webpack.config.js ❌ MISSING${NC}"
      fi

      if [ -f "$MFE_DIR/$MFE/Dockerfile" ]; then
        echo "     - Dockerfile ✅"
      else
        echo -e "${RED}     - Dockerfile ❌ MISSING${NC}"
      fi
    else
      echo -e "${RED}  ❌ $MFE: EMPTY${NC}"
    fi
  else
    echo -e "${RED}  ❌ $MFE: NOT FOUND${NC}"
  fi
done

echo ""

# Check infrastructure files
echo "Checking infrastructure files..."
if [ -f "$WORKSPACE_PATH/docker-compose.yml" ]; then
  echo -e "${GREEN}  ✅ docker-compose.yml${NC}"
else
  echo -e "${RED}  ❌ docker-compose.yml MISSING${NC}"
fi

if [ -f "$WORKSPACE_PATH/README.md" ]; then
  echo -e "${GREEN}  ✅ README.md${NC}"
else
  echo -e "${RED}  ❌ README.md MISSING${NC}"
fi

echo ""

# Step 5: Test download endpoint
echo "📥 Step 5: Testing download endpoint..."

DOWNLOAD_URL="$API_URL/repo-migrations/$MIGRATION_ID/download"
DOWNLOAD_FILE="/tmp/migration-$MIGRATION_ID.zip"

HTTP_CODE=$(curl -s -w "%{http_code}" -o "$DOWNLOAD_FILE" "$DOWNLOAD_URL")

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Download successful (HTTP $HTTP_CODE)${NC}"

  # Check ZIP contents
  ZIP_SIZE=$(ls -lh "$DOWNLOAD_FILE" | awk '{print $5}')
  echo "   ZIP size: $ZIP_SIZE"

  echo ""
  echo "ZIP contents:"
  unzip -l "$DOWNLOAD_FILE" | head -30

else
  echo -e "${RED}❌ Download failed (HTTP $HTTP_CODE)${NC}"
  exit 1
fi

echo ""

# Summary
echo "=================================="
echo "🎉 TEST COMPLETED SUCCESSFULLY!"
echo "=================================="
echo ""
echo "Migration ID: $MIGRATION_ID"
echo "Workspace: $WORKSPACE_PATH"
echo "Download: $DOWNLOAD_FILE"
echo ""
echo "Next steps:"
echo "  1. Extract ZIP: unzip $DOWNLOAD_FILE -d /tmp/test-migration"
echo "  2. cd /tmp/test-migration/banking-app-microservices"
echo "  3. docker-compose up -d"
echo "  4. Access: http://localhost:4200"
echo ""
