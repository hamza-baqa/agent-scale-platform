# 🔄 Restart Guide - Getting Back to Your Setup

## What Happens When You Turn Off Your Laptop

When you shut down your laptop, the following happens:
- ✅ **Minikube cluster is saved** (Docker containers persist)
- ✅ **ARK installation in Kubernetes persists** (stored in Docker volumes)
- ✅ **Agents persist** (Kubernetes resources)
- ✅ **Models persist** (Kubernetes resources)
- ✅ **Secrets persist** (including your OpenAI API key)
- ❌ **Backend/Frontend processes stop** (need to restart)
- ❌ **Port-forwards stop** (need to restart)

## ✅ Quick Restart - One Command

After turning your laptop back on:

```bash
cd ~/Desktop/Banque\ app\ 2/banque-app-transformed
./RUN-SIMPLE.sh
```

That's it! The script will:
1. ✓ Detect minikube is stopped → Start it
2. ✓ Detect ARK is installed → Skip reinstallation
3. ✓ Detect agents exist → Skip redeployment
4. ✓ Detect model exists → Skip recreation
5. ✓ Restore API key secret
6. ✓ Setup port-forwards
7. ✓ Start backend & frontend

## What You'll See

```bash
🚀 Starting Agent@Scale Platform with Official ARK v0.1.53...

[1/7] Checking Prerequisites
✓ Node.js: v22.22.0
✓ npm: 10.9.4
✓ kubectl: v1.35.0
✓ helm: v3.20.0
✓ minikube: v1.38.0

[2/7] Starting Kubernetes Cluster
Starting minikube with Kubernetes v1.31.0...
✓ Minikube started

[3/7] Installing Official ARK v0.1.53
✓ ARK CLI already installed (v0.1.53)
✓ Official ARK is already installed

[4/7] Configuring Model and Deploying Agents
🔑 Configuring OpenAI API Key...
✓ OpenAI secret configured
🧠 Creating default Model...
✓ Model 'default' already exists
🤖 Deploying Code Analyzer Agent...
  ✓ Agent 'code-analyzer' already exists

⏳ Waiting for model validation (30 seconds)...
✓ Model validated successfully

[5/7] Cleaning Up Previous Processes
✓ Previous processes cleaned up

[6/7] Setting Up Port Forwards
✓ ARK API forwarded to http://localhost:8080
✓ ARK Dashboard forwarded to http://localhost:3001

[7/7] Starting Backend & Frontend Services
Waiting for backend to start...
✓ Backend started on http://localhost:4000
Waiting for frontend to start...
✓ Frontend started on http://localhost:3000

════════════════════════════════════════════════════════════════
🎉 Agent@Scale Platform with Official ARK v0.1.53 is Running!
════════════════════════════════════════════════════════════════

📍 Access Points:
   • Migration Platform: http://localhost:3000
   • Backend API:        http://localhost:4000
   • ARK Dashboard:      http://localhost:3001
   • ARK API:            http://localhost:8080

🤖 Active Agent:
   • code-analyzer        [✓ Available]
```

## Verification After Restart

Run these commands to verify everything is working:

```bash
# Check minikube status
minikube status

# Check ARK installation
ark status

# Check agents
kubectl get agents -n default
ark agents

# Check model
kubectl get models -n default

# Test services
curl http://localhost:8080/health  # ARK API
curl http://localhost:4000/health  # Backend
curl http://localhost:3000         # Frontend
curl http://localhost:3001         # ARK Dashboard
```

## Expected Status

### Kubernetes Resources:
```bash
$ kubectl get agents -n default
NAME            MODEL     AVAILABLE   AGE
code-analyzer   default   True        45m

$ kubectl get models -n default
NAME      TYPE          PROVIDER   MODEL         AVAILABLE   AGE
default   completions   openai     gpt-4o-mini   True        45m

$ kubectl get pods -n default | grep ark
ark-api-xxx              1/1     Running   0          45m
ark-dashboard-xxx        1/1     Running   0          45m
ark-broker-xxx           1/1     Running   0          45m
ark-mcp-xxx              1/1     Running   0          45m
```

