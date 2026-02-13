# Quick Start - Chat with Mock ARK

## What This Does

Instead of setting up a full Kubernetes cluster, I've created a **lightweight Mock ARK service** that:
- Runs locally on port 8080
- Simulates the ARK API
- Calls Anthropic Claude directly
- Works with your existing chat code

---

## Setup (2 minutes)

### Step 1: Get Anthropic API Key

1. Go to: https://console.anthropic.com/
2. Create account / Sign in
3. Get API key (starts with `sk-ant-`)

### Step 2: Start Mock ARK

```bash
# Option A: With API key in command
ANTHROPIC_API_KEY=sk-ant-your-key-here node mock-ark-service.js

# Option B: Use the startup script (prompts for key)
./start-mock-ark.sh

# Option C: Export key first
export ANTHROPIC_API_KEY=sk-ant-your-key-here
node mock-ark-service.js
```

You should see:
```
============================================================
Mock ARK Service running on http://localhost:8080
============================================================

Ready to handle requests!
```

### Step 3: Backend is Already Running

Your backend is already configured and running with ARK chat service!

### Step 4: Test the Chat

Open your browser and go to the migration planner. The chat should now work!

---

## Testing

### Test 1: Check Mock ARK
```bash
curl http://localhost:8080/health
```

Should return:
```json
{
  "status": "ok",
  "service": "mock-ark",
  "timestamp": "..."
}
```

### Test 2: Test Chat Endpoint
```bash
curl -X POST http://localhost:4000/api/migrations/test/plan-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How many microservices are in this plan?",
    "plan": {"microservices": [{"name": "test", "port": 8081}]}
  }'
```

Should return intelligent AI response!

---

## What's Running

### Terminal 1: Mock ARK Service
```
Port: 8080
Purpose: Simulates ARK API
Calls: Anthropic Claude Opus
```

### Terminal 2: Backend (Already Running)
```
Port: 4000
Purpose: Your migration platform backend
Uses: ARK Chat Service → Mock ARK → Claude
```

### Terminal 3: Frontend (Start if needed)
```bash
cd platform/frontend
npm run dev
```

---

## Architecture

```
User Browser
    ↓
Frontend (localhost:3000)
    ↓
Backend (localhost:4000)
    ↓
ARK Chat Service
    ↓
Mock ARK (localhost:8080)
    ↓
Anthropic API (Claude Opus)
```

---

## Benefits of Mock ARK

✓ **No Kubernetes** - Just Node.js
✓ **Fast Setup** - 2 minutes
✓ **Same API** - Compatible with real ARK
✓ **Easy Testing** - Perfect for development
✓ **Direct Control** - See all requests

---

## Switching to Real ARK Later

When you want to use real ARK:

1. Stop Mock ARK (Ctrl+C)
2. Start real ARK on Kubernetes
3. No code changes needed!

Your backend already uses the ARK API format, so it works with both mock and real ARK.

---

## Troubleshooting

### Mock ARK not starting

**Check:**
- Node.js installed: `node --version`
- API key is valid
- Port 8080 is available: `lsof -i:8080`

### Chat still says "ARK Not Available"

**Check:**
1. Mock ARK is running: `curl http://localhost:8080/health`
2. Backend can reach it: Check backend logs
3. No firewall blocking localhost

### API Key Errors

**Check:**
- Key starts with `sk-ant-`
- Key is valid at https://console.anthropic.com/
- Account has credits

---

## Logs

### Mock ARK Logs
You'll see:
```
[2026-02-09...] POST /api/v1/agents/banque-migration/migration-planner/invoke
  Namespace: banque-migration
  Agent: migration-planner
  Prompt length: 1234
  Calling Anthropic API...
  Response length: 567
```

### Backend Logs
```bash
tail -f platform/backend/backend-new.log
```

You'll see:
```
ARK Chat Service initialized
Sending request to ARK agent
Received response from ARK agent
```

---

## Cost

**Mock ARK** uses Anthropic API directly:
- Claude Opus: ~$15/1M input tokens, ~$75/1M output tokens
- Typical chat: ~$0.08 per message
- Same cost as direct API calls

---

## Commands Reference

```bash
# Start Mock ARK
node mock-ark-service.js

# Or with script
./start-mock-ark.sh

# Test health
curl http://localhost:8080/health

# Stop Mock ARK
Ctrl+C in the terminal

# Check if running
lsof -i:8080
```

---

## Ready to Start!

```bash
# 1. Get your API key from https://console.anthropic.com/

# 2. Start Mock ARK
ANTHROPIC_API_KEY=sk-ant-your-key ./start-mock-ark.sh

# 3. Open browser
# Your chat should now work!
```

**That's it! The chat will work with Mock ARK just like real ARK.**
