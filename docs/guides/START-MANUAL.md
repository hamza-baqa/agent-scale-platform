# Manual Start Guide - Banking Migration Platform

## Quick Start (2 Terminals Needed)

### Terminal 1: Start Backend

```bash
cd /home/hbaqa/Desktop/banque-app-transformed/platform/backend

# Make sure dependencies are installed
npm install

# Start backend
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 4000
📊 API Documentation: http://localhost:4000/api-docs
🔍 Health Check: http://localhost:4000/health
🌐 Environment: development
📡 WebSocket enabled
```

**Keep this terminal open!**

---

### Terminal 2: Start Frontend

```bash
cd /home/hbaqa/Desktop/banque-app-transformed/platform/frontend

# Make sure dependencies are installed
npm install

# Start frontend
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.5s
```

**Keep this terminal open!**

---

## Access the Platform

Once both are running, open your browser:

**🌐 http://localhost:3000**

---

## What You'll See

### 1. Landing Page
- Beautiful hero section
- Repository input form
- "Start Migration" button
- Feature highlights

### 2. Try the Demo
- Enter any GitHub URL (e.g., `https://github.com/facebook/react`)
- Click "Start Migration"
- You'll see the dashboard with agent progress

### 3. Dashboard Features
- Real-time agent progress bars
- Status indicators (pending, running, completed)
- Duration tracking
- WebSocket connection status

---

## Important Notes

⚠️ **This is UI Demo Mode**

The platform will:
- ✅ Show beautiful UI
- ✅ Accept repository URLs
- ✅ Display dashboard
- ✅ Show agent progress components

But it won't actually run migrations because:
- ❌ No Kubernetes cluster
- ❌ No ARK agents deployed
- ❌ No n8n workflow running

**To see actual AI migrations**, you need the full setup with Kubernetes (see `SETUP-DEMO-PLATFORM.md`)

---

## Stop Services

Press `Ctrl+C` in each terminal to stop the services.

Or kill the processes:
```bash
# Kill frontend
lsof -ti:3000 | xargs kill -9

# Kill backend
lsof -ti:4000 | xargs kill -9
```

---

## Troubleshooting

### Port already in use

If you see "Port 3000 is already in use":
```bash
lsof -ti:3000 | xargs kill -9
```

If you see "Port 4000 is already in use":
```bash
lsof -ti:4000 | xargs kill -9
```

### npm install fails

Make sure you have Node.js 18+:
```bash
node --version  # Should show v18 or higher
```

Update Node.js if needed:
```bash
# Using nvm
nvm install 18
nvm use 18
```

### Backend won't start

Check if `.env` file exists:
```bash
ls platform/backend/.env
```

If not, create it:
```bash
cat > platform/backend/.env << 'EOF'
PORT=4000
NODE_ENV=development
N8N_WEBHOOK_URL=http://localhost:5678/webhook/migration
WORKSPACE_DIR=./workspace
OUTPUT_DIR=./outputs
FRONTEND_URL=http://localhost:3000
EOF
```

### Frontend won't start

Check if `.env.local` exists:
```bash
ls platform/frontend/.env.local
```

If not, create it:
```bash
cat > platform/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
EOF
```

---

## Test the Backend

Once backend is running, test it:

```bash
# Health check
curl http://localhost:4000/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":123.45,"environment":"development"}
```

---

## Next Steps

1. **Try the UI** - Explore the dashboard and components
2. **Review Code** - Check out the React components in `platform/frontend/src`
3. **Customize** - Modify colors, text, or add features
4. **Full Setup** - For real AI migrations, see `SETUP-DEMO-PLATFORM.md`

---

## Quick Reference

```bash
# Backend
cd platform/backend && npm run dev

# Frontend
cd platform/frontend && npm run dev

# Access
http://localhost:3000

# Stop
Ctrl+C in each terminal
```

**Enjoy the demo!** 🚀
