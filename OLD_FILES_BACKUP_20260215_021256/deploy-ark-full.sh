#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "================================================================"
echo "  Full ARK Deployment to Kubernetes"
echo "================================================================"
echo ""

# ==========================================
# Step 1: Install ARK CRDs
# ==========================================
echo -e "${BLUE}[1/5] Installing ARK Custom Resource Definitions${NC}"
echo ""

if kubectl get crd agents.ark.mckinsey.com &>/dev/null; then
    echo -e "${YELLOW}⚠ ARK CRDs already installed, updating...${NC}"
    kubectl apply -f ark/k8s/ark-crds.yaml
else
    echo -e "${BLUE}Installing ARK CRDs...${NC}"
    kubectl apply -f ark/k8s/ark-crds.yaml
fi

echo -e "${GREEN}✓ ARK CRDs installed${NC}"
echo ""

# ==========================================
# Step 2: Create API Key Secret (Optional)
# ==========================================
echo -e "${BLUE}[2/5] Setting up API Key${NC}"
echo ""

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo -e "${GREEN}✓ Using ANTHROPIC_API_KEY from environment${NC}"
    kubectl create secret generic anthropic-api-key \
        --from-literal=api-key="$ANTHROPIC_API_KEY" \
        --dry-run=client -o yaml | kubectl apply -f -
elif kubectl get secret anthropic-api-key -n default &>/dev/null; then
    echo -e "${GREEN}✓ API key secret already exists${NC}"
else
    echo -e "${YELLOW}⚠ No ANTHROPIC_API_KEY found${NC}"
    echo -e "${YELLOW}⚠ ARK will run without AI capabilities${NC}"
    echo ""
    echo "To enable AI features later, run:"
    echo "  export ANTHROPIC_API_KEY='your-key'"
    echo "  kubectl create secret generic anthropic-api-key --from-literal=api-key=\"\$ANTHROPIC_API_KEY\" -n default"
    echo ""
    # Create empty secret to prevent errors
    kubectl create secret generic anthropic-api-key \
        --from-literal=api-key="" \
        --dry-run=client -o yaml | kubectl apply -f -
fi

echo ""

# ==========================================
# Step 3: Deploy ARK Services
# ==========================================
echo -e "${BLUE}[3/5] Deploying ARK API and Dashboard${NC}"
echo ""

kubectl apply -f ark/k8s/ark-deployment.yaml

echo -e "${BLUE}Waiting for ARK pods to be ready...${NC}"
echo ""

# Wait for ark-api
kubectl wait --for=condition=ready pod -l app=ark-api -n default --timeout=120s || {
    echo -e "${YELLOW}⚠ ARK API taking longer than expected${NC}"
    kubectl describe pod -l app=ark-api -n default
}

# Wait for ark-dashboard
kubectl wait --for=condition=ready pod -l app=ark-dashboard -n default --timeout=60s || {
    echo -e "${YELLOW}⚠ ARK Dashboard taking longer than expected${NC}"
}

echo -e "${GREEN}✓ ARK services deployed${NC}"
echo ""

# ==========================================
# Step 4: Deploy ARK Agents
# ==========================================
echo -e "${BLUE}[4/5] Deploying ARK Agents${NC}"
echo ""

# Create default namespace if agents use it
kubectl create namespace default --dry-run=client -o yaml | kubectl apply -f -

# Deploy agents (these are just CRs, not actual running pods)
echo -e "${BLUE}Deploying agent configurations...${NC}"
for agent_file in ark/agents/*.yaml; do
    if [ -f "$agent_file" ] && [[ ! "$agent_file" =~ \.bak$ ]]; then
        agent_name=$(basename "$agent_file" .yaml)
        echo "  - $agent_name"
        kubectl apply -f "$agent_file" 2>&1 | grep -v "Warning:" || true
    fi
done

echo ""
echo -e "${GREEN}✓ ARK agents configured${NC}"
echo ""

# Show deployed agents
echo -e "${CYAN}Deployed agents:${NC}"
kubectl get agents -A 2>/dev/null || echo "No agents found (this is OK, they're configurations)"
echo ""

# ==========================================
# Step 5: Setup Port Forwarding
# ==========================================
echo -e "${BLUE}[5/5] Setting Up Port Forwarding${NC}"
echo ""

# Kill existing port-forwards
pkill -f "kubectl port-forward.*ark-api" || true
pkill -f "kubectl port-forward.*ark-dashboard" || true
sleep 2

# Create PID directory
mkdir -p ./.run-pids

# Port-forward ARK API
echo -e "${BLUE}Port-forwarding ARK API to localhost:8080...${NC}"
kubectl port-forward -n default svc/ark-api 8080:80 > ./.run-pids/ark-api-forward.log 2>&1 &
echo $! > ./.run-pids/ark-api-forward.pid
sleep 3

if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ARK API: http://localhost:8080${NC}"
else
    echo -e "${YELLOW}⚠ ARK API may not be ready yet${NC}"
fi

# Port-forward ARK Dashboard
echo -e "${BLUE}Port-forwarding ARK Dashboard to localhost:3001...${NC}"
kubectl port-forward -n default svc/ark-dashboard 3001:3000 > ./.run-pids/ark-dashboard-forward.log 2>&1 &
echo $! > ./.run-pids/ark-dashboard-forward.pid
sleep 2

if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ARK Dashboard: http://localhost:3001${NC}"
else
    echo -e "${YELLOW}⚠ ARK Dashboard may not be ready yet${NC}"
fi

echo ""
echo "================================================================"
echo -e "${GREEN}  ARK Deployment Complete!${NC}"
echo "================================================================"
echo ""
echo -e "${CYAN}🌐 Access Points:${NC}"
echo "  🤖 ARK API:        http://localhost:8080"
echo "  📊 ARK Dashboard:  http://localhost:3001"
echo ""
echo -e "${CYAN}📋 Useful Commands:${NC}"
echo "  View ARK pods:     kubectl get pods -l app=ark-api -n default"
echo "  View ARK logs:     kubectl logs -l app=ark-api -n default -f"
echo "  View agents:       kubectl get agents -A"
echo "  Test ARK API:      curl http://localhost:8080/health"
echo ""
echo -e "${CYAN}🔧 Next Steps:${NC}"
echo "  1. Run: ./RUN-SIMPLE.sh"
echo "  2. Access frontend: http://localhost:3000"
echo "  3. Start a migration!"
echo ""
echo -e "${YELLOW}📝 Note:${NC}"
echo "  - ARK is running as a mock service with Claude API"
echo "  - Set ANTHROPIC_API_KEY for full AI capabilities"
echo "  - Port-forwards run in background (PIDs in .run-pids/)"
echo ""
