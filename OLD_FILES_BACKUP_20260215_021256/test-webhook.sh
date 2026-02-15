#!/bin/bash

##############################################################################
# Test n8n Webhook with Your Repository
# Repository: https://github.com/hamza-baqa/banque-app
##############################################################################

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          Test n8n Webhook - Banque App Migration         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
REPO_URL="https://github.com/hamza-baqa/banque-app"
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:5678/webhook/migration-ark}"
OUTPUT_PATH="${OUTPUT_PATH:-/workspace/output}"
NOTIFICATION_URL="${NOTIFICATION_URL:-http://backend:4000/api/webhook/notify}"

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Repository:    ${GREEN}$REPO_URL${NC}"
echo -e "  Webhook URL:   ${GREEN}$WEBHOOK_URL${NC}"
echo -e "  Output Path:   ${GREEN}$OUTPUT_PATH${NC}"
echo -e "  Notifications: ${GREEN}$NOTIFICATION_URL${NC}"
echo ""

# Check if n8n is running
echo -e "${YELLOW}[1/4] Checking if n8n is running...${NC}"
if curl -s --connect-timeout 5 "http://localhost:5678/healthz" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ n8n is running${NC}"
else
    echo -e "${RED}✗ n8n is not running${NC}"
    echo -e "${YELLOW}Start n8n with: docker-compose -f docker-compose.cloud.yml up -d n8n${NC}"
    exit 1
fi

# Check if backend is running
echo -e "\n${YELLOW}[2/4] Checking if backend is running...${NC}"
if curl -s --connect-timeout 5 "http://localhost:4000/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo -e "${YELLOW}Start backend with: docker-compose -f docker-compose.cloud.yml up -d backend${NC}"
    exit 1
fi

# Test GitHub repository access
echo -e "\n${YELLOW}[3/4] Testing GitHub repository access...${NC}"
if git ls-remote "$REPO_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Repository is accessible${NC}"
else
    echo -e "${RED}✗ Repository is not accessible${NC}"
    echo -e "${YELLOW}Make sure the repository URL is correct and public${NC}"
    exit 1
fi

# Trigger webhook
echo -e "\n${YELLOW}[4/4] Triggering migration workflow...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"repositoryUrl\": \"$REPO_URL\",
    \"outputPath\": \"$OUTPUT_PATH\",
    \"notificationUrl\": \"$NOTIFICATION_URL\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Migration workflow triggered successfully!${NC}\n"

    # Try to extract migrationId
    MIGRATION_ID=$(echo "$BODY" | grep -o '"migrationId":"[^"]*' | cut -d'"' -f4)

    if [ -n "$MIGRATION_ID" ]; then
        echo -e "${GREEN}Migration ID: $MIGRATION_ID${NC}\n"
    fi

    echo -e "${BLUE}Response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

else
    echo -e "${RED}✗ Failed to trigger workflow (HTTP $HTTP_CODE)${NC}\n"
    echo -e "${RED}Response:${NC}"
    echo "$BODY"
    exit 1
fi

# Display monitoring options
echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Monitor Execution                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}Option 1: n8n UI${NC}"
echo -e "  ${GREEN}http://localhost:5678/executions${NC}"
echo -e "  Login: admin / admin123"

echo -e "\n${YELLOW}Option 2: Backend Logs${NC}"
echo -e "  ${GREEN}docker-compose -f docker-compose.cloud.yml logs -f backend${NC}"

echo -e "\n${YELLOW}Option 3: Frontend Dashboard${NC}"
echo -e "  ${GREEN}http://localhost:3000/dashboard${NC}"

if [ -n "$MIGRATION_ID" ]; then
    echo -e "\n${YELLOW}Option 4: Check Status via API${NC}"
    echo -e "  ${GREEN}curl http://localhost:4000/api/repo-migration/$MIGRATION_ID/status${NC}"

    echo -e "\n${YELLOW}Option 5: Download Results (after completion)${NC}"
    echo -e "  ${GREEN}curl -o migration.zip http://localhost:4000/api/repo-migration/$MIGRATION_ID/download${NC}"
fi

echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Webhook Test Complete! 🎉                      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Expected workflow steps:${NC}"
echo -e "  1. ${YELLOW}Webhook Trigger${NC} - Received request ✓"
echo -e "  2. ${YELLOW}Code Analyzer${NC} - Analyzing banque-app..."
echo -e "  3. ${YELLOW}Migration Planner${NC} - Creating migration plan..."
echo -e "  4. ${YELLOW}Service Generator${NC} - Generating Spring Boot services..."
echo -e "  5. ${YELLOW}Frontend Migrator${NC} - Generating Angular MFEs..."
echo -e "  6. ${YELLOW}Quality Validator${NC} - Validating migration..."
echo -e "  7. ${YELLOW}Complete${NC} - Migration finished!"

echo -e "\n${BLUE}Estimated time: 10-15 minutes${NC}\n"
