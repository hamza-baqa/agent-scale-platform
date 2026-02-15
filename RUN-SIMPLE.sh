#!/bin/bash

# RUN-SIMPLE.sh - Quick start script for Agent@Scale Platform with Official ARK v0.1.53
# This script installs official ARK, deploys agents, and runs the platform

set -e

echo "🚀 Starting Agent@Scale Platform with Official ARK v0.1.53..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# PID file location
PID_DIR="./.run-pids"
mkdir -p "$PID_DIR"

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0 # Port is in use
    else
        return 1 # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    echo -e "${YELLOW}Killing process on port $port...${NC}"
    fuser -k ${port}/tcp >/dev/null 2>&1 || true
    sleep 1
}

# ==========================================
# Step 1: Check Prerequisites
# ==========================================
echo -e "${BLUE}[1/7] Checking Prerequisites${NC}"
echo ""

# Check required commands
MISSING_DEPS=()

if ! command_exists node; then
    MISSING_DEPS+=("node")
fi

if ! command_exists npm; then
    MISSING_DEPS+=("npm")
fi

if ! command_exists kubectl; then
    MISSING_DEPS+=("kubectl")
fi

if ! command_exists minikube; then
    MISSING_DEPS+=("minikube")
fi

if ! command_exists helm; then
    MISSING_DEPS+=("helm")
fi

