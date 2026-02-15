#!/bin/bash

# ==========================================
# Agent@Scale Platform - Status Check
# ==========================================
# Check if all services are running

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PID_DIR=".run-pids"

echo "════════════════════════════════════════════════════════════════"
echo -e "${CYAN}🔍 Agent@Scale Platform Status Check${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Function to check if process is running
check_process() {
    local name=$1
    local pid_file="$PID_DIR/${name}.pid"
    local url=$2

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            if [ -n "$url" ]; then
                if curl -s "$url" > /dev/null 2>&1; then
                    echo -e "${GREEN}✓ ${name}: Running (PID: $pid) - ACCESSIBLE${NC}"
                else
                    echo -e "${YELLOW}⚠ ${name}: Running (PID: $pid) - NOT RESPONDING${NC}"
                fi
            else
                echo -e "${GREEN}✓ ${name}: Running (PID: $pid)${NC}"
            fi
            return 0
        else
            echo -e "${RED}✗ ${name}: Process died (PID: $pid)${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ ${name}: Not running (no PID file)${NC}"
        return 1
    fi
}

echo -e "${BLUE}Port Forwards:${NC}"
check_process "ark-api-forward" "http://localhost:8080/health"
check_process "ark-dashboard-forward" "http://localhost:3001"
echo ""

echo -e "${BLUE}Services:${NC}"
check_process "backend" "http://localhost:4000/health"
check_process "frontend" "http://localhost:3000"
echo ""

echo -e "${BLUE}Kubernetes (Minikube):${NC}"
if minikube status | grep -q "Running"; then
    echo -e "${GREEN}✓ Minikube: Running${NC}"

    # Check ARK agents
    AGENT_COUNT=$(kubectl get agents -n default --no-headers 2>/dev/null | wc -l)
    if [ "$AGENT_COUNT" -gt 0 ] 2>/dev/null; then
        echo -e "${GREEN}✓ ARK Agents: $AGENT_COUNT deployed${NC}"
    else
        echo -e "${YELLOW}⚠ ARK Agents: None found${NC}"
    fi
else
    echo -e "${RED}✗ Minikube: Not running${NC}"
fi
echo ""

echo "════════════════════════════════════════════════════════════════"
echo -e "${CYAN}📍 Access Points (if running):${NC}"
echo "   • Migration Platform: http://localhost:3000"
echo "   • Backend API:        http://localhost:4000"
echo "   • ARK Dashboard:      http://localhost:3001"
echo "   • ARK API:            http://localhost:8080"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo -e "${CYAN}💡 Quick Commands:${NC}"
echo "   ./RUN-SIMPLE.sh      - Start all services"
echo "   ./STOP-ALL.sh        - Stop all services"
echo "   ./STATUS-CHECK.sh    - Check status (this script)"
echo ""