### ARK Status:
```bash
$ ark status
✓ ark-controller ready
✓ ark-api healthy
✓ ark-dashboard healthy
✓ Model 'default' available
✓ Agent 'code-analyzer' available
```

## Troubleshooting

### Issue 1: Minikube Won't Start

**Problem:** `minikube start` fails

**Solution:**
```bash
# Delete and recreate cluster
minikube delete
minikube start --driver=docker --kubernetes-version=v1.31.0

# Then run the script
./RUN-SIMPLE.sh
```

### Issue 2: ARK Not Responding

**Problem:** ARK API returns errors

**Solution:**
```bash
# Restart ARK pods
kubectl delete pod -l app.kubernetes.io/name=ark-api -n default
kubectl delete pod -l app.kubernetes.io/name=ark-dashboard -n default

# Wait for pods to restart (30 seconds)
kubectl get pods -n default | grep ark

# Restart port-forwards
./RUN-SIMPLE.sh  # Will restart port-forwards
```

### Issue 3: Agent Not Available

**Problem:** `code-analyzer` shows `AVAILABLE: False`

**Solution:**
```bash
# Check model status
kubectl get model default -n default

# If model is not available, check secret
kubectl get secret openai-secret -n default

# Recreate secret if needed
kubectl delete secret openai-secret -n default
./RUN-SIMPLE.sh  # Will recreate secret
```

### Issue 4: Port Already in Use

**Problem:** Port 3000, 4000, 8080, or 3001 is busy

**Solution:**
```bash
# Kill processes on ports
./STOP-ALL.sh

# Or manually:
fuser -k 3000/tcp
fuser -k 4000/tcp
fuser -k 8080/tcp
fuser -k 3001/tcp

# Then restart
./RUN-SIMPLE.sh
```

## Persistent Data Locations

Your setup is stored in:

```
~/.minikube/               # Minikube cluster data
~/.kube/config             # Kubernetes configuration
~/.npm-global/             # ARK CLI installation
~/Desktop/Banque app 2/    # Your project files
  └── banque-app-transformed/
      ├── .run-pids/       # Process IDs (temporary)
      ├── platform/        # Your code
      └── RUN-SIMPLE.sh    # Startup script
```

## API Key Security

Your OpenAI API key is stored in:
- **Script:** `RUN-SIMPLE.sh` (line 137)
- **Kubernetes:** Secret `openai-secret` in `default` namespace

**To use environment variable instead:**

1. Create `.env` file:
```bash
cat > .env <<EOF
OPENAI_API_KEY=sk-proj-YOUR-KEY-HERE
EOF
```

2. Load before running:
```bash
source .env
./RUN-SIMPLE.sh
```

## Complete Shutdown Procedure

When you want to fully stop everything:

```bash
# Stop all services
./STOP-ALL.sh

# Stop minikube (optional - keeps data)
minikube stop

# Or delete minikube (removes everything)
minikube delete
```

## Quick Reference Card

| Action | Command |
|--------|---------|
| **Start Everything** | `./RUN-SIMPLE.sh` |
| **Stop Everything** | `./STOP-ALL.sh` |
| **Check Status** | `ark status` |
| **View Agents** | `ark agents` |
| **View Logs** | `tail -f ./.run-pids/backend.log` |
| **ARK Dashboard** | http://localhost:3001 |
| **Frontend** | http://localhost:3000 |

## Summary

✅ **YES** - Running `./RUN-SIMPLE.sh` after laptop restart will:
- Restore your exact setup
- Keep your code-analyzer agent
- Maintain your OpenAI API key
- Start all services on the same ports
- Give you the same ARK Dashboard at port 3001

✅ **Your data persists across restarts:**
- Minikube cluster configuration
- ARK installation
- Kubernetes resources (agents, models, secrets)
- Your project code

❌ **What doesn't persist (but gets recreated):**
- Running processes (backend/frontend)
- Port-forward connections
- Temporary logs

**Bottom line: Just run `./RUN-SIMPLE.sh` and you'll be back to exactly where you are now!** 🚀
