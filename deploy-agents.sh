#!/bin/bash
# Deploy ARK Agents to Kubernetes

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "================================================"
echo "  Deploying ARK Agents to ark-at-scale.space"
echo "================================================"
echo ""

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}ERROR: kubectl not found${NC}"
    echo "Install kubectl first"
    exit 1
fi

# Create namespace
echo -e "${BLUE}[1/6] Creating namespace...${NC}"
kubectl create namespace banque-migration --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespace ready${NC}"
echo ""

# Deploy agents
echo -e "${BLUE}[2/6] Deploying code-analyzer...${NC}"
kubectl apply -f ark/agents/code-analyzer.yaml
echo -e "${GREEN}✓ code-analyzer deployed${NC}"
echo ""

echo -e "${BLUE}[3/6] Deploying migration-planner...${NC}"
kubectl apply -f ark/agents/migration-planner.yaml
echo -e "${GREEN}✓ migration-planner deployed${NC}"
echo ""

echo -e "${BLUE}[4/6] Deploying service-generator...${NC}"
kubectl apply -f ark/agents/service-generator.yaml
echo -e "${GREEN}✓ service-generator deployed${NC}"
echo ""

echo -e "${BLUE}[5/6] Deploying frontend-migrator...${NC}"
kubectl apply -f ark/agents/frontend-migrator.yaml
echo -e "${GREEN}✓ frontend-migrator deployed${NC}"
echo ""

echo -e "${BLUE}[6/6] Deploying quality-validator...${NC}"
kubectl apply -f ark/agents/quality-validator.yaml
echo -e "${GREEN}✓ quality-validator deployed${NC}"
echo ""

# Verify
echo -e "${BLUE}Verifying agents...${NC}"
echo ""
kubectl get agents -n banque-migration
echo ""

echo "================================================"
echo -e "${GREEN}  All 5 agents deployed successfully!${NC}"
echo "================================================"
echo ""
echo "Agents deployed:"
echo "  ✓ code-analyzer (Claude Sonnet 4.5)"
echo "  ✓ migration-planner (Claude Opus 4.6)"
echo "  ✓ service-generator (Claude Sonnet 4.5)"
echo "  ✓ frontend-migrator (Claude Sonnet 4.5)"
echo "  ✓ quality-validator (Claude Sonnet 4.5)"
echo ""
echo "Next: Import workflow to n8n"
echo ""
