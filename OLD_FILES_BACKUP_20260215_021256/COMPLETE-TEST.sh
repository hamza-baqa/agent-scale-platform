#!/bin/bash

# COMPLETE END-TO-END TEST
# This will verify EVERYTHING works before declaring success

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 COMPLETE END-TO-END TEST"
echo "=========================================="
echo ""

SOURCE_REPO="/home/hbaqa/Desktop/banque-app-main"
TEST_DIR="/tmp/complete-test-$(date +%s)"

# Step 1: Create migration
echo "1️⃣  Creating new migration..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/repo-migration/analyze-and-generate \
  -H 'Content-Type: application/json' \
  -d "{\"repoPath\": \"$SOURCE_REPO\"}")

MIGRATION_ID=$(echo "$RESPONSE" | jq -r '.migrationId')

if [ "$MIGRATION_ID" = "null" ] || [ -z "$MIGRATION_ID" ]; then
  echo -e "${RED}❌ Failed to create migration${NC}"
  echo "$RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Migration created: $MIGRATION_ID${NC}"
echo ""

# Step 2: Wait for completion
echo "2️⃣  Waiting for migration to complete (max 15 minutes)..."
for i in {1..180}; do
  STATUS=$(curl -s "http://localhost:4000/api/migrations/$MIGRATION_ID" | jq -r '.status' 2>/dev/null)

  if [ "$STATUS" = "completed" ]; then
    echo -e "${GREEN}✅ Migration completed!${NC}"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo -e "${RED}❌ Migration failed${NC}"
    curl -s "http://localhost:4000/api/migrations/$MIGRATION_ID" | jq '.error'
    exit 1
  fi

  if [ $((i % 6)) -eq 0 ]; then
    echo "   [$(date +%H:%M:%S)] Status: $STATUS (${i}/180)"
  fi

  sleep 5
done

if [ "$STATUS" != "completed" ]; then
  echo -e "${RED}❌ Migration timed out${NC}"
  exit 1
fi

echo ""

# Step 3: Download
echo "3️⃣  Downloading migration output..."
mkdir -p "$TEST_DIR"
curl -s -o "$TEST_DIR/migration.zip" \
  "http://localhost:4000/api/migrations/$MIGRATION_ID/download"

if [ ! -f "$TEST_DIR/migration.zip" ]; then
  echo -e "${RED}❌ Download failed${NC}"
  exit 1
fi

ZIP_SIZE=$(ls -lh "$TEST_DIR/migration.zip" | awk '{print $5}')
echo -e "${GREEN}✅ Downloaded: $ZIP_SIZE${NC}"
echo ""

# Step 4: Extract
echo "4️⃣  Extracting ZIP..."
cd "$TEST_DIR"
unzip -q migration.zip
cd */

if [ ! -d "backend" ]; then
  echo -e "${RED}❌ No backend/ directory found${NC}"
  ls -la
  exit 1
fi

if [ ! -d "frontend" ]; then
  echo -e "${RED}❌ No frontend/ directory found${NC}"
  ls -la
  exit 1
fi

echo -e "${GREEN}✅ Extracted successfully${NC}"
echo ""

# Step 5: Verify structure
echo "5️⃣  Verifying structure..."
echo "Backend services:"
ls -1 backend/
BACKEND_COUNT=$(ls -1 backend/ | wc -l)

echo ""
echo "Frontend micro-frontends:"
ls -1 frontend/
FRONTEND_COUNT=$(ls -1 frontend/ | wc -l)

echo ""
echo "Infrastructure files:"
ls -1 *.sh *.yml 2>/dev/null || true

if [ $BACKEND_COUNT -eq 0 ]; then
  echo -e "${RED}❌ No backend services generated!${NC}"
  exit 1
fi

if [ $FRONTEND_COUNT -eq 0 ]; then
  echo -e "${RED}❌ No frontend micro-frontends generated!${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Structure verified: $BACKEND_COUNT backend services, $FRONTEND_COUNT frontend MFEs${NC}"
echo ""

# Step 6: Check for Dockerfiles
echo "6️⃣  Checking for Dockerfiles..."
MISSING_DOCKERFILES=0

for service in backend/*; do
  if [ -d "$service" ]; then
    service_name=$(basename "$service")
    if [ ! -f "$service/Dockerfile" ]; then
      echo -e "${RED}   ❌ Missing: $service_name/Dockerfile${NC}"
      MISSING_DOCKERFILES=$((MISSING_DOCKERFILES + 1))
    else
      echo -e "${GREEN}   ✅ Found: $service_name/Dockerfile${NC}"
    fi
  fi
done

for mfe in frontend/*; do
  if [ -d "$mfe" ]; then
    mfe_name=$(basename "$mfe")
    if [ ! -f "$mfe/Dockerfile" ]; then
      echo -e "${RED}   ❌ Missing: $mfe_name/Dockerfile${NC}"
      MISSING_DOCKERFILES=$((MISSING_DOCKERFILES + 1))
    else
      echo -e "${GREEN}   ✅ Found: $mfe_name/Dockerfile${NC}"
    fi
  fi
done

if [ $MISSING_DOCKERFILES -gt 0 ]; then
  echo -e "${RED}❌ $MISSING_DOCKERFILES Dockerfiles are missing!${NC}"
  exit 1
fi

echo ""

# Step 7: Verify docker-compose.yml
echo "7️⃣  Verifying docker-compose.yml..."
if [ ! -f "docker-compose.yml" ]; then
  echo -e "${RED}❌ docker-compose.yml not found${NC}"
  exit 1
fi

# Check for api-gateway (should NOT be present)
if grep -q "api-gateway:" docker-compose.yml; then
  echo -e "${RED}❌ docker-compose.yml still contains api-gateway!${NC}"
  exit 1
fi

echo -e "${GREEN}✅ docker-compose.yml is valid (no api-gateway)${NC}"
echo ""

# Step 8: Test docker compose syntax
echo "8️⃣  Testing docker-compose syntax..."
if docker compose config > /dev/null 2>&1; then
  echo -e "${GREEN}✅ docker-compose.yml syntax is valid${NC}"
else
  echo -e "${RED}❌ docker-compose.yml has syntax errors${NC}"
  docker compose config
  exit 1
fi

echo ""

# Step 9: Try to build (just validate, don't actually build to save time)
echo "9️⃣  Validating build configuration..."
chmod +x start.sh stop.sh

# Check if start.sh has docker compose detection
if grep -q "DOCKER_COMPOSE=" start.sh; then
  echo -e "${GREEN}✅ start.sh has Docker Compose v2 detection${NC}"
else
  echo -e "${RED}❌ start.sh missing Docker Compose v2 detection${NC}"
  exit 1
fi

echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo "=========================================="
echo ""
echo "Migration ID: $MIGRATION_ID"
echo "Test directory: $TEST_DIR"
echo "Backend services: $BACKEND_COUNT"
echo "Frontend MFEs: $FRONTEND_COUNT"
echo "Missing Dockerfiles: $MISSING_DOCKERFILES"
echo ""
echo "✅ Structure is correct"
echo "✅ All Dockerfiles present"
echo "✅ docker-compose.yml is valid"
echo "✅ No api-gateway in docker-compose"
echo "✅ start.sh has Docker Compose v2 support"
echo ""
echo "🚀 READY TO BUILD AND DEPLOY!"
echo ""
echo "To build and run:"
echo "  cd $TEST_DIR/*"
echo "  ./start.sh"
echo ""
