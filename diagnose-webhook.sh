#!/bin/bash

##############################################################################
# Diagnose 303 Webhook Error
##############################################################################

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         Diagnose 303 Webhook Error                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

WEBHOOK_URL="https://ark-at-scale.space/n8n/webhook/migration-ark"

echo -e "${YELLOW}Testing webhook: ${NC}$WEBHOOK_URL\n"

# Test 1: Check if webhook responds
echo -e "${YELLOW}[Test 1] Checking webhook response...${NC}"

response=$(curl -s -w "\n%{http_code}\n%{redirect_url}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}')

http_code=$(echo "$response" | sed -n '2p')
redirect_url=$(echo "$response" | sed -n '3p')
body=$(echo "$response" | sed -n '1p')

echo -e "HTTP Status Code: ${BLUE}$http_code${NC}"

if [ "$http_code" = "303" ]; then
    echo -e "${RED}✗ Error: Got 303 redirect${NC}"
    if [ -n "$redirect_url" ]; then
        echo -e "${YELLOW}Redirecting to: $redirect_url${NC}"
    fi
    echo ""

    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ISSUE FOUND: Workflow is NOT Active                     ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${YELLOW}How to fix:${NC}"
    echo -e "  1. Go to: ${GREEN}https://ark-at-scale.space/n8n${NC}"
    echo -e "  2. Open your workflow"
    echo -e "  3. Look at top-right corner"
    echo -e "  4. Find the ${GREEN}\"Active\"${NC} toggle switch"
    echo -e "  5. Click it to turn ${GREEN}ON${NC} (should turn blue/green)"
    echo -e "  6. Click ${GREEN}\"Save\"${NC}"
    echo -e "  7. Try the webhook again"
    echo ""

    echo -e "${BLUE}The workflow MUST be Active to receive webhooks!${NC}"
    exit 1

elif [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ Success! Webhook is working${NC}\n"

    echo -e "${GREEN}Response:${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    echo ""

    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  SUCCESS: Workflow is Active and Working!                ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    echo -e "${BLUE}Monitor execution at:${NC}"
    echo -e "  ${GREEN}https://ark-at-scale.space/n8n/executions${NC}"
    echo ""

    exit 0

elif [ "$http_code" = "404" ]; then
    echo -e "${RED}✗ Error: Webhook not found (404)${NC}\n"

    echo -e "${YELLOW}Possible causes:${NC}"
    echo -e "  1. Wrong webhook URL"
    echo -e "  2. Workflow not saved"
    echo -e "  3. Workflow deleted"
    echo ""

    echo -e "${YELLOW}How to fix:${NC}"
    echo -e "  1. Open workflow in n8n"
    echo -e "  2. Click ${GREEN}\"Webhook Trigger\"${NC} node (first node)"
    echo -e "  3. Copy the ${GREEN}Production URL${NC}"
    echo -e "  4. Use that URL instead"
    echo ""

    exit 1

else
    echo -e "${RED}✗ Error: Unexpected status code${NC}\n"

    echo -e "${YELLOW}Response body:${NC}"
    echo "$body"
    echo ""

    exit 1
fi

# Test 2: Check n8n accessibility
echo -e "${YELLOW}[Test 2] Checking n8n accessibility...${NC}"

if curl -s --connect-timeout 10 "https://ark-at-scale.space/n8n" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ n8n is accessible${NC}\n"
else
    echo -e "${RED}✗ Cannot reach n8n${NC}\n"
fi

# Test 3: Check repository accessibility
echo -e "${YELLOW}[Test 3] Checking repository accessibility...${NC}"

if git ls-remote "https://github.com/hamza-baqa/banque-app" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Repository is accessible${NC}\n"
else
    echo -e "${RED}✗ Cannot access repository${NC}\n"
fi
