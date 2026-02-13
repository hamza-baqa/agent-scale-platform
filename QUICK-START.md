# 🚀 Quick Start Guide

## After Laptop Restart - Just One Command!

```bash
cd ~/Desktop/Banque\ app\ 2/banque-app-transformed
./RUN-SIMPLE.sh
```

## ✅ What You'll Get

After running the script, you'll have **exactly the same setup** as today:

### **Services Running:**
- ✅ **ARK Dashboard** - http://localhost:3001
- ✅ **Frontend** - http://localhost:3000
- ✅ **Backend** - http://localhost:4000
- ✅ **ARK API** - http://localhost:8080

### **Infrastructure:**
- ✅ **Minikube** - Kubernetes v1.31.0
- ✅ **Official ARK** - v0.1.53
- ✅ **OpenAI Model** - gpt-4o-mini (configured)

### **Agent:**
- ✅ **code-analyzer** - Available with beautiful output formatting

## ⏱️ Startup Time

- **First run:** ~2-3 minutes (installs everything)
- **After restart:** ~1 minute (everything already installed)

## 🎯 Current Setup (Today)

```
Migration Platform
├── Kubernetes (Minikube)
│   ├── Official ARK v0.1.53
│   │   ├── ARK Controller ✓
│   │   ├── ARK API ✓
│   │   ├── ARK Dashboard ✓
│   │   └── ARK MCP ✓
│   ├── Model: default (gpt-4o-mini) ✓
│   └── Agent: code-analyzer ✓
├── Backend (Node.js) ✓
├── Frontend (Next.js) ✓
└── Port Forwards ✓
```

## 📝 What Persists After Laptop Shutdown

### ✅ **Persists (Stored on Disk):**
- Minikube cluster configuration
- ARK installation (all components)
- Kubernetes resources:
  - code-analyzer agent
  - default model
  - openai-secret (your API key)
- Your project code
- npm packages

### ❌ **Doesn't Persist (Gets Recreated):**
- Running Node.js processes
- Port-forward connections
- Temporary log files

## 🔄 Full Workflow

```bash
# 1. After laptop restart
cd ~/Desktop/Banque\ app\ 2/banque-app-transformed

# 2. Start everything
./RUN-SIMPLE.sh

# 3. Wait ~1 minute (everything starts automatically)

# 4. Access your services
# ARK Dashboard: http://localhost:3001
# Frontend:      http://localhost:3000
```

## 🛑 To Stop Everything

```bash
./STOP-ALL.sh
```

This stops:
- Backend & Frontend
- Port-forwards
- (But keeps minikube running for faster restart)

## 📊 Verify Your Setup

```bash
# Check everything is running
curl http://localhost:8080/health  # ARK API
curl http://localhost:4000/health  # Backend
curl http://localhost:3000         # Frontend
curl http://localhost:3001         # Dashboard

# Check agent status
kubectl get agents -n default
# Expected: code-analyzer   default   True

# Check model status
kubectl get models -n default
# Expected: default   completions   openai   gpt-4o-mini   True

# ARK status
ark status
# Expected: All services healthy ✓
```

## 💡 Pro Tips

1. **Bookmark these URLs:**
   - ARK Dashboard: http://localhost:3001
   - Your Platform: http://localhost:3000

2. **Check logs if needed:**
   ```bash
   tail -f ./.run-pids/backend.log
   tail -f ./.run-pids/frontend.log
   ```

3. **Quick restart without laptop shutdown:**
   ```bash
   ./STOP-ALL.sh
   ./RUN-SIMPLE.sh
   ```

## 🎯 Summary

**YES!** Running `./RUN-SIMPLE.sh` after turning off and restarting your laptop will give you **EXACTLY** the same setup:

- ✅ Same ARK Dashboard on port 3001
- ✅ Same code-analyzer agent (with beautiful output)
- ✅ Same OpenAI model configured
- ✅ Same frontend and backend
- ✅ Same ports (3000, 4000, 8080, 3001)

**You're all set! Just run the script and everything comes back.** 🚀
