#!/bin/bash

# Prepare for Cloud Deployment Script
# This script helps you prepare everything before deploying

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "================================================================"
echo "  Prepare Agent@Scale Platform for Cloud Deployment"
echo "================================================================"
echo ""

# Step 1: Check if n8n workflow is exported
echo -e "${BLUE}[1/5] Checking n8n workflow export${NC}"
echo ""

if [ -f "platform/migration-workflow-with-ark-agents.json" ]; then
    echo -e "${GREEN}✓ n8n workflow found${NC}"
else
    echo -e "${YELLOW}⚠ n8n workflow not found${NC}"
    echo ""
    echo "Please export your n8n workflow:"
    echo "1. Open your local n8n: http://localhost:5678"
    echo "2. Open your workflow"
    echo "3. Click '...' menu → Download"
    echo "4. Save as: migration-workflow-with-ark-agents.json"
    echo "5. Move to: $(pwd)/platform/"
    echo ""
    read -p "Press Enter when you've exported the workflow..."

    if [ -f "platform/migration-workflow-with-ark-agents.json" ]; then
        echo -e "${GREEN}✓ Workflow exported successfully${NC}"
    else
        echo -e "${RED}✗ Workflow still not found. Please export it first.${NC}"
        exit 1
    fi
fi

echo ""

# Step 2: Verify ARK agents
echo -e "${BLUE}[2/5] Verifying ARK agent files${NC}"
echo ""

AGENTS=(
    "code-analyzer"
    "migration-planner"
    "service-generator"
    "frontend-migrator"
    "quality-validator"
)

ALL_AGENTS_FOUND=true

for agent in "${AGENTS[@]}"; do
    if [ -f "ark/agents/${agent}.yaml" ]; then
        echo -e "${GREEN}✓ ${agent}.yaml${NC}"
    else
        echo -e "${RED}✗ ${agent}.yaml not found${NC}"
        ALL_AGENTS_FOUND=false
    fi
done

if [ "$ALL_AGENTS_FOUND" = false ]; then
    echo -e "${RED}Some ARK agent files are missing!${NC}"
    exit 1
fi

echo ""

# Step 3: Check Dockerfiles
echo -e "${BLUE}[3/5] Checking Docker configuration${NC}"
echo ""

if [ -f "platform/backend/Dockerfile" ]; then
    echo -e "${GREEN}✓ Backend Dockerfile${NC}"
else
    echo -e "${RED}✗ Backend Dockerfile missing${NC}"
    exit 1
fi

if [ -f "platform/frontend/Dockerfile" ]; then
    echo -e "${GREEN}✓ Frontend Dockerfile${NC}"
else
    echo -e "${RED}✗ Frontend Dockerfile missing${NC}"
    exit 1
fi

if [ -f "docker-compose.cloud.yml" ]; then
    echo -e "${GREEN}✓ docker-compose.cloud.yml${NC}"
else
    echo -e "${RED}✗ docker-compose.cloud.yml missing${NC}"
    exit 1
fi

echo ""

# Step 4: Create deployment archive
echo -e "${BLUE}[4/5] Creating deployment archive${NC}"
echo ""

echo "Creating archive (excluding node_modules, workspace, etc.)..."

tar -czf agent-scale-platform-deployment.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='platform/backend/workspace' \
    --exclude='platform/backend/outputs' \
    --exclude='platform/backend/logs' \
    --exclude='.run-pids' \
    --exclude='*.tar.gz' \
    .

ARCHIVE_SIZE=$(du -h agent-scale-platform-deployment.tar.gz | cut -f1)

echo -e "${GREEN}✓ Archive created: agent-scale-platform-deployment.tar.gz (${ARCHIVE_SIZE})${NC}"

echo ""

# Step 5: Generate deployment checklist
echo -e "${BLUE}[5/5] Generating deployment information${NC}"
echo ""

cat > DEPLOYMENT-INFO.txt <<EOF
========================================
Agent@Scale Platform - Deployment Info
========================================

Created: $(date)
Archive: agent-scale-platform-deployment.tar.gz
Size: ${ARCHIVE_SIZE}

Files Included:
---------------
✓ Backend source code
✓ Frontend source code
✓ 5 ARK agent definitions
✓ n8n workflow (migration-workflow-with-ark-agents.json)
✓ Docker configuration
✓ Deployment scripts

ARK Agents:
-----------
✓ code-analyzer (Claude Sonnet 4.5)
✓ migration-planner (Claude Opus 4.6)
✓ service-generator (Claude Sonnet 4.5)
✓ frontend-migrator (Claude Sonnet 4.5)
✓ quality-validator (Claude Sonnet 4.5)

Next Steps:
-----------
1. Upload archive to ark-at-scale.space server:
   scp agent-scale-platform-deployment.tar.gz user@ark-at-scale.space:/opt/

2. SSH into server:
   ssh user@ark-at-scale.space

3. Extract archive:
   cd /opt
   tar -xzf agent-scale-platform-deployment.tar.gz -C agent-scale-platform
   cd agent-scale-platform

4. Follow the guide:
   cat DEPLOY-TO-CLOUD.md

Quick Commands:
---------------
# Check ARK agents
kubectl get agents -n banque-migration

# Deploy platform
docker-compose -f docker-compose.cloud.yml up -d --build

# View logs
docker-compose -f docker-compose.cloud.yml logs -f

# Test backend
curl http://localhost:4000/health

========================================
EOF

echo -e "${GREEN}✓ Deployment info saved to DEPLOYMENT-INFO.txt${NC}"

echo ""
echo "================================================================"
echo -e "${GREEN}  Preparation Complete!${NC}"
echo "================================================================"
echo ""
echo -e "${BLUE}What's ready:${NC}"
echo ""
echo "  ✓ n8n workflow exported"
echo "  ✓ ARK agents verified (5 agents)"
echo "  ✓ Docker configuration checked"
echo "  ✓ Deployment archive created"
echo "  ✓ Deployment info generated"
echo ""
echo -e "${BLUE}Archive:${NC}"
echo "  File: agent-scale-platform-deployment.tar.gz"
echo "  Size: ${ARCHIVE_SIZE}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "  1. Upload to cloud server:"
echo "     ${YELLOW}scp agent-scale-platform-deployment.tar.gz user@ark-at-scale.space:/opt/${NC}"
echo ""
echo "  2. SSH into server and follow the guide:"
echo "     ${YELLOW}cat DEPLOY-TO-CLOUD.md${NC}"
echo ""
echo "  Or use the quick checklist:"
echo "     ${YELLOW}cat QUICK-DEPLOYMENT-CHECKLIST.md${NC}"
echo ""
echo -e "${YELLOW}Important: Keep your login credentials secure - never share them!${NC}"
echo ""
