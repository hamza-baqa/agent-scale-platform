# Demo Behavior - What to Expect

## ✅ What Works (UI Demo Mode)

### Landing Page
1. **Visit**: http://localhost:3000
2. **Enter**: Any GitHub URL (e.g., `https://github.com/facebook/react`)
3. **Click**: "Start Migration" button
4. **Result**: Automatically redirects to dashboard

### Dashboard
1. **URL**: http://localhost:3000/dashboard?id=xxx (auto-navigates)
2. **Displays**:
   - Migration ID
   - Repository URL
   - 5 Agent Progress Cards:
     1. Code Analyzer
     2. Migration Planner
     3. Service Generator
     4. Frontend Migrator
     5. Quality Validator
3. **Shows**: All agents in "Pending" state (gray)
4. **Displays**: WebSocket connection status

## ⚠️ What Doesn't Work (Expected in Demo Mode)

### Actual Migration Processing
- ❌ Repository cloning (requires git credentials)
- ❌ ARK agent execution (requires Kubernetes + ARK)
- ❌ Code generation (requires n8n workflow)
- ❌ Real-time progress updates (requires full stack)

**Why?** You're running in **UI Demo Mode** - only frontend and backend API are running, without:
- Kubernetes cluster
- ARK agents deployed
- n8n workflow engine
- Agent orchestration

## 🎯 What You Should See

### Step-by-Step Test

1. **Open**: http://localhost:3000
2. **Type**: `https://github.com/microsoft/TypeScript`
3. **Click**: "Start Migration"

**Expected Result:**
```
URL changes to: http://localhost:3000/dashboard?id=abc-123-xyz

Dashboard shows:
┌────────────────────────────────────────────┐
│ Migration Dashboard                        │
│ ID: abc-123-xyz                            │
│                                            │
│ Repository: https://github.com/.../...    │
│ Status: Cloning                            │
│                                            │
│ ① Code Analyzer       ⏸ Pending           │
│ ② Migration Planner   ⏸ Pending           │
│ ③ Service Generator   ⏸ Pending           │
│ ④ Frontend Migrator   ⏸ Pending           │
│ ⑤ Quality Validator   ⏸ Pending           │
│                                            │
│ 🟢 Live updates enabled                    │
└────────────────────────────────────────────┘
```

## 🐛 Debugging Tips

### If nothing happens when clicking:

1. **Open Browser Dev Tools** (F12)
2. **Go to Console tab**
3. **Click "Start Migration"**
4. **Look for**:
   - POST request to `/api/migrations`
   - Navigation event
   - Any error messages

### If you see errors:

```javascript
// Console should show:
POST http://localhost:4000/api/migrations 201 (Created)
Navigating to: /dashboard?id=xxx
```

### Backend Health Check

```bash
# Check backend is responding
curl http://localhost:4000/health

# Should return:
{"status":"ok","timestamp":"...","uptime":123.45,"environment":"development"}
```

## 📸 Screenshots Guide

### Landing Page
- Blue-indigo gradient background
- White "Start Migration Demo" card
- Repository URL input field
- Blue "Start Migration" button
- 3 feature cards below

### Dashboard
- White header with "Migration Dashboard"
- Status card showing repository
- 5 numbered agent cards (gray "Pending" badges)
- Green dot "Live updates enabled" at bottom

## 🎨 Visual Verification

### You know it's working if:
✅ URL changes when you click Start Migration
✅ Dashboard page loads with agent cards
✅ Each agent has a numbered circle (①②③④⑤)
✅ All agents show "Pending" status (gray badge)
✅ WebSocket indicator shows green dot
✅ Repository URL is displayed at top

### Something's wrong if:
❌ Button does nothing when clicked
❌ No URL change
❌ Blank page loads
❌ Console shows errors
❌ Backend returns 500 error

## 🚀 For Full Functionality

To see actual AI-powered migrations:

1. **Deploy Kubernetes cluster**
2. **Install ARK** on Kubernetes
3. **Deploy ARK agents** (from `ark/agents/`)
4. **Install n8n** with ARK custom nodes
5. **Import workflow** to n8n
6. **Configure** n8n webhook URL in backend

See `SETUP-DEMO-PLATFORM.md` for complete instructions.

## 📋 Quick Test Checklist

```
□ Backend running on port 4000
□ Frontend running on port 3000
□ http://localhost:3000 loads
□ Landing page displays correctly
□ Can enter text in repository field
□ "Start Migration" button is enabled (not grayed out)
□ Clicking button redirects to /dashboard?id=xxx
□ Dashboard shows 5 agent cards
□ Each agent has name and description
□ All agents show "Pending" status
□ Bottom shows "🟢 Live updates enabled"
```

## ✅ Success Criteria

Your demo is **working correctly** if:
1. ✅ Form accepts URL input
2. ✅ Button click navigates to dashboard
3. ✅ Dashboard displays with all agent cards
4. ✅ UI looks professional and clean
5. ✅ No console errors in browser

The agents staying "Pending" is **expected** in demo mode!

---

**Your platform UI is fully functional!** 🎉

The form works, navigation works, dashboard displays correctly. This is perfect for demonstrating the interface to clients, even though the actual AI migration requires the full Kubernetes + ARK + n8n stack.
