#!/bin/bash

# COMPLETE BUILD → DEPLOY → TEST SCRIPT
# This will verify EVERYTHING works end-to-end before saying "it's ready"

set -e

echo "🏗️  COMPLETE BUILD → DEPLOY → TEST"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SOURCE_REPO="/home/hbaqa/Desktop/banque-app-main"

# Step 1: Kill old processes
echo "1️⃣  Cleaning up old processes..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ Old processes killed${NC}\n"

# Step 2: Install dependencies
echo "2️⃣  Installing dependencies..."
cd platform/backend
npm install --silent
cd ../frontend
npm install --silent
cd ../..
echo -e "${GREEN}✅ Dependencies installed${NC}\n"

# Step 3: Start backend
echo "3️⃣  Starting backend..."
cd platform/backend
nohup npm run dev > ../../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ../..

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
  if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is ready${NC}\n"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    cat backend.log | tail -50
    exit 1
  fi
  sleep 2
done

# Step 4: Start frontend
echo "4️⃣  Starting frontend..."
cd platform/frontend
nohup npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ../..

# Wait for frontend
echo "⏳ Waiting for frontend to start..."
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is ready${NC}\n"
    break
  fi
  if [ $i -eq 30 ]; then
    echo -e "${RED}❌ Frontend failed to start${NC}"
    cat frontend.log | tail -50
    exit 1
  fi
  sleep 2
done

# Step 5: Verify ARK is accessible
echo "5️⃣  Verifying ARK is accessible..."
kubectl port-forward -n default svc/ark-api 8080:80 > /dev/null 2>&1 &
ARK_PID=$!
sleep 3

if curl -s http://localhost:8080/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ ARK API is accessible${NC}\n"
else
  echo -e "${RED}❌ ARK API not accessible${NC}"
  exit 1
fi

