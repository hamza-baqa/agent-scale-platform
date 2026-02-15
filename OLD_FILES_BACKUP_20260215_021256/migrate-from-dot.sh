#!/bin/bash

# DOT Architecture Migration Tool
# Converts a DOT architecture file into microservices and micro-frontends

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Banking Migration Platform - DOT Architecture Tool  ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if DOT file is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: ./migrate-from-dot.sh <path-to-dot-file>${NC}"
    echo ""
    echo "Example:"
    echo "  ./migrate-from-dot.sh examples/banking-architecture.dot"
    echo ""
    echo "A sample DOT file is provided in: examples/banking-architecture.dot"
    exit 1
fi

DOT_FILE="$1"

# Check if file exists
if [ ! -f "$DOT_FILE" ]; then
    echo -e "${RED}Error: File not found: $DOT_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Found DOT file: $DOT_FILE${NC}"
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

# Install dependencies if needed
if [ ! -d "platform/backend/node_modules/multer" ]; then
    echo -e "${YELLOW}Installing required dependencies...${NC}"
    cd platform/backend
    npm install multer @types/multer js-yaml --save
    cd ../..
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# Upload and process DOT file
echo -e "${BLUE}Uploading and processing DOT architecture...${NC}"

RESPONSE=$(curl -s -X POST \
  -F "dotFile=@$DOT_FILE" \
  http://localhost:4000/api/dot-migration/generate-and-deploy)

# Check if successful
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Migration completed successfully!${NC}"
    echo ""

    # Extract migration ID
    MIGRATION_ID=$(echo "$RESPONSE" | grep -o '"migrationId":"[^"]*"' | cut -d'"' -f4)

    echo -e "${BLUE}Migration ID: ${MIGRATION_ID}${NC}"
    echo ""

    # Parse response to show what was generated
    MICROSERVICES=$(echo "$RESPONSE" | grep -o '"microservices":[0-9]*' | cut -d':' -f2)
    MICROFRONTENDS=$(echo "$RESPONSE" | grep -o '"microFrontends":[0-9]*' | cut -d':' -f2)

    echo -e "${GREEN}Generated Components:${NC}"
    echo "  • Microservices: $MICROSERVICES"
    echo "  • Micro-Frontends: $MICROFRONTENDS"
    echo ""

    # Wait for containers to start
    echo -e "${YELLOW}Waiting for containers to start...${NC}"
    sleep 5

    echo -e "${GREEN}✓ Deployment completed!${NC}"
    echo ""
    echo -e "${BLUE}Access your applications:${NC}"
    echo "  • Main Shell:   http://localhost:4200"
    echo "  • Dashboard:    http://localhost:3000"
    echo "  • API Gateway:  http://localhost:8080"
    echo ""
    echo -e "${BLUE}View deployment status:${NC}"
    echo "  docker ps | grep ${MIGRATION_ID:0:8}"
    echo ""
    echo -e "${BLUE}View logs:${NC}"
    echo "  docker logs shell-${MIGRATION_ID:0:8}"
    echo ""
    echo -e "${GREEN}Migration complete! 🎉${NC}"

else
    echo -e "${RED}Migration failed!${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    exit 1
fi