if [ ${#MISSING_DEPS[@]} -ne 0 ]; then
    echo -e "${RED}❌ Missing dependencies: ${MISSING_DEPS[*]}${NC}"
    echo "Please install missing dependencies and try again."
    exit 1
fi

echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
echo -e "${GREEN}✓ npm: $(npm --version)${NC}"
echo -e "${GREEN}✓ kubectl: $(kubectl version --client --short 2>/dev/null | head -1)${NC}"
echo -e "${GREEN}✓ helm: $(helm version --short)${NC}"
echo -e "${GREEN}✓ minikube: $(minikube version --short)${NC}"
echo ""

# ==========================================
# Step 2: Start Kubernetes Cluster
# ==========================================
echo -e "${BLUE}[2/7] Starting Kubernetes Cluster${NC}"
echo ""

if minikube status | grep -q "host: Running"; then
    echo -e "${GREEN}✓ Minikube already running${NC}"
else
    echo "Starting minikube with Kubernetes v1.31.0..."
    minikube start --driver=docker --kubernetes-version=v1.31.0
    echo -e "${GREEN}✓ Minikube started${NC}"
fi
echo ""

# ==========================================
# Step 3: Install Official ARK v0.1.53
# ==========================================
echo -e "${BLUE}[3/7] Installing Official ARK v0.1.53${NC}"
echo ""

# Install ARK CLI if not already installed
if ! command_exists ark; then
    echo "Installing ARK CLI..."
    npm install -g @agents-at-scale/ark
    echo -e "${GREEN}✓ ARK CLI installed${NC}"
else
    ARK_VERSION=$(ark --version)
    echo -e "${GREEN}✓ ARK CLI already installed (v${ARK_VERSION})${NC}"
fi

# Check if ARK is already installed
if kubectl get namespace ark-system &>/dev/null && kubectl get deployment ark-controller -n ark-system &>/dev/null; then
    echo -e "${GREEN}✓ Official ARK is already installed${NC}"
else
    echo "Installing Official ARK v0.1.53..."
    ark install --yes
    echo -e "${GREEN}✓ Official ARK v0.1.53 installed${NC}"
fi
echo ""

# ==========================================
# Step 4: Configure Model and Agents
# ==========================================
echo -e "${BLUE}[4/7] Configuring Model and Deploying Agents${NC}"
echo ""

# Configure OpenAI API Key
echo "🔑 Configuring OpenAI API Key..."
OPENAI_KEY="${OPENAI_API_KEY:-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}"

kubectl create secret generic openai-secret \
    --from-literal=token="${OPENAI_KEY}" \
    -n default \
    --dry-run=client -o yaml | kubectl apply -f - >/dev/null 2>&1

echo -e "${GREEN}✓ OpenAI secret configured${NC}"

# Create default Model resource
echo "🧠 Creating default Model..."
if kubectl get model default -n default &>/dev/null; then
    echo -e "${GREEN}✓ Model 'default' already exists${NC}"
else
    cat <<EOF | kubectl apply -f - >/dev/null 2>&1
apiVersion: ark.mckinsey.com/v1alpha1
kind: Model
metadata:
  name: default
  namespace: default
spec:
  type: openai
  model:
    value: gpt-4o-mini
  config:
    openai:
      baseUrl:
        value: "https://api.openai.com/v1"
      apiKey:
        valueFrom:
          secretKeyRef:
            name: openai-secret
            key: token
EOF
    echo -e "${GREEN}✓ Model 'default' created${NC}"
fi

# Deploy All Agents from YAML files
echo "🤖 Deploying All Migration Agents from YAML files..."

# Deploy quality-validator first (if exists)
if [ -f "ark/agents/quality-validator.yaml" ]; then
    kubectl apply -f ark/agents/quality-validator.yaml >/dev/null 2>&1
    echo -e "${GREEN}  ✓ Agent 'quality-validator' deployed${NC}"
fi

# Deploy all agents from YAML files
for agent_file in ark/agents/*.yaml; do
    agent_name=$(basename "$agent_file" .yaml)
    if kubectl apply -f "$agent_file" >/dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Agent '$agent_name' deployed${NC}"
    else
        echo -e "${YELLOW}  ⚠ Agent '$agent_name' already exists${NC}"
    fi
done

# Wait for all agents to be available
echo ""
echo "⏳ Waiting for agents to be ready..."
sleep 5

AGENT_COUNT=0
for i in {1..30}; do
    AGENT_COUNT=$(kubectl get agents -n default --no-headers 2>/dev/null | wc -l)
    if [ "$AGENT_COUNT" -ge 7 ]; then
        echo -e "${GREEN}✓ $AGENT_COUNT agents are ready${NC}"
        break
    fi
    sleep 2
done

if [ "$AGENT_COUNT" -lt 7 ]; then
    echo -e "${YELLOW}⚠ Only $AGENT_COUNT agents ready (expected 7+)${NC}"
fi
echo ""
# ==========================================
# Step 5: Clean Up Previous Processes
# ==========================================
echo -e "${BLUE}[5/7] Cleaning Up Previous Processes${NC}"
echo ""

# Kill processes on required ports
for port in 8080 3001 4000 3000; do
    if check_port $port; then
        kill_port $port
    fi
done

# Kill existing port-forwards
pkill -f "kubectl port-forward" 2>/dev/null || true
sleep 2
echo -e "${GREEN}✓ Previous processes cleaned up${NC}"
echo ""

# ==========================================
# Step 6: Setup Port Forwards
# ==========================================
echo -e "${BLUE}[6/7] Setting Up Port Forwards${NC}"
echo ""

# Port forward ARK API
kubectl port-forward -n default svc/ark-api 8080:80 > "$PID_DIR/ark-api-forward.log" 2>&1 &
echo $! > "$PID_DIR/ark-api-forward.pid"

# Wait for ARK API to be ready with retry (up to 30 seconds)
echo "Waiting for ARK API to be ready..."
ARK_READY=false
for i in {1..30}; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ ARK API forwarded to http://localhost:8080${NC}"
        ARK_READY=true
        break
    fi
    sleep 1
done

if [ "$ARK_READY" = false ]; then
    echo -e "${RED}❌ ARK API not ready after 30 seconds${NC}"
    echo -e "${YELLOW}Check logs: tail -f $PID_DIR/ark-api-forward.log${NC}"
    exit 1
fi

# Port forward ARK Dashboard
kubectl port-forward -n default svc/ark-dashboard 3001:3000 > "$PID_DIR/ark-dashboard-forward.log" 2>&1 &
echo $! > "$PID_DIR/ark-dashboard-forward.pid"
sleep 2

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ARK Dashboard forwarded to http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠ ARK Dashboard may not be ready yet${NC}"
fi

# Verify ARK agents are available
echo ""
echo "Verifying ARK agents..."
AGENTS_AVAILABLE=$(curl -s http://localhost:8080/openai/v1/models | grep -c "agent/" || echo "0")
if [ "$AGENTS_AVAILABLE" -gt 0 ]; then
    echo -e "${GREEN}✓ $AGENTS_AVAILABLE ARK agents available${NC}"
else
    echo -e "${YELLOW}⚠ No ARK agents detected (will use fallback)${NC}"
fi
echo ""

# ==========================================
# Step 7: Start Backend & Frontend
# ==========================================
echo -e "${BLUE}[7/7] Starting Backend & Frontend Services${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "platform/backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd platform/backend && npm install >/dev/null 2>&1 && cd ../..
fi

if [ ! -d "platform/frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd platform/frontend && npm install >/dev/null 2>&1 && cd ../..
fi

# Start backend
cd platform/backend
npm run dev > "../../$PID_DIR/backend.log" 2>&1 &
echo $! > "../../$PID_DIR/backend.pid"
cd ../..

echo "Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend started on http://localhost:4000${NC}"
        break
    fi
    sleep 1
done

# Start frontend
cd platform/frontend
npm run dev > "../../$PID_DIR/frontend.log" 2>&1 &
echo $! > "../../$PID_DIR/frontend.pid"
cd ../..

echo "Waiting for frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend started on http://localhost:3000${NC}"
        break
    fi
    sleep 1
done

echo ""
sleep 2

# ==========================================
# Final Status Display
# ==========================================
echo "════════════════════════════════════════════════════════════════"
echo -e "${CYAN}🎉 Agent@Scale Platform with Official ARK v0.1.53 is Running!${NC}"
echo -e "${CYAN}⚡ NEW: Intelligent Code Extraction - Generates REAL Production Code!${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "${CYAN}📍 Access Points:${NC}"
echo "   • Migration Platform: ${GREEN}http://localhost:3000${NC}"
echo "   • Backend API:        ${GREEN}http://localhost:4000${NC}"
echo "   • ARK Dashboard:      ${GREEN}http://localhost:3001${NC}"
echo "   • ARK API:            ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "${CYAN}🤖 Active Agents (8):${NC}"

# Show all agents status
for agent in code-analyzer migration-planner service-generator frontend-migrator quality-validator unit-test-validator integration-test-validator e2e-test-validator; do
    AGENT_STATUS=$(kubectl get agent $agent -n default --no-headers 2>/dev/null | awk '{printf "   • %-22s [%s]\n", $1, ($3 == "True" ? "✓ Available" : "⚠ Initializing")}')
    if [ -n "$AGENT_STATUS" ]; then
        echo "$AGENT_STATUS"
    else
        echo "   • $agent        [⚠ Initializing...]"
    fi
done

echo ""
echo -e "${CYAN}📊 Check Status:${NC}"
echo "   ark status                    # ARK system status"
echo "   ark agents                    # List all agents"
echo "   kubectl get agents -n default"
echo "   kubectl get models -n default"
echo ""
echo -e "${CYAN}💬 Use ARK Agents:${NC}"
echo "   ark chat agent/code-analyzer            # Analyze source code"
echo "   ark chat agent/migration-planner        # Create migration plan"
echo "   ark chat agent/service-generator        # Generate microservices"
echo "   ark chat agent/frontend-migrator        # Generate micro-frontends"
echo "   ark chat agent/unit-test-validator      # Run unit tests"
echo "   ark chat agent/integration-test-validator  # Run integration tests"
echo "   ark chat agent/e2e-test-validator       # Run E2E tests"
echo ""
echo -e "${CYAN}📜 View Logs:${NC}"
echo "   tail -f $PID_DIR/backend.log"
echo "   tail -f $PID_DIR/frontend.log"
echo "   tail -f $PID_DIR/ark-api-forward.log"
echo ""
echo -e "${YELLOW}🛑 Stop All Services: ./STOP-ALL.sh${NC}"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✓ Setup complete! Open http://localhost:3001 to view ARK Dashboard${NC}"
echo "════════════════════════════════════════════════════════════════"
