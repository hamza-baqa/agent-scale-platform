#!/bin/bash

##############################################################################
# Test Cloud n8n Webhook - ark-at-scale.space
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
echo "║   Test Cloud Webhook - Banque App Migration              ║"
echo "║   Environment: ark-at-scale.space                         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
REPO_URL="https://github.com/hamza-baqa/banque-app"
WEBHOOK_URL="https://ark-at-scale.space/n8n/webhook/migration-ark"
OUTPUT_PATH="${OUTPUT_PATH:-/workspace/output}"

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Repository:    ${GREEN}$REPO_URL${NC}"
echo -e "  Webhook URL:   ${GREEN}$WEBHOOK_URL${NC}"
echo -e "  Output Path:   ${GREEN}$OUTPUT_PATH${NC}"
echo ""

# Check if webhook is accessible
echo -e "${YELLOW}[1/3] Checking cloud n8n accessibility...${NC}"
if curl -s --connect-timeout 10 "https://ark-at-scale.space/n8n" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Cloud n8n is accessible${NC}"
else
    echo -e "${RED}✗ Cloud n8n is not accessible${NC}"
    echo -e "${YELLOW}Make sure you have internet connection${NC}"
    exit 1
fi

# Test GitHub repository access
echo -e "\n${YELLOW}[2/3] Testing GitHub repository access...${NC}"
if git ls-remote "$REPO_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Repository is accessible${NC}"
else
    echo -e "${RED}✗ Repository is not accessible${NC}"
    echo -e "${YELLOW}Make sure the repository URL is correct and public${NC}"
    exit 1
fi

# Trigger webhook
echo -e "\n${YELLOW}[3/3] Triggering cloud migration workflow...${NC}"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"repositoryUrl\": \"$REPO_URL\",
    \"outputPath\": \"$OUTPUT_PATH\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Cloud migration workflow triggered successfully!${NC}\n"

    echo -e "${BLUE}Response:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

else
    echo -e "${RED}✗ Failed to trigger workflow (HTTP $HTTP_CODE)${NC}\n"
    echo -e "${RED}Response:${NC}"
    echo "$BODY"

    echo -e "\n${YELLOW}Common issues:${NC}"
    echo -e "  1. Workflow is not active in n8n"
    echo -e "  2. Wrong webhook URL"
    echo -e "  3. Authentication required"
    echo -e "\n${YELLOW}Fix:${NC}"
    echo -e "  1. Login to https://ark-at-scale.space/n8n"
    echo -e "  2. Open your workflow"
    echo -e "  3. Toggle 'Active' switch ON"
    exit 1
fi

# Display monitoring options
echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Monitor Execution                            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}Option 1: n8n Executions View (Recommended)${NC}"
echo -e "  ${GREEN}https://ark-at-scale.space/n8n/executions${NC}"
echo -e "  • Real-time progress"
echo -e "  • View each node's output"
echo -e "  • See error details"

echo -e "\n${YELLOW}Option 2: n8n Workflow Editor${NC}"
echo -e "  ${GREEN}https://ark-at-scale.space/n8n/workflow/YOUR_WORKFLOW_ID${NC}"
echo -e "  • See workflow structure"
echo -e "  • Monitor live execution"

echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Cloud Webhook Test Complete! 🎉               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Expected workflow steps (10-15 minutes total):${NC}"
echo -e "  1. ${YELLOW}Webhook Trigger${NC} - Received ✓"
echo -e "  2. ${YELLOW}Set Variables${NC} - Repository set to your repo ✓"
echo -e "  3. ${YELLOW}Code Analyzer${NC} - Analyzing banque-app (2-3 min)..."
echo -e "  4. ${YELLOW}Migration Planner${NC} - Creating plan (3-5 min)..."
echo -e "  5. ${YELLOW}Service Generator${NC} - Generating services (5-8 min)..."
echo -e "  6. ${YELLOW}Frontend Migrator${NC} - Generating MFEs (5-8 min)..."
echo -e "  7. ${YELLOW}Quality Validator${NC} - Validating (3-5 min)..."
echo -e "  8. ${YELLOW}Complete${NC} - Migration finished!"

echo -e "\n${BLUE}Note: Steps 5 & 6 run in parallel${NC}"

echo -e "\n${YELLOW}Monitor at:${NC}"
echo -e "  ${GREEN}https://ark-at-scale.space/n8n/executions${NC}\n"
