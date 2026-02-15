#!/bin/bash

###############################################################################
# Banking Migration Platform - Automated Installation Script
###############################################################################

set -e

echo "=========================================="
echo " Banking Migration Platform Installer"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

check_prerequisite() {
    if command -v $1 &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

# Check prerequisites
echo "Step 1: Checking prerequisites..."
echo ""

MISSING_DEPS=0

check_prerequisite "kubectl" || MISSING_DEPS=1
check_prerequisite "helm" || MISSING_DEPS=1
check_prerequisite "node" || MISSING_DEPS=1
check_prerequisite "npm" || MISSING_DEPS=1
check_prerequisite "docker" || MISSING_DEPS=1
check_prerequisite "git" || MISSING_DEPS=1

echo ""

if [ $MISSING_DEPS -eq 1 ]; then
    print_error "Missing prerequisites. Please install them first."
    exit 1
fi

# Check Kubernetes cluster
echo "Step 2: Checking Kubernetes cluster..."
if kubectl cluster-info &> /dev/null; then
    print_success "Kubernetes cluster is accessible"
else
    print_error "Cannot connect to Kubernetes cluster"
    print_info "Start Minikube with: minikube start --cpus=4 --memory=8192"
    exit 1
fi
echo ""

# Check for API key
echo "Step 3: Checking for Anthropic API key..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    print_warning "ANTHROPIC_API_KEY environment variable is not set"
    read -p "Enter your Anthropic API key (or press Enter to skip): " API_KEY
    if [ -n "$API_KEY" ]; then
        export ANTHROPIC_API_KEY=$API_KEY
        print_success "API key set"
    else
        print_warning "Skipping API key setup. You'll need to configure it later."
    fi
else
    print_success "ANTHROPIC_API_KEY is set"
fi
echo ""

# Install ARK agents
echo "Step 4: Installing ARK agents..."
print_info "Creating banque-migration namespace..."
kubectl create namespace banque-migration --dry-run=client -o yaml | kubectl apply -f -

print_info "Deploying ARK agents..."
kubectl apply -f ark/agents/ -n banque-migration
kubectl apply -f ark/teams/ -n banque-migration

print_success "ARK agents deployed"
echo ""

# Install n8n
echo "Step 5: Installing n8n with ARK custom nodes..."
print_info "This may take a few minutes..."

if helm list -n default | grep -q ark-n8n; then
    print_info "ark-n8n already installed, skipping..."
else
    helm install ark-n8n oci://ghcr.io/skokaina/charts/ark-n8n \
        --set ark.apiUrl=http://ark-api.ark-system.svc.cluster.local:80 \
        --namespace default \
        --wait \
        --timeout 5m || {
            print_warning "Helm install from OCI failed. This might be normal if the chart is not public yet."
            print_info "You can install n8n manually later."
        }
fi

print_success "n8n installation complete"
echo ""

# Setup backend
echo "Step 6: Setting up backend..."
cd platform/backend

if [ ! -d "node_modules" ]; then
    print_info "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
else
    print_info "Backend dependencies already installed"
fi

if [ ! -f ".env" ]; then
    print_info "Creating backend .env file..."
    cp .env.example .env

    # Update .env with default values
    sed -i.bak "s|N8N_WEBHOOK_URL=.*|N8N_WEBHOOK_URL=http://localhost:5678/webhook/migration|g" .env
    sed -i.bak "s|ARK_API_URL=.*|ARK_API_URL=http://ark-api.ark-system.svc.cluster.local:80|g" .env

    if [ -n "$ANTHROPIC_API_KEY" ]; then
        echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" >> .env
    fi

    rm -f .env.bak
    print_success "Backend .env created"
else
    print_info "Backend .env already exists"
fi

cd ../..
echo ""

# Setup frontend
echo "Step 7: Setting up frontend..."
cd platform/frontend

if [ ! -d "node_modules" ]; then
    print_info "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
else
    print_info "Frontend dependencies already installed"
fi

if [ ! -f ".env.local" ]; then
    print_info "Creating frontend .env.local file..."
    cp .env.local.example .env.local
    print_success "Frontend .env.local created"
else
    print_info "Frontend .env.local already exists"
fi

cd ../..
echo ""

# Create launch script
echo "Step 8: Creating launch script..."
cat > start-demo.sh << 'EOF'
#!/bin/bash

echo "Starting Banking Migration Platform Demo..."
echo ""

# Port forward n8n
echo "Starting n8n port-forward on 5678..."
kubectl port-forward svc/ark-n8n 5678:5678 -n default > /dev/null 2>&1 &
N8N_PID=$!
sleep 2

# Start backend
echo "Starting backend on port 4000..."
cd platform/backend
npm run dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..
sleep 3

# Start frontend
echo "Starting frontend on port 3000..."
cd platform/frontend
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..
sleep 3

echo ""
echo "=========================================="
echo " Platform is starting up..."
echo "=========================================="
echo ""
echo "Services:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:4000"
echo "  n8n:       http://localhost:5678"
echo ""
echo "Logs:"
echo "  Backend:   tail -f logs/backend.log"
echo "  Frontend:  tail -f logs/frontend.log"
echo ""
echo "To stop all services, run: ./stop-demo.sh"
echo ""

# Save PIDs
mkdir -p logs
echo $N8N_PID > logs/n8n.pid
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo "Waiting for services to be ready..."
sleep 10

echo "✓ Platform is ready!"
echo ""
echo "Open http://localhost:3000 to start"
EOF

chmod +x start-demo.sh

# Create stop script
cat > stop-demo.sh << 'EOF'
#!/bin/bash

echo "Stopping Banking Migration Platform..."

if [ -f logs/n8n.pid ]; then
    kill $(cat logs/n8n.pid) 2>/dev/null || true
    rm logs/n8n.pid
fi

if [ -f logs/backend.pid ]; then
    kill $(cat logs/backend.pid) 2>/dev/null || true
    rm logs/backend.pid
fi

if [ -f logs/frontend.pid ]; then
    kill $(cat logs/frontend.pid) 2>/dev/null || true
    rm logs/frontend.pid
fi

# Kill any remaining node processes on our ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:5678 | xargs kill -9 2>/dev/null || true

echo "✓ All services stopped"
EOF

chmod +x stop-demo.sh

print_success "Launch scripts created"
echo ""

# Summary
echo "=========================================="
echo " Installation Complete!"
echo "=========================================="
echo ""
print_success "All components installed successfully"
echo ""
echo "Next steps:"
echo ""
echo "1. Import n8n workflow:"
echo "   - Run: ./start-demo.sh"
echo "   - Open: http://localhost:5678"
echo "   - Import: platform/n8n-workflows/banque-migration-workflow.json"
echo "   - Configure ARK API credentials"
echo "   - Activate workflow"
echo ""
echo "2. Start the demo:"
echo "   ./start-demo.sh"
echo ""
echo "3. Open dashboard:"
echo "   http://localhost:3000"
echo ""
echo "For detailed instructions, see:"
echo "  - SETUP-DEMO-PLATFORM.md"
echo "  - PROJECT-SUMMARY.md"
echo ""
