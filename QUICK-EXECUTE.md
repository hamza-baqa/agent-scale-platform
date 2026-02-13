# ⚡ Quick Execute - 5 Steps

## Your Repository: `https://github.com/hamza-baqa/banque-app`

---

## 🚀 Execute in 5 Steps (5 minutes setup)

### ① Login
```
Go to: https://ark-at-scale.space/n8n
Login with your credentials
```

---

### ② Import
```
1. Click "Workflows" (left sidebar)
2. Click "+ Add workflow" (top right)
3. Click "⋮" menu → "Import from File"
4. Select: platform/n8n-workflow-cloud.json
5. Workflow appears with 21 nodes ✅
```

---

### ③ Save & Activate
```
1. Click "Save" (top right)
2. Name it: "Banque App Migration"
3. Toggle "Active" switch ON (turns blue/green)
4. Status shows "Active" ✅
```

---

### ④ Trigger
```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}'
```

---

### ⑤ Monitor
```
1. Click "Executions" (left sidebar)
2. See your running execution
3. Watch nodes turn green
4. Wait 10-15 minutes
5. Done! ✅
```

---

## 🎯 That's It!

**Everything is pre-configured in the workflow file!**
- ✅ Repository URL: Your repo
- ✅ ARK API: Cloud URL
- ✅ All settings: Ready
- ✅ Just: Import → Activate → Execute

---

## 📊 Execution Timeline

```
[Start] Webhook triggered
   ↓ (2-3 min)
[Running] Code Analyzer analyzing...
   ↓ (3-5 min)
[Running] Migration Planner planning...
   ↓ (5-8 min)
[Running] Service + Frontend generating...
   ↓ (3-5 min)
[Running] Quality Validator validating...
   ↓
[Done!] Migration complete! 🎉
```

**Total: 10-15 minutes**

---

## 🔍 Check Progress

**URL**: `https://ark-at-scale.space/n8n/executions`

You'll see:
- 🟢 Green = Completed
- 🟡 Yellow = Running now
- ⚪ Gray = Waiting
- 🔴 Red = Error

---

## ⚠️ If Error Occurs

**Most common**: ARK agents not deployed

**Fix**:
```bash
kubectl get agents -n banque-migration

# If not found:
kubectl apply -f ark/agents/
```

---

## ✅ Quick Checklist

- [ ] Login to n8n
- [ ] Import workflow
- [ ] Activate (toggle ON)
- [ ] Trigger with curl
- [ ] Monitor in Executions
- [ ] Wait 10-15 min
- [ ] Get results!

---

## 🎉 Your Repository is Ready to Migrate!

**Just follow the 5 steps above!** ⚡
