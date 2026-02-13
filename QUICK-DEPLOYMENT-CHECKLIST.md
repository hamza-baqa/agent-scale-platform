# Quick Deployment Checklist

> Print this and check off as you go!

## ☐ Step 1: Export n8n Workflow (5 minutes)

```bash
# In your local n8n (http://localhost:5678)
1. Open your workflow
2. Click "..." menu → Download
3. Save as: migration-workflow-with-ark-agents.json
4. Move to project folder
```

**Location**: Should be in `platform/migration-workflow-with-ark-agents.json`

---

## ☐ Step 2: Upload to Cloud (10 minutes)

```bash
# From local machine
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"

rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='platform/backend/workspace' \
  . user@ark-at-scale.space:/opt/agent-scale-platform/
```

**Verify**: SSH into server and check files exist

---

## ☐ Step 3: Deploy ARK Agents (5 minutes)

```bash
# On cloud server
ssh user@ark-at-scale.space
cd /opt/agent-scale-platform

# Deploy agents
kubectl create namespace banque-migration
kubectl apply -f ark/agents/code-analyzer.yaml
kubectl apply -f ark/agents/migration-planner.yaml
kubectl apply -f ark/agents/service-generator.yaml
kubectl apply -f ark/agents/frontend-migrator.yaml
kubectl apply -f ark/agents/quality-validator.yaml

# Verify
kubectl get agents -n banque-migration
```

**Expected**: 5 agents listed

---

## ☐ Step 4: Deploy Platform (15 minutes)

```bash
# On cloud server
cd /opt/agent-scale-platform

# Create environment file
cat > .env.production <<EOF
JWT_SECRET=$(openssl rand -hex 32)
DOMAIN=ark-at-scale.space
N8N_WEBHOOK_URL=https://ark-at-scale.space/n8n/webhook/migration
POSTGRES_PASSWORD=$(openssl rand -hex 16)
EOF

# Start Ollama and download model
docker-compose -f docker-compose.cloud.yml up -d ollama
sleep 10
docker exec agent-scale-ollama ollama pull llama3

# Start all services
docker-compose -f docker-compose.cloud.yml up -d --build

# Verify
docker-compose -f docker-compose.cloud.yml ps
curl http://localhost:4000/health
curl http://localhost:3000
```

**Expected**: All containers "Up (healthy)"

---

## ☐ Step 5: Import Workflow to n8n (10 minutes)

```bash
# In browser
1. Go to: https://ark-at-scale.space/n8n
2. Login with your credentials
3. Click "+" → Import from File
4. Select: migration-workflow-with-ark-agents.json
5. Click Import

# Configure each ARK Agent node:
- Click node → Set ARK API URL
- Set namespace: banque-migration
- Save

# Activate workflow
- Toggle switch to ON
- Copy webhook URL
```

**Webhook URL**: `https://ark-at-scale.space/n8n/webhook/migration`

---

## ☐ Step 6: Test Deployment (5 minutes)

```bash
# Test webhook
curl -X POST https://ark-at-scale.space/n8n/webhook/migration \
  -H "Content-Type: application/json" \
  -d '{"repositoryPath": "/opt/test-repo"}'

# Check n8n executions
# Go to: https://ark-at-scale.space/n8n/executions

# View logs
docker-compose -f docker-compose.cloud.yml logs -f backend
```

**Expected**: Workflow executes without errors

---

## ✅ Final Verification

- [ ] Platform accessible: `https://ark-at-scale.space`
- [ ] Backend health: `curl https://ark-at-scale.space/api/health`
- [ ] n8n workflow active
- [ ] ARK agents deployed: `kubectl get agents -n banque-migration`
- [ ] Test migration completes
- [ ] WebSocket updates work in frontend
- [ ] All Docker containers healthy

---

## 🚨 If Something Goes Wrong

### Platform won't start
```bash
docker-compose -f docker-compose.cloud.yml logs
docker-compose -f docker-compose.cloud.yml restart
```

### n8n can't reach ARK agents
```bash
kubectl get agents -n banque-migration
kubectl describe agent code-analyzer -n banque-migration
```

### Workflow execution fails
- Check n8n executions tab for error details
- Verify ARK agent node configuration
- Check ARK API URL is correct

---

## 📋 Total Time: ~50 minutes

1. Export workflow: 5 min
2. Upload to cloud: 10 min
3. Deploy ARK agents: 5 min
4. Deploy platform: 15 min
5. Import to n8n: 10 min
6. Test: 5 min

---

## 📞 Commands Reference

```bash
# View logs
docker-compose -f docker-compose.cloud.yml logs -f backend

# Restart service
docker-compose -f docker-compose.cloud.yml restart backend

# Check ARK agents
kubectl get agents -n banque-migration

# Check containers
docker-compose -f docker-compose.cloud.yml ps

# Test backend
curl http://localhost:4000/health

# Test n8n webhook
curl -X POST https://ark-at-scale.space/n8n/webhook/migration \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

**Ready to deploy!** Follow the detailed guide in `DEPLOY-TO-CLOUD.md` if you need more information.
