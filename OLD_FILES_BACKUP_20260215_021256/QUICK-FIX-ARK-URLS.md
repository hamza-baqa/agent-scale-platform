# Quick Fix - Update ARK API URLs

## 🎯 Problem
ARK Agent nodes can't connect to ARK API.

## ✅ Solution - Update All 5 ARK Nodes

You need to update the URL in these 5 nodes:

### 1. ARK Agent: Code Analyzer
1. Click on the node
2. Find **"URL"** field
3. Update to your ARK API endpoint

### 2. ARK Agent: Migration Planner
1. Click on the node
2. Update **"URL"** field

### 3. ARK Agent: Service Generator
1. Click on the node
2. Update **"URL"** field

### 4. ARK Agent: Frontend Migrator
1. Click on the node
2. Update **"URL"** field

### 5. ARK Agent: Quality Validator
1. Click on the node
2. Update **"URL"** field

---

## 🔍 What URL Should I Use?

### Option 1: Find Your ARK API URL

Run this script:
```bash
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"
./check-ark-url.sh
```

### Option 2: Common ARK API URLs

Try these (in order):

**If ARK is on same domain:**
```
https://ark-at-scale.space/ark-api/v1/agents/execute
```

**If ARK is on Kubernetes (internal):**
```
http://ark-api.ark-system.svc.cluster.local:80/v1/agents/execute
```

**If ARK is on different subdomain:**
```
https://ark.ark-at-scale.space/v1/agents/execute
```

---

## 📝 How to Update Each Node

### Step-by-Step:

1. **Click on the node** (e.g., "ARK Agent: Code Analyzer")

2. **Find the URL field** in the settings panel (right side)

3. **Update the URL** to your ARK API endpoint

4. **Example configuration**:
   ```
   URL: https://ark-at-scale.space/ark-api/v1/agents/execute
   Method: POST
   Authentication: None (or configure if needed)
   ```

5. **Click away** or press Enter to save

6. **Repeat for all 5 ARK Agent nodes**

7. **Click "Save"** (top right)

---

## 🧪 Test ARK Connection

After updating, test if ARK API works:

```bash
# Replace with your ARK API URL
curl -X POST https://ark-at-scale.space/ark-api/v1/agents/execute \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": "banque-migration",
    "agent": "code-analyzer",
    "input": {"test": true}
  }'
```

**Expected response:**
- HTTP 200 or 201
- JSON response with execution details

**If you get an error:**
- 404 → Wrong URL
- 401 → Need authentication
- 500 → ARK agent doesn't exist

---

## ✅ After Updating

1. **Save the workflow** (top right)
2. **Execute again** (click "Execute Workflow")
3. **Watch for errors**

If errors persist, check:
- ARK agents are deployed: `kubectl get agents -n banque-migration`
- ARK API is accessible
- URLs are correct in all 5 nodes

---

## 🎯 Quick Checklist

- [ ] Updated "ARK Agent: Code Analyzer" URL
- [ ] Updated "ARK Agent: Migration Planner" URL
- [ ] Updated "ARK Agent: Service Generator" URL
- [ ] Updated "ARK Agent: Frontend Migrator" URL
- [ ] Updated "ARK Agent: Quality Validator" URL
- [ ] Saved workflow
- [ ] Tested ARK API with curl
- [ ] Re-executed workflow

---

**Once all URLs are correct, the workflow will run successfully!** 🚀
