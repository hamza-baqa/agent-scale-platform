# Cloud Deployment - Quick Start Guide

> Deploy your Agent@Scale Platform to **ark-at-scale.space** in 10 minutes

## 🎯 What You're Deploying

Your **Agent@Scale Migration Platform** includes:
- **Frontend**: Next.js dashboard (port 3000)
- **Backend**: Node.js API with WebSocket (port 4000)
- **PostgreSQL**: Database for migrations
- **Redis**: WebSocket scaling
- **n8n**: Workflow automation (port 5678)
- **Nginx**: Reverse proxy (optional)

Integration with your **existing n8n** at https://ark-at-scale.space/n8n

## 🚀 Deployment Options

### Option 1: Automated Deployment (Recommended)

**Use this if**: You have SSH access to ark-at-scale.space

```bash
# From your local machine
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"

# Run the quick deploy script
./QUICK-DEPLOY.sh

# Follow the prompts - it will:
# 1. Upload files to server
# 2. Build Docker images
# 3. Start all services
# 4. Download AI model
# 5. Verify deployment
```

**Time**: ~10 minutes (first time), ~3 minutes (updates)

### Option 2: Manual Step-by-Step

**Use this if**: You want more control or are learning the process

Follow the detailed guide in [`CLOUD-DEPLOYMENT-GUIDE.md`](./CLOUD-DEPLOYMENT-GUIDE.md)

## 📋 Prerequisites

### On ark-at-scale.space Server

1. **Docker** (version 20.10+)
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

2. **Docker Compose** (version 2.0+)
   ```bash
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Minimum Resources**:
   - 4GB RAM
   - 50GB Disk Space
   - 2 CPU cores

4. **Ports Available**:
   - 3000 (Frontend)
   - 4000 (Backend)
   - 8080 (Mock ARK)
   - Optional: 80, 443 (Nginx)

### On Your Local Machine

- SSH access to ark-at-scale.space
- Git (optional)
- rsync or scp

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  ark-at-scale.space (Your Cloud Server)                     │
│                                                               │
│  ┌─────────────┐                                            │
│  │   Nginx     │ ──> HTTPS (443)                            │
│  │   Proxy     │ ──> HTTP (80)                              │
│  └──────┬──────┘                                             │
│         │                                                     │
│    ┌────┼────────────────────────────────┐                  │
│    │    │                                 │                  │
│    ▼    ▼                                 ▼                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐            │
│  │ Frontend │  │ Backend  │  │ n8n (existing) │            │
│  │ Next.js  │  │ Node.js  │  │ Workflows      │            │
│  │  :3000   │  │  :4000   │  │  (your n8n)    │            │
│  └──────────┘  └─────┬────┘  └────────────────┘            │
│                      │                                       │
│              ┌───────┴──────┐                               │
│              │               │                               │
│         ┌────▼────┐    ┌────▼──────┐                        │
│         │PostgreSQL│    │  Redis    │                        │
│         │  :5432   │    │  :6379    │                        │
│         └─────────┘    └───────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 🎬 Quick Deploy Steps

### 1. Upload Project to Server

```bash
# Option A: Using the script (automatic upload)
./QUICK-DEPLOY.sh

# Option B: Manual upload with rsync
rsync -avz --exclude 'node_modules' --exclude '.git' \
  . user@ark-at-scale.space:/opt/agent-scale-platform/

# Option C: Using scp (tar archive)
tar -czf platform.tar.gz --exclude=node_modules --exclude=.git .
scp platform.tar.gz user@ark-at-scale.space:/opt/
```

### 2. SSH into Server

```bash
ssh user@ark-at-scale.space
cd /opt/agent-scale-platform
```

### 3. Deploy with Docker Compose

```bash
# One-command deployment
docker-compose -f docker-compose.cloud.yml up -d --build
```

### 4. Verify Deployment

```bash
# Check all services are running
docker-compose -f docker-compose.cloud.yml ps

# Test endpoints
curl http://localhost:4000/health  # Backend
curl http://localhost:3000         # Frontend
curl http://localhost:8080/health  # Mock ARK

