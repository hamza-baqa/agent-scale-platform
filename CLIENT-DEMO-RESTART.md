# 🎯 CLIENT DEMO - ZERO ERROR RESTART GUIDE

## ✅ **AFTER LAPTOP SHUTDOWN - SINGLE COMMAND RESTART**

### **Step 1: Open Terminal**
```bash
cd ~/Desktop/Banque\ app\ 2/banque-app-transformed
```

### **Step 2: Run Single Command**
```bash
./RUN-SIMPLE.sh
```

### **Step 3: Wait ~2 minutes**
The script will:
- ✓ Check prerequisites (node, npm, kubectl, helm, minikube)
- ✓ Start Kubernetes cluster (if stopped)
- ✓ Install ARK v0.1.53 (if not installed)
- ✓ Configure OpenAI API key
- ✓ Deploy code-analyzer agent
- ✓ Set up port forwards (ARK API: 8080, ARK Dashboard: 3001)
- ✓ Start backend (port 4000)
- ✓ Start frontend (port 3000)

### **Step 4: Verify Everything is Running**
```bash
# Check all services (should all return OK)
curl -s http://localhost:4000/health | jq '.status'  # Backend
curl -s http://localhost:3000 > /dev/null && echo "Frontend OK"  # Frontend
curl -s http://localhost:8080/health > /dev/null && echo "ARK OK"  # ARK API
kubectl get agent code-analyzer -n default  # Should show "Ready"
```

---

## 🎬 **CLIENT DEMO - HOW TO USE**

### **1. Start Migration**
Open: **http://localhost:3000**

Enter repository: `https://github.com/hamza-baqa/banque-app`

Click **"Start Migration"**

### **2. Watch Live Progress**
You'll be redirected to the dashboard automatically.

**Features to show client:**
- ✨ **Agent Cards** animating (pending → running → completed)
- 📊 **Real-time Logs** (click agent → Logs tab)
- 🎨 **Professional Reports** with Mermaid diagrams
- 🔄 **Live Activity** across all migrations

### **3. View Results**
- **Code Analysis**: Click "code-analyzer" → "Agent Output" tab
  - See ERD diagrams, architecture analysis
  - Professional markdown report
  - Export as .md file

- **Migration Plan**: Click "migration-planner" → "Agent Output"
  - Microservices architecture
  - Micro-frontends breakdown

- **Generated Code**: Download button appears after validation passes

---

## 🚨 **TROUBLESHOOTING (If Errors Occur)**

### **Error: Port Already in Use**
```bash
./STOP-ALL.sh
./RUN-SIMPLE.sh
```

### **Error: Minikube Not Starting**
```bash
minikube delete
minikube start --driver=docker --kubernetes-version=v1.31.0
./RUN-SIMPLE.sh
```

### **Error: Agent Not Ready**
```bash
# Wait 30 seconds for model validation
kubectl get agent code-analyzer -n default --watch
# Should transition to "Ready" status
```

### **Check Logs**
```bash
# Backend logs
tail -f .run-pids/backend.log

# Frontend logs
tail -f .run-pids/frontend.log

# ARK API logs
kubectl logs -n default -l app=ark-api --tail=50
```

---

## 📋 **WHAT PERSISTS AFTER SHUTDOWN**

✅ **Minikube cluster** (stopped but configured)
✅ **ARK installation** (in Kubernetes)
✅ **Agent configurations** (Kubernetes resources)
✅ **OpenAI API key** (in Kubernetes secret)
✅ **Code** (all files on disk)
✅ **Node modules** (if already installed)

❌ **Running processes** (need to restart with script)
❌ **Port forwards** (need to restart with script)

---

## ⏱️ **EXPECTED TIMING**

- **Cold start** (after reboot): ~2 minutes
- **Warm start** (already running): ~10 seconds
- **Migration execution**: ~2-3 minutes (depends on repo size)

---

## 🎯 **DEMO CHECKLIST**

Before client arrives:

- [ ] Laptop fully charged
- [ ] Run `./RUN-SIMPLE.sh` to verify everything works
- [ ] Test one migration end-to-end
- [ ] Verify logs appear in real-time
- [ ] Check Mermaid diagrams render properly
- [ ] Have backup: `https://github.com/hamza-baqa/banque-app`

During demo:

- [ ] Show homepage (explain Agent@Scale concept)
- [ ] Start migration with client's repo (or example)
- [ ] Show live agent execution with logs
- [ ] Highlight professional report with diagrams
- [ ] Show migration plan visualization
- [ ] Demonstrate code download feature

---

## 🔗 **QUICK ACCESS URLs**

- **Platform**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **ARK Dashboard**: http://localhost:3001
- **ARK API**: http://localhost:8080
- **API Docs**: http://localhost:4000/api-docs
- **Health Check**: http://localhost:4000/health

---

## 💡 **PRO TIPS**

1. **Always use RUN-SIMPLE.sh** - Don't start services manually
2. **Stop before shutdown** - Run `./STOP-ALL.sh` before closing laptop (optional, but cleaner)
3. **Internet required** - OpenAI API calls need internet connection
4. **Docker must be running** - Minikube uses Docker driver
5. **Monitor logs** - Keep terminal open to see what's happening

---

## ✅ **SUCCESS INDICATORS**

Everything is working when you see:

```
✓ Minikube already running
✓ Official ARK is already installed
✓ OpenAI secret configured
✓ Agent 'code-analyzer' is Ready
✓ ARK API forwarded to http://localhost:8080
✓ ARK Dashboard forwarded to http://localhost:3001
✓ Backend started on http://localhost:4000
✓ Frontend started on http://localhost:3000
```

Then open http://localhost:3000 and start migrating!

---

**Last Updated**: 2026-02-11
**Tested**: ✅ Working with ZERO errors
