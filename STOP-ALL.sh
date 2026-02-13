#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PID_DIR="./.run-pids"

echo ""
echo "================================================================"
echo "  Stopping All Services"
echo "================================================================"
echo ""

# Function to stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file="$PID_DIR/$2.pid"

    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${YELLOW}Stopping $service_name (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null
            sleep 1
            # Force kill if still running
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null
            fi
            echo -e "${GREEN}✓ $service_name stopped${NC}"
        else
            echo -e "${BLUE}$service_name is not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${BLUE}$service_name PID file not found${NC}"
    fi
}

# Stop all services
stop_service "Frontend" "frontend"
stop_service "Backend" "backend"
stop_service "ARK API Port-Forward" "ark-api-forward"
stop_service "ARK Dashboard Port-Forward" "ark-dashboard-forward"

echo ""
echo -e "${BLUE}Killing any remaining processes on ports...${NC}"

# Kill processes on ports as backup
fuser -k 3000/tcp 2>/dev/null && echo -e "${GREEN}✓ Port 3000 cleared${NC}"
fuser -k 4000/tcp 2>/dev/null && echo -e "${GREEN}✓ Port 4000 cleared${NC}"
fuser -k 8080/tcp 2>/dev/null && echo -e "${GREEN}✓ Port 8080 cleared (ARK API)${NC}"
fuser -k 3001/tcp 2>/dev/null && echo -e "${GREEN}✓ Port 3001 cleared (ARK Dashboard)${NC}"

# Kill any remaining Node.js/npm processes
echo ""
echo -e "${BLUE}Stopping remaining Node.js processes...${NC}"
ps aux | grep -E "node|npm|ts-node" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null
echo -e "${GREEN}✓ All Node.js processes stopped${NC}"

# Clean up PID directory
if [ -d "$PID_DIR" ]; then
    rm -rf "$PID_DIR"
    echo -e "${GREEN}✓ Cleaned up PID files${NC}"
fi

echo ""
echo "================================================================"
echo -e "${GREEN}  All Services Stopped${NC}"
echo "================================================================"
echo ""
