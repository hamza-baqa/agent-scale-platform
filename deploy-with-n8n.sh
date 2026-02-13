#!/bin/bash

##############################################################################
# Deploy Agent@Scale Platform with n8n Workflow
##############################################################################

set -e

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   Agent@Scale Platform - n8n Workflow Deployment         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}\n"

# Stop existing containers
echo -e "${YELLOW}[2/7] Stopping existing containers...${NC}"
docker compose -f docker-compose.cloud.yml down 2>/dev/null || true
echo -e "${GREEN}✓ Containers stopped${NC}\n"

# Start all services
echo -e "${YELLOW}[3/6] Starting all services...${NC}"
docker compose -f docker-compose.cloud.yml up -d

echo -e "${BLUE}Waiting for services to be healthy...${NC}"
sleep 15

# Check service status
echo -e "\n${YELLOW}[4/6] Checking service health...${NC}"

services=("backend" "frontend" "postgres" "redis" "mock-ark" "n8n")
for service in "${services[@]}"; do
    if docker compose -f docker-compose.cloud.yml ps | grep -q "agent-scale-$service.*Up"; then
        echo -e "${GREEN}✓ $service is running${NC}"
    else
        echo -e "${RED}✗ $service failed to start${NC}"
    fi
done

# Display service URLs
echo -e "\n${YELLOW}[5/6] Service URLs:${NC}"
echo -e "${GREEN}┌─────────────────────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│  Frontend Dashboard:  http://localhost:3000            │${NC}"
echo -e "${GREEN}│  Backend API:         http://localhost:4000            │${NC}"
echo -e "${GREEN}│  n8n Workflow:        http://localhost:5678            │${NC}"
echo -e "${GREEN}│  Mock ARK API:        http://localhost:8080            │${NC}"
echo -e "${GREEN}│  Ollama:              http://localhost:11434           │${NC}"
echo -e "${GREEN}└─────────────────────────────────────────────────────────┘${NC}"

# n8n credentials
echo -e "\n${YELLOW}[6/6] n8n Login Credentials:${NC}"
echo -e "${GREEN}┌─────────────────────────────────────────────────────────┐${NC}"
echo -e "${GREEN}│  URL:      http://localhost:5678                        │${NC}"
echo -e "${GREEN}│  Username: admin                                        │${NC}"
echo -e "${GREEN}│  Password: admin123                                     │${NC}"
echo -e "${GREEN}└─────────────────────────────────────────────────────────┘${NC}"

# Next steps
echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Next Steps                             ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}1. Import n8n Workflow:${NC}"
echo -e "   • Open http://localhost:5678"
echo -e "   • Login with admin/admin123"
echo -e "   • Go to: Workflows → Import from File"
echo -e "   • Select: ${GREEN}platform/n8n-workflow-ark-agents.json${NC}"
echo -e "   • Click Import"

echo -e "\n${YELLOW}2. Configure Workflow URLs:${NC}"
echo -e "   • Edit each 'ARK Agent' node"
echo -e "   • Set URL to: ${GREEN}http://mock-ark:8080/v1/agents/execute${NC}"
echo -e "   • Edit 'Backend API' nodes"
echo -e "   • Set URL to: ${GREEN}http://backend:4000/api/...${NC}"

echo -e "\n${YELLOW}3. Test the Workflow:${NC}"
echo -e "   ${GREEN}curl -X POST http://localhost:5678/webhook/migration-ark \\${NC}"
echo -e "   ${GREEN}  -H 'Content-Type: application/json' \\${NC}"
echo -e "   ${GREEN}  -d '{${NC}"
echo -e "   ${GREEN}    \"repositoryPath\": \"/workspace/test-repo\",${NC}"
echo -e "   ${GREEN}    \"outputPath\": \"/workspace/output\"${NC}"
echo -e "   ${GREEN}  }'${NC}"

echo -e "\n${YELLOW}4. Monitor Execution:${NC}"
echo -e "   • n8n UI: ${GREEN}http://localhost:5678/executions${NC}"
echo -e "   • Backend logs: ${GREEN}docker-compose -f docker-compose.cloud.yml logs -f backend${NC}"
echo -e "   • Dashboard: ${GREEN}http://localhost:3000/dashboard${NC}"

echo -e "\n${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Troubleshooting Commands                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}View logs:${NC}"
echo -e "  ${GREEN}docker-compose -f docker-compose.cloud.yml logs -f [service]${NC}"

echo -e "\n${YELLOW}Restart services:${NC}"
echo -e "  ${GREEN}docker-compose -f docker-compose.cloud.yml restart${NC}"

echo -e "\n${YELLOW}Stop all:${NC}"
echo -e "  ${GREEN}docker-compose -f docker-compose.cloud.yml down${NC}"

echo -e "\n${YELLOW}Check service status:${NC}"
echo -e "  ${GREEN}docker-compose -f docker-compose.cloud.yml ps${NC}"

echo -e "\n${YELLOW}Test ARK API:${NC}"
echo -e "  ${GREEN}curl http://localhost:8080/v1/agents/execute \\${NC}"
echo -e "  ${GREEN}    -H 'Content-Type: application/json' \\${NC}"
echo -e "  ${GREEN}    -d '{\"namespace\":\"banque-migration\",\"agent\":\"code-analyzer\",\"input\":{}}'${NC}"

echo -e "\n${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            Deployment Complete! 🎉                        ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}For detailed documentation, see: ${GREEN}DEPLOY-N8N-WORKFLOW.md${NC}\n"
