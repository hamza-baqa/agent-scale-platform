# 🔧 Fix 303 Error

## Problem
Getting HTTP 303 (redirect) when calling the webhook.

## Causes of 303 Error

### 1. ❌ Workflow is NOT Active
**This is the most common cause!**

### 2. ❌ Wrong webhook URL

### 3. ❌ Workflow not saved yet

---

## ✅ Solution - Step by Step

### Step 1: Check if Workflow is Active

1. Go to: https://ark-at-scale.space/n8n
2. Open your workflow
3. Look at **top-right corner**
4. Find the **"Active"** toggle switch
5. **Is it ON (blue/green)?**
   - ✅ **YES** → Continue to Step 2
   - ❌ **NO** → **Toggle it ON**, then test again

**THIS IS THE MOST COMMON ISSUE!**

---

### Step 2: Get the CORRECT Webhook URL

1. In your workflow, click on **"Webhook Trigger"** (first node)
2. Look for **"Webhook URLs"** section
3. You'll see two URLs:

   **Test URL** (for testing in n8n editor):
   ```
   https://ark-at-scale.space/n8n/webhook-test/XXXXX
   ```

   **Production URL** (for real use):
   ```
   https://ark-at-scale.space/n8n/webhook/XXXXX
   ```

4. **Copy the Production URL** (the one WITHOUT "-test")

5. **IMPORTANT**: The URL should look like:
   ```
   https://ark-at-scale.space/n8n/webhook/migration-ark
   ```

---

### Step 3: Test with the Correct URL

Use the exact URL from the Webhook Trigger node:

```bash
# Replace with YOUR actual webhook URL from the node
curl -v -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }'
```

**Note**: The `-v` flag shows verbose output so you can see the full response.

---

## 🔍 Debugging the 303 Error

### Check the Full Response

Run this to see where it's redirecting:

```bash
curl -v -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
  }' 2>&1 | grep -i location
```

This shows you the redirect URL.

---

## 🎯 Common Issues

### Issue 1: Workflow Not Active

**Error**: HTTP 303 redirect to n8n login or workflow page

**Fix**:
1. Open workflow in n8n
2. Toggle "Active" switch **ON**
3. Save workflow
4. Try webhook again

---

### Issue 2: Wrong Webhook Path

**Error**: HTTP 303 or 404

**Fix**:
- Don't use `/webhook-test/` (that's for testing only)
- Use `/webhook/` (production)
- Get URL from Webhook Trigger node

---

### Issue 3: Workflow Not Saved

**Error**: HTTP 303 redirect

**Fix**:
1. Click "Save" button
2. Activate workflow
3. Try webhook again

---

### Issue 4: Authentication Required

**Error**: HTTP 303 redirect to login

**Fix**:
This shouldn't happen for webhooks, but if it does:
1. Check if n8n requires authentication for webhooks
2. Add authentication to Webhook Trigger node:
   - Click "Webhook Trigger" node
   - Enable "Authentication"
   - Set credentials

---

## ✅ Step-by-Step Fix Process

### 1. Verify Workflow Status

```bash
# In n8n UI:
# 1. Go to Workflows
# 2. Find "Banque App Migration"
# 3. Check if it shows "Active" badge
```

### 2. Get Exact Webhook URL

```bash
# In n8n UI:
# 1. Open your workflow
# 2. Click "Webhook Trigger" node
# 3. Copy "Production URL"
```

### 3. Test the Webhook

```bash
# Use YOUR webhook URL from step 2
curl -v -X POST YOUR_WEBHOOK_URL_HERE \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}'
```

### 4. Check Response

**Expected (Success):**
```
< HTTP/1.1 200 OK
or
< HTTP/1.1 201 Created
```

**If you see:**
```
< HTTP/1.1 303 See Other
```
→ Workflow is not active!

---

## 🎬 Test in n8n UI First

Before testing with curl, test directly in n8n:

1. Open your workflow
2. Make sure it's **Active**
3. Click **"Execute Workflow"** button (top)
4. Select **"Using test data"**
5. Enter this JSON:
   ```json
   {
     "body": {
       "repositoryUrl": "https://github.com/hamza-baqa/banque-app"
     }
   }
   ```
6. Click **"Execute Workflow"**
7. Watch it run!

**If this works** → The workflow is fine, just use the correct webhook URL

**If this fails** → There's a configuration issue in the workflow

---

## 📋 Checklist

- [ ] Workflow is **Active** (toggle ON, shows blue/green)
- [ ] Workflow is **Saved**
- [ ] Using **Production URL** (not test URL)
- [ ] URL copied from "Webhook Trigger" node
- [ ] URL ends with `/webhook/migration-ark` (not `/webhook-test/`)
- [ ] Can see the workflow in "Workflows" list
- [ ] Workflow shows "Active" badge

---

## 🎯 Quick Fix Commands

### Get webhook status:
```bash
curl -I -X POST https://ark-at-scale.space/n8n/webhook/migration-ark
```

### Test with verbose output:
```bash
curl -v -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}'
```

### Follow redirects (see where it goes):
```bash
curl -L -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}'
```

---

## 🚨 Most Common Fix

**90% of the time, the issue is:**

### ⚠️ Workflow is NOT Active!

**Fix:**
1. Go to https://ark-at-scale.space/n8n
2. Open your workflow
3. Look for "Active" toggle (top right)
4. Click it to turn **ON**
5. It should turn **blue/green**
6. Try webhook again

**That's it!** 🎉

---

## ✅ Verify It Works

After activating, test:

```bash
curl -X POST https://ark-at-scale.space/n8n/webhook/migration-ark \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl":"https://github.com/hamza-baqa/banque-app"}'
```

**Expected response:**
```json
{
  "success": true,
  "status": "running",
  ...
}
```

**Not 303!** ✅
