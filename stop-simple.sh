#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=========================================="
echo " Stopping Banking Migration Platform"
echo "=========================================="
echo ""

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Stop Backend
if [ -f logs/backend.pid ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null || true
        sleep 1
        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null || true
        fi
    fi
    rm logs/backend.pid
    print_success "Backend stopped"
else
    print_info "No backend PID file found"
fi

# Stop Frontend
if [ -f logs/frontend.pid ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null || true
        sleep 1
        # Force kill if still running
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null || true
        fi
    fi
    rm logs/frontend.pid
    print_success "Frontend stopped"
else
    print_info "No frontend PID file found"
fi

# Kill any remaining Node.js processes from this project
print_info "Stopping any remaining backend/frontend processes..."
pkill -9 -f "ts-node-dev.*server.ts" 2>/dev/null || true
pkill -9 -f "next dev" 2>/dev/null || true
sleep 1

# Cleanup any remaining processes on ports
print_info "Cleaning up processes on ports 3000-4000..."
for port in {3000..3010} 4000; do
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done
print_success "Port cleanup complete"

# Stop all Docker containers from migrations
print_info "Stopping Docker containers..."
CONTAINER_COUNT=$(docker ps -q 2>/dev/null | wc -l)
if [ $CONTAINER_COUNT -gt 0 ]; then
    docker stop $(docker ps -q) 2>/dev/null
    print_success "Stopped $CONTAINER_COUNT Docker container(s)"
else
    print_info "No Docker containers running"
fi

# Optional: Remove stopped containers
read -p "Remove stopped containers? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    STOPPED_COUNT=$(docker ps -aq 2>/dev/null | wc -l)
    if [ $STOPPED_COUNT -gt 0 ]; then
        docker rm $(docker ps -aq) 2>/dev/null
        print_success "Removed $STOPPED_COUNT stopped container(s)"
    else
        print_info "No stopped containers to remove"
    fi
fi

echo ""
echo "=========================================="
echo " All Services Stopped"
echo "=========================================="
echo ""
echo "To start again, run: ./RUN-SIMPLE.sh"
echo ""
