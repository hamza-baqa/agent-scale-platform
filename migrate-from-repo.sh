#!/bin/bash

# Repository-Based Migration Tool
# Analyzes actual code and generates microservices

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Repository-Based Migration - Analyze Real Code     ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if repo path is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./migrate-from-repo.sh <path-to-repository>${NC}"
    echo ""
    echo "Example:"
    echo "  ./migrate-from-repo.sh ~/Desktop/banque-app-main"
    echo ""
    exit 1
fi

REPO_PATH="$1"

# Check if path exists
if [ ! -d "$REPO_PATH" ]; then
    echo -e "${RED}Error: Directory not found: $REPO_PATH${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found repository: $REPO_PATH${NC}"
echo ""

# Check if backend is running
if ! curl -s http://localhost:4000/health > /dev/null; then
    echo -e "${RED}Error: Backend server is not running!${NC}"
    echo -e "${YELLOW}Please start the backend first:${NC}"
    echo "  cd platform/backend && npm run dev"
    exit 1
fi

echo -e "${GREEN}✓ Backend server is running${NC}"
echo ""

# Create migration request
echo -e "${BLUE}Starting repository analysis and migration...${NC}"

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"repoPath\": \"$REPO_PATH\"}" \
  http://localhost:4000/api/repo-migration/analyze-and-generate)

# Check if successful
if echo "$RESPONSE" | grep -q '"migrationId"'; then
    echo -e "${GREEN}✓ Migration completed successfully!${NC}"
    echo ""

    # Extract migration ID
    MIGRATION_ID=$(echo "$RESPONSE" | grep -o '"migrationId":"[^"]*"' | cut -d'"' -f4)

    echo -e "${BLUE}Migration ID: ${MIGRATION_ID}${NC}"
    echo ""
    echo -e "${GREEN}View progress at:${NC}"
    echo "  http://localhost:3000/dashboard?id=$MIGRATION_ID"
    echo ""
    echo -e "${BLUE}The system is now:${NC}"
    echo "  1. Analyzing your repository code"
    echo "  2. Extracting entities, services, and components"
    echo "  3. Generating microservices based on actual code"
    echo "  4. Creating micro-frontends with real UI components"
    echo ""
    echo -e "${YELLOW}This may take a few minutes...${NC}"
    echo ""

else
    echo -e "${RED}Migration failed!${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi
