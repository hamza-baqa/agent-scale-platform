#!/bin/bash

##############################################################################
# Find the Correct ARK API URL
##############################################################################

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         Find ARK API URL for ark-at-scale.space          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Testing possible ARK API URLs...${NC}\n"

# Test URLs to try
urls=(
    "https://ark-at-scale.space/ark-api/v1/agents/execute"
    "https://ark-at-scale.space/api/v1/agents/execute"
    "https://ark-at-scale.space/v1/agents/execute"
    "http://ark-at-scale.space:8080/v1/agents/execute"
)

for url in "${urls[@]}"; do
    echo -e "${YELLOW}Testing: ${NC}$url"

    response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
        -H "Content-Type: application/json" \
        -d '{
            "namespace": "banque-migration",
            "agent": "code-analyzer",
            "input": {"test": true}
        }' 2>/dev/null)

    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "202" ]; then
        echo -e "${GREEN}✓ WORKING! (HTTP $http_code)${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}Use this URL in your n8n workflow:${NC}"
        echo -e "${GREEN}$url${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
        exit 0
    elif [ "$http_code" = "404" ]; then
        echo -e "${RED}✗ Not found (HTTP 404)${NC}\n"
    elif [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
        echo -e "${YELLOW}⚠ Found but needs authentication (HTTP $http_code)${NC}"
        echo -e "${YELLOW}URL exists: $url${NC}\n"
    else
        echo -e "${RED}✗ Failed (HTTP $http_code)${NC}\n"
    fi
done

echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}No working ARK API URL found automatically${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "\n${YELLOW}Manual steps to find ARK API URL:${NC}\n"

echo -e "1. ${BLUE}Ask your admin for the ARK API URL${NC}"
echo -e "   The URL should end with: /v1/agents/execute\n"

echo -e "2. ${BLUE}If you have kubectl access:${NC}"
echo -e "   kubectl get svc -n ark-system"
echo -e "   kubectl get ingress -n ark-system\n"

echo -e "3. ${BLUE}Check ARK documentation:${NC}"
echo -e "   Look for API endpoint configuration\n"

echo -e "4. ${BLUE}Common URL patterns:${NC}"
echo -e "   https://your-domain.com/ark-api/v1/agents/execute"
echo -e "   https://ark.your-domain.com/v1/agents/execute"
echo -e "   http://ark-api.namespace.svc.cluster.local:80/v1/agents/execute\n"

echo -e "${YELLOW}Once you find the URL, update it in n8n:${NC}"
echo -e "  1. Open workflow in n8n"
echo -e "  2. Click on each 'ARK Agent' node"
echo -e "  3. Update the 'URL' field"
echo -e "  4. Save workflow\n"
