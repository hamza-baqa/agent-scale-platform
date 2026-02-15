# Quick Start Guide - Agent@Scale Platform

## Single Command Startup ✅

```bash
cd ~/Desktop/Banque\ app\ 2/banque-app-transformed
./RUN-SIMPLE.sh
```

**This script now:**
1. ✅ Starts Minikube (if not running)
2. ✅ Installs ARK v0.1.53
3. ✅ Deploys all 8 agents
4. ✅ Sets up ARK API port-forward with 30-second retry
5. ✅ Verifies agents are available
6. ✅ Starts backend and frontend
7. ✅ **FAILS FAST** if ARK not ready (no silent errors!)

## Access URLs

- **Platform Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **ARK API**: http://localhost:8080
- **ARK Dashboard**: http://localhost:3001

## Stop All Services

```bash
./STOP-ALL.sh
```

## Verify ARK is Working

```bash
# Check port-forward
ps aux | grep "kubectl port-forward"

# Check ARK health
curl http://localhost:8080/health

# List available agents
curl -s http://localhost:8080/openai/v1/models | grep "agent/"
```

## Troubleshooting

### "ARK system not available" Error
**Status**: ✅ **FIXED PERMANENTLY** (2026-02-13)

The script now:
- Waits up to 30 seconds for ARK to be ready
- Exits with error if ARK not accessible
- Shows clear error message with log location

---

**Last Updated**: 2026-02-13
**Status**: ✅ Production Ready