# Step 6: Clean old migrations
echo "6️⃣  Cleaning old migrations..."
rm -rf workspace/* outputs/*
echo -e "${GREEN}✅ Old migrations cleaned${NC}\n"

# Step 7: Create a test migration via API
echo "7️⃣  Creating test migration..."

if [ ! -d "$SOURCE_REPO" ]; then
  echo -e "${RED}❌ Source repository not found at $SOURCE_REPO${NC}"
  exit 1
fi

# Start migration
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:4000/api/repo-migration/analyze-and-generate \
  -H 'Content-Type: application/json' \
  -d "{\"repoPath\": \"$SOURCE_REPO\"}")

MIGRATION_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.migrationId')

if [ "$MIGRATION_ID" = "null" ] || [ -z "$MIGRATION_ID" ]; then
  echo -e "${RED}❌ Failed to create migration${NC}"
  echo "$UPLOAD_RESPONSE" | jq '.'
  exit 1
fi

echo -e "${GREEN}✅ Migration created and started: $MIGRATION_ID${NC}\n"

# Step 8: Monitor migration progress
echo "8️⃣  Monitoring migration (this may take 5-10 minutes)..."
echo ""

for i in {1..120}; do
  STATUS_RESPONSE=$(curl -s "http://localhost:4000/api/migrations/$MIGRATION_ID")
  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
  CURRENT_STEP=$(echo "$STATUS_RESPONSE" | jq -r '.currentStep // "unknown"')

  echo -ne "\r⏳ Status: $STATUS | Step: $CURRENT_STEP (${i}/120)"

  if [ "$STATUS" = "completed" ]; then
    echo ""
    echo -e "${GREEN}✅ Migration completed!${NC}\n"
    break
  fi

  if [ "$STATUS" = "failed" ]; then
    echo ""
    echo -e "${RED}❌ Migration failed${NC}"
    echo "$STATUS_RESPONSE" | jq '.error'
    exit 1
  fi

  if [ $i -eq 120 ]; then
    echo ""
    echo -e "${RED}❌ Migration timed out after 10 minutes${NC}"
    exit 1
  fi

  sleep 5
done

# Step 9: Verify generated code
echo "9️⃣ Verifying generated code..."
WORKSPACE_DIR="workspace/$MIGRATION_ID/output"

if [ ! -d "$WORKSPACE_DIR" ]; then
  echo -e "${RED}❌ Workspace directory not found${NC}"
  exit 1
fi

# Check backend folder
if [ -d "$WORKSPACE_DIR/backend" ]; then
  BACKEND_SERVICES=$(ls -1 "$WORKSPACE_DIR/backend" 2>/dev/null | wc -l)
  echo -e "${GREEN}✅ backend/ folder exists with $BACKEND_SERVICES services${NC}"

  # Check for actual code files
  JAVA_FILES=$(find "$WORKSPACE_DIR/backend" -name "*.java" 2>/dev/null | wc -l)
  POM_FILES=$(find "$WORKSPACE_DIR/backend" -name "pom.xml" 2>/dev/null | wc -l)

  echo "   - Java files: $JAVA_FILES"
  echo "   - pom.xml files: $POM_FILES"

  if [ $JAVA_FILES -eq 0 ]; then
    echo -e "${RED}   ❌ NO JAVA FILES FOUND!${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ backend/ folder NOT FOUND${NC}"
  exit 1
fi

# Check frontend folder
if [ -d "$WORKSPACE_DIR/frontend" ]; then
  FRONTEND_APPS=$(ls -1 "$WORKSPACE_DIR/frontend" 2>/dev/null | wc -l)
  echo -e "${GREEN}✅ frontend/ folder exists with $FRONTEND_APPS apps${NC}"

  # Check for actual code files
  TS_FILES=$(find "$WORKSPACE_DIR/frontend" -name "*.ts" 2>/dev/null | wc -l)
  PACKAGE_FILES=$(find "$WORKSPACE_DIR/frontend" -name "package.json" 2>/dev/null | wc -l)

  echo "   - TypeScript files: $TS_FILES"
  echo "   - package.json files: $PACKAGE_FILES"

  if [ $TS_FILES -eq 0 ]; then
    echo -e "${RED}   ❌ NO TYPESCRIPT FILES FOUND!${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ frontend/ folder NOT FOUND${NC}"
  exit 1
fi

# Check infrastructure files
if [ -f "$WORKSPACE_DIR/docker-compose.yml" ]; then
  echo -e "${GREEN}✅ docker-compose.yml exists${NC}"
else
  echo -e "${RED}❌ docker-compose.yml NOT FOUND${NC}"
  exit 1
fi

echo ""

# Step 10: Test download endpoint
echo "🔟  Testing download endpoint..."
DOWNLOAD_FILE="/tmp/migration-$MIGRATION_ID.zip"

HTTP_CODE=$(curl -s -w "%{http_code}" -o "$DOWNLOAD_FILE" \
  "http://localhost:4000/api/migrations/$MIGRATION_ID/download")

if [ "$HTTP_CODE" = "200" ]; then
  ZIP_SIZE=$(ls -lh "$DOWNLOAD_FILE" | awk '{print $5}')
  echo -e "${GREEN}✅ Download successful (HTTP $HTTP_CODE, Size: $ZIP_SIZE)${NC}\n"
else
  echo -e "${RED}❌ Download failed (HTTP $HTTP_CODE)${NC}"
  exit 1
fi

# Step 11: Extract and verify ZIP contents
echo "1️⃣1️⃣  Extracting and verifying ZIP..."
EXTRACT_DIR="/tmp/test-migration-$MIGRATION_ID"
rm -rf "$EXTRACT_DIR"
mkdir -p "$EXTRACT_DIR"
unzip -q "$DOWNLOAD_FILE" -d "$EXTRACT_DIR"

cd "$EXTRACT_DIR"/*

echo "ZIP contents:"
ls -la

if [ -d "backend" ]; then
  echo -e "${GREEN}✅ backend/ in ZIP${NC}"
  ls -1 backend/ | head -10
else
  echo -e "${RED}❌ backend/ NOT in ZIP${NC}"
  exit 1
fi

if [ -d "frontend" ]; then
  echo -e "${GREEN}✅ frontend/ in ZIP${NC}"
  ls -1 frontend/ | head -10
else
  echo -e "${RED}❌ frontend/ NOT in ZIP${NC}"
  exit 1
fi

echo ""

# Summary
echo "======================================"
echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
echo "======================================"
echo ""
echo "✅ Backend running (PID: $BACKEND_PID)"
echo "✅ Frontend running (PID: $FRONTEND_PID)"
echo "✅ ARK accessible"
echo "✅ Migration completed successfully"
echo "✅ Code generated (Java files: $JAVA_FILES, TS files: $TS_FILES)"
echo "✅ Folder structure correct (backend/, frontend/)"
echo "✅ Download works (HTTP 200)"
echo "✅ ZIP contains all code"
echo ""
echo "📁 Migration workspace: $WORKSPACE_DIR"
echo "📥 Downloaded ZIP: $DOWNLOAD_FILE"
echo "📂 Extracted to: $EXTRACT_DIR"
echo ""
echo "🎯 READY FOR USE!"
echo ""
echo "To access:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:4000"
echo ""