# View logs
docker-compose -f docker-compose.cloud.yml logs -f
```

## ✅ Post-Deployment Checklist

- [ ] All Docker containers are running (`docker-compose ps`)
- [ ] Backend health check passes (`curl localhost:4000/health`)
- [ ] Frontend loads (`curl localhost:3000`)
- [ ] n8n webhook configured (import `platform/n8n-workflow-migration.json`)
- [ ] ARK agents deployed and accessible
- [ ] Test migration works

## 🔧 Configuration

### Environment Variables

Edit `.env.production` on the server:

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# Configure domain
DOMAIN=ark-at-scale.space
FRONTEND_URL=https://ark-at-scale.space

# n8n integration
N8N_WEBHOOK_URL=https://ark-at-scale.space/n8n/webhook/migration
N8N_API_URL=https://ark-at-scale.space/n8n/api/v1
```

### Integrate with n8n

1. **Login to n8n**: https://ark-at-scale.space/n8n
2. **Import workflow**: `platform/n8n-workflow-migration.json`
3. **Activate webhook**: Set webhook path to `/migration`
4. **Test**: Send POST request to trigger migration

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.cloud.yml logs -f

# Specific service
docker-compose -f docker-compose.cloud.yml logs -f backend
docker-compose -f docker-compose.cloud.yml logs -f frontend
docker-compose -f docker-compose.cloud.yml logs -f mock-ark
```

### Check Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Service health
docker-compose -f docker-compose.cloud.yml ps
```

### Database Access

```bash
# PostgreSQL
docker exec -it agent-scale-postgres psql -U banque -d migrations

# Redis
docker exec -it agent-scale-redis redis-cli
```

## 🔄 Common Operations

### Restart Services

```bash
# All services
docker-compose -f docker-compose.cloud.yml restart

# Specific service
docker-compose -f docker-compose.cloud.yml restart backend
```

### Update Platform

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build
```

### Backup Data

```bash
# Backup PostgreSQL
docker exec agent-scale-postgres pg_dump -U banque migrations > backup-$(date +%Y%m%d).sql

# Backup workspace
docker run --rm \
  -v agent-scale-platform_backend_workspace:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/workspace-$(date +%Y%m%d).tar.gz /data
```

### Clean Up

```bash
# Stop all services
docker-compose -f docker-compose.cloud.yml down

# Remove volumes (WARNING: deletes data)
docker-compose -f docker-compose.cloud.yml down -v

# Clean Docker system
docker system prune -a
```

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check logs for errors
docker-compose -f docker-compose.cloud.yml logs

# Rebuild from scratch
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build --force-recreate
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :4000

# Kill process
sudo fuser -k 4000/tcp
```

### Can't Connect to n8n

```bash
# Test webhook manually
curl -X POST https://ark-at-scale.space/n8n/webhook/migration \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl": "test"}'

# Check n8n is accessible
curl https://ark-at-scale.space/n8n/
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker exec agent-scale-postgres pg_isready -U banque

# Restart PostgreSQL
docker-compose -f docker-compose.cloud.yml restart postgres

# Check connection string in backend logs
docker-compose -f docker-compose.cloud.yml logs backend | grep DATABASE
```

## 📞 Getting Help

1. **Check logs first**: `docker-compose -f docker-compose.cloud.yml logs`
2. **Verify prerequisites**: Docker, ports, resources
3. **Review guides**:
   - [`CLOUD-DEPLOYMENT-GUIDE.md`](./CLOUD-DEPLOYMENT-GUIDE.md) - Detailed instructions
   - [`README.md`](./README.md) - Project overview

## 🎉 Next Steps

After successful deployment:

1. **Test the Platform**:
   ```bash
   curl -X POST http://localhost:4000/api/repo-migration \
     -H "Content-Type: application/json" \
     -d '{"repositoryUrl": "https://github.com/your-org/test-repo"}'
   ```

2. **Configure HTTPS**: Set up SSL certificates (see CLOUD-DEPLOYMENT-GUIDE.md)

3. **Set Up Monitoring**: Add Prometheus, Grafana

4. **Backup Strategy**: Automate daily backups

5. **CI/CD Pipeline**: Automate deployments

## 📚 Documentation

- **Deployment**: [`CLOUD-DEPLOYMENT-GUIDE.md`](./CLOUD-DEPLOYMENT-GUIDE.md)
- **Quick Script**: [`QUICK-DEPLOY.sh`](./QUICK-DEPLOY.sh)
- **n8n Workflow**: [`platform/n8n-workflow-migration.json`](./platform/n8n-workflow-migration.json)
- **Docker Compose**: [`docker-compose.cloud.yml`](./docker-compose.cloud.yml)
- **Project Overview**: [`README.md`](./README.md)

---

**Status**: ✅ Ready for cloud deployment
**Platform**: Docker Compose on ark-at-scale.space
**Integration**: n8n workflows for orchestration
