#!/bin/bash

###############################################################################
# Simple Local Demo Runner (No Kubernetes Required)
###############################################################################

set -e

echo "=========================================="
echo " Banking Migration Platform - Simple Demo"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Install from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required (you have $NODE_VERSION)"
    exit 1
fi

print_success "Node.js $(node -v) detected"
echo ""

# Setup Backend
echo "Step 1: Setting up Backend..."
cd platform/backend

if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install --silent
    print_success "Backend dependencies installed"
else
    print_info "Backend dependencies already installed"
fi

# Create .env if not exists
if [ ! -f ".env" ]; then
    print_info "Creating backend .env file..."
    cat > .env << 'EOF'
PORT=4000
NODE_ENV=development
N8N_WEBHOOK_URL=http://localhost:5678/webhook/migration
ARK_API_URL=http://localhost:8080
ARK_NAMESPACE=banque-migration
WORKSPACE_DIR=./workspace
OUTPUT_DIR=./outputs
FRONTEND_URL=http://localhost:3000
EOF
    print_success "Backend .env created"
fi

mkdir -p workspace outputs logs
cd ../..
echo ""

# Setup Frontend
echo "Step 2: Setting up Frontend..."
cd platform/frontend

if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies (this may take a minute)..."
    npm install --silent
    print_success "Frontend dependencies installed"
else
    print_info "Frontend dependencies already installed"
fi

# Create .env.local if not exists
if [ ! -f ".env.local" ]; then
    print_info "Creating frontend .env.local file..."
    cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
EOF
    print_success "Frontend .env.local created"
fi

cd ../..
echo ""

# Stop any existing services and containers
echo "Step 3: Checking for existing services..."
echo ""

# Create logs directory
mkdir -p logs

# Stop any old Docker containers from previous deployments
CONTAINER_COUNT=$(docker ps -q 2>/dev/null | wc -l)
if [ $CONTAINER_COUNT -gt 0 ]; then
    print_warning "Found $CONTAINER_COUNT running container(s) from previous deployments"
    print_info "Stopping old containers..."
    docker stop $(docker ps -q) 2>/dev/null
    print_success "Old containers stopped"
    echo ""
else
    print_info "No old containers to clean up"
fi

# Kill all Node.js processes related to this project
print_info "Stopping all Node.js processes..."
pkill -9 -f "ts-node-dev.*server.ts" 2>/dev/null || true
pkill -9 -f "next dev" 2>/dev/null || true
sleep 2

# Aggressively clean all ports
print_info "Cleaning ports 3000-3010 and 4000..."
for port in {3000..3010} 4000; do
    # Use fuser to kill processes on ports
    fuser -k $port/tcp 2>/dev/null || true
    # Also use lsof as backup
    lsof -ti:$port 2>/dev/null | xargs kill -9 2>/dev/null || true
done
sleep 3

# Verify ports are free
print_info "Verifying ports are free..."
PORTS_OK=true

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 3000 still in use!"
    PORTS_OK=false
fi

if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port 4000 still in use!"
    PORTS_OK=false
fi

if [ "$PORTS_OK" = false ]; then
    echo ""
    echo "❌ Could not free required ports. Please run:"
    echo "   sudo fuser -k 3000/tcp 4000/tcp"
    echo "   Then try again."
    exit 1
fi

print_success "Ports are free"

# Clean up old PID files
rm -f logs/backend.pid logs/frontend.pid 2>/dev/null || true

# Start services
echo "Step 4: Starting services..."
echo ""

print_info "Starting Backend API on port 4000..."
cd platform/backend
npm run dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../../logs/backend.pid
cd ../..

sleep 5

print_info "Starting Frontend on port 3000..."
cd platform/frontend
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../../logs/frontend.pid
cd ../..

sleep 8

# Check if services started and are responding
print_info "Waiting for services to be ready..."
sleep 5

BACKEND_OK=false
FRONTEND_OK=false

if ps -p $BACKEND_PID > /dev/null 2>&1; then
    # Check if backend is responding on port 4000
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        print_success "Backend started and responding (PID: $BACKEND_PID)"
        BACKEND_OK=true
    else
        print_warning "Backend started but not responding yet (PID: $BACKEND_PID)"
    fi
else
    echo "❌ Backend failed to start. Check logs/backend.log"
    tail -20 logs/backend.log
    exit 1
fi

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    # Wait a bit more for Next.js to compile
    sleep 5

    # Check if frontend is responding on port 3000
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        # Verify it's not a 404
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
        if [ "$HTTP_CODE" = "200" ]; then
            print_success "Frontend started and responding (PID: $FRONTEND_PID)"
            FRONTEND_OK=true
        else
            print_warning "Frontend responding but with HTTP $HTTP_CODE (might still be compiling)"
            # Check logs for actual port
            ACTUAL_PORT=$(cat logs/frontend.log | grep -o "Local:.*http://localhost:[0-9]*" | grep -o "[0-9]*$" | tail -1)
            if [ ! -z "$ACTUAL_PORT" ] && [ "$ACTUAL_PORT" != "3000" ]; then
                echo "⚠️  Frontend is running on port $ACTUAL_PORT instead of 3000!"
                echo "    Port 3000 was not properly freed. Stopping and retrying..."
                kill -9 $FRONTEND_PID
                exit 1
            fi
        fi
    else
        print_warning "Frontend started but not responding yet (PID: $FRONTEND_PID)"
    fi
else
    echo "❌ Frontend failed to start. Check logs/frontend.log"
    tail -20 logs/frontend.log
    exit 1
fi

echo ""
echo "=========================================="
echo " Platform is Running!"
echo "=========================================="
echo ""
echo "📱 Frontend UI:         http://localhost:3000"
echo "🔧 Backend API:         http://localhost:4000"
echo "📊 API Health Check:    http://localhost:4000/health"
echo "📊 API Documentation:   http://localhost:4000/api-docs"
echo ""
echo "🚀 Quick Start:"
echo "   1. The platform is now running!"
echo "   2. Use this curl command to migrate your local repository:"
echo ""
echo "   curl -X POST http://localhost:4000/api/repo-migration/analyze-and-generate \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"repoPath\":\"/home/hbaqa/Desktop/banque-app-main\"}'"
echo ""
echo "   3. After migration completes, get the migrationId from the response"
echo "   4. Deploy containers with:"
echo ""
echo "   curl -X POST http://localhost:4000/api/repo-migration/deploy/{migrationId}"
echo ""
echo "   5. Open deployed app: http://localhost:4200"
echo ""
echo "📝 View Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "🛑 To stop services:"
echo "   ./stop-simple.sh"
echo ""
