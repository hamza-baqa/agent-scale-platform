#!/bin/bash

# Quick Cloud Deployment Script
# This script helps you deploy the Agent@Scale Platform to ark-at-scale.space

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "================================================================"
echo "  Agent@Scale Platform - Cloud Deployment"
echo "================================================================"
echo ""

# Function to print colored output
print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if running on server or local
if [ -f "/etc/hostname" ] && grep -q "ark-at-scale" /etc/hostname 2>/dev/null; then
    IS_SERVER=true
    print_info "Running on server"
else
    IS_SERVER=false
    print_info "Running on local machine"
fi

# Step 1: Prerequisites check
print_info "[1/7] Checking prerequisites..."
echo ""

if $IS_SERVER; then
    # Server checks
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        echo ""
        echo "Install Docker with:"
        echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "  sudo sh get-docker.sh"
        exit 1
    fi
    print_success "Docker is installed"

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        echo ""
        echo "Install with:"
        echo "  sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "  sudo chmod +x /usr/local/bin/docker-compose"
        exit 1
    fi
    print_success "Docker Compose is installed"
else
    # Local checks
    if ! command -v ssh &> /dev/null; then
        print_error "SSH is not installed"
        exit 1
    fi
    print_success "SSH is available"

    print_warning "This script should be run on the server"
    echo ""
    read -p "Enter server address (e.g., user@ark-at-scale.space): " SERVER_ADDRESS

    if [ -z "$SERVER_ADDRESS" ]; then
        print_error "Server address is required"
        exit 1
    fi

    print_info "Uploading files to server..."
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'platform/backend/workspace' \
        . "$SERVER_ADDRESS:/opt/agent-scale-platform/"

    print_success "Files uploaded"
    print_info "Now SSH into the server and run this script again:"
    echo "  ssh $SERVER_ADDRESS"
    echo "  cd /opt/agent-scale-platform"
    echo "  bash QUICK-DEPLOY.sh"
    exit 0
fi

echo ""

# Step 2: Environment configuration
print_info "[2/7] Configuring environment..."
echo ""

if [ ! -f ".env.production" ]; then
    print_warning "Creating .env.production file"
    cat > .env.production <<EOF
# JWT Secret
JWT_SECRET=$(openssl rand -hex 32)

# Domain configuration
DOMAIN=ark-at-scale.space
FRONTEND_URL=https://ark-at-scale.space

# n8n Configuration
N8N_WEBHOOK_URL=https://ark-at-scale.space/n8n/webhook/migration
N8N_API_URL=https://ark-at-scale.space/n8n/api/v1

# Database
POSTGRES_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
EOF
    chmod 600 .env.production
    print_success "Environment file created"
else
    print_success "Environment file exists"
fi

echo ""

# Step 3: Stop existing services
print_info "[3/7] Stopping existing services..."
echo ""

docker-compose -f docker-compose.cloud.yml down 2>/dev/null || true
print_success "Existing services stopped"

echo ""

# Step 4: Build and start all services
print_info "[4/6] Building and starting services..."
echo ""

docker-compose -f docker-compose.cloud.yml up -d --build

print_success "Services started"

echo ""

# Step 5: Wait for services to be healthy
print_info "[5/6] Waiting for services to be healthy..."
echo ""

MAX_WAIT=120
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    if docker-compose -f docker-compose.cloud.yml ps | grep -q "Up (healthy)"; then
        break
    fi
    echo -n "."
    sleep 5
    WAITED=$((WAITED + 5))
done

echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    print_warning "Services took longer than expected to start"
else
    print_success "Services are healthy"
fi

echo ""

# Step 7: Verify deployment
print_info "[6/6] Verifying deployment..."
echo ""

# Check backend
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    print_success "Backend is responding"
else
    print_error "Backend is not responding"
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is responding"
else
    print_error "Frontend is not responding"
fi

# Check mock ARK
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    print_success "Mock ARK is responding"
else
    print_error "Mock ARK is not responding"
fi

echo ""
echo "================================================================"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "================================================================"
echo ""
echo -e "${BLUE}Service URLs:${NC}"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:4000"
echo "  Mock ARK:  http://localhost:8080"
echo "  n8n:       https://ark-at-scale.space/n8n"
echo ""
echo -e "${BLUE}View logs:${NC}"
echo ""
echo "  docker-compose -f docker-compose.cloud.yml logs -f"
echo ""
echo -e "${BLUE}Check status:${NC}"
echo ""
echo "  docker-compose -f docker-compose.cloud.yml ps"
echo ""
echo -e "${BLUE}Stop services:${NC}"
echo ""
echo "  docker-compose -f docker-compose.cloud.yml down"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Configure Nginx for HTTPS (see CLOUD-DEPLOYMENT-GUIDE.md)"
echo "  2. Import n8n workflow (platform/n8n-workflow-migration.json)"
echo "  3. Test a migration through the UI"
echo ""
