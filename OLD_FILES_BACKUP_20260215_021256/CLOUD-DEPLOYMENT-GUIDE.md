# Cloud Deployment Guide - Agent@Scale Platform

> Deploy your Agent@Scale Platform to `ark-at-scale.space` with n8n integration

## 🎯 Deployment Architecture

```
                    ┌─────────────────────────────────┐
                    │   ark-at-scale.space (Cloud)    │
                    │                                 │
                    │  ┌──────────────────────────┐  │
                    │  │   n8n Workflow Engine    │  │
                    │  │  (Your existing n8n)     │  │
                    │  └────────────┬─────────────┘  │
                    │               │                 │
                    │  ┌────────────▼─────────────┐  │
                    │  │   Your VM or Container   │  │
                    │  │                          │  │
                    │  │  ┌──────────────────┐   │  │
                    │  │  │    Frontend      │   │  │
                    │  │  │    (Next.js)     │   │  │
                    │  │  └──────────────────┘   │  │
                    │  │  ┌──────────────────┐   │  │
                    │  │  │    Backend       │   │  │
                    │  │  │  (Node.js API)   │   │  │
                    │  │  └──────────────────┘   │  │
                    │  │  ┌──────────────────┐   │  │
                    │  │  │   Mock ARK +     │   │  │
                    │  │  │    Ollama AI     │   │  │
                    │  │  └──────────────────┘   │  │
                    │  │  ┌──────────────────┐   │  │
                    │  │  │ PostgreSQL + Redis│  │  │
                    │  │  └──────────────────┘   │  │
                    │  └──────────────────────────┘  │
                    └─────────────────────────────────┘
```

## 📋 Prerequisites

1. **Access to ark-at-scale.space server**:
   - SSH access
   - Docker and Docker Compose installed
   - Port access (80, 443, 3000, 4000, 8080)

2. **Domain/Subdomain** (optional):
   - Configure DNS to point to your server
   - SSL certificate for HTTPS

3. **n8n Instance**:
   - Already available at https://ark-at-scale.space/n8n
   - Webhook access

## 🚀 Deployment Options

### Option 1: Docker Compose (Recommended for Quick Start)

This deploys the entire platform on a single server using Docker Compose.

#### Step 1: Prepare the Server

```bash
# SSH into your ark-at-scale.space server
ssh user@ark-at-scale.space

# Install Docker and Docker Compose (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker --version
docker-compose --version
```

#### Step 2: Upload Your Project

```bash
# From your local machine
cd "/home/hbaqa/Desktop/Banque app 2/banque-app-transformed"

# Option A: Using rsync (recommended)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'platform/backend/workspace' \
  . user@ark-at-scale.space:/opt/agent-scale-platform/

# Option B: Using scp
tar -czf agent-scale-platform.tar.gz --exclude=node_modules --exclude=.git .
scp agent-scale-platform.tar.gz user@ark-at-scale.space:/opt/
ssh user@ark-at-scale.space "cd /opt && tar -xzf agent-scale-platform.tar.gz"

# Option C: Using git (if you have a git repository)
# On server:
cd /opt
git clone https://github.com/your-org/agent-scale-platform.git
cd agent-scale-platform
```

#### Step 3: Configure Environment Variables

```bash
# On the server
cd /opt/agent-scale-platform

# Create production environment file
cat > .env.production <<EOF
# JWT Secret (generate a secure random string)
JWT_SECRET=$(openssl rand -hex 32)

# Domain configuration
DOMAIN=ark-at-scale.space
FRONTEND_URL=https://ark-at-scale.space

# n8n Configuration (your existing n8n instance)
N8N_WEBHOOK_URL=https://ark-at-scale.space/n8n/webhook/migration
N8N_API_URL=https://ark-at-scale.space/n8n/api/v1

# Database passwords (generate secure passwords)
POSTGRES_PASSWORD=$(openssl rand -hex 16)
REDIS_PASSWORD=$(openssl rand -hex 16)
EOF

# Secure the file
chmod 600 .env.production
```

#### Step 4: Pull and Download AI Model

```bash
# Start Ollama service first
docker-compose -f docker-compose.cloud.yml up -d ollama

# Wait for Ollama to start
sleep 10

# Download the llama3 model
docker exec agent-scale-ollama ollama pull llama3

# Verify model is downloaded
docker exec agent-scale-ollama ollama list
```

#### Step 5: Deploy All Services

```bash
# Build and start all services
docker-compose -f docker-compose.cloud.yml up -d --build

# Check status
docker-compose -f docker-compose.cloud.yml ps

# View logs
docker-compose -f docker-compose.cloud.yml logs -f

# Check health of services
docker-compose -f docker-compose.cloud.yml ps
```

#### Step 6: Verify Deployment

```bash
# Test backend health
curl http://localhost:4000/health

# Test frontend
curl http://localhost:3000

# Test Mock ARK
curl http://localhost:8080/health

# Test Ollama
curl http://localhost:11434/api/tags

# View all logs
docker-compose -f docker-compose.cloud.yml logs --tail=50
```

#### Step 7: Configure Nginx Reverse Proxy (Optional but Recommended)

Create Nginx configuration for HTTPS:

```bash
# Create nginx directory
mkdir -p nginx/ssl

# Create Nginx config
cat > nginx/nginx.conf <<'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:4000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name ark-at-scale.space;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name ark-at-scale.space;

        # SSL configuration (add your certificates)
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket for real-time updates
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Health check
        location /health {
            proxy_pass http://backend/health;
        }
    }
}
EOF

# Get SSL certificates (using Let's Encrypt)
docker run -it --rm \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d ark-at-scale.space \
  --email your-email@example.com \
  --agree-tos

# Copy certificates
cp nginx/ssl/live/ark-at-scale.space/fullchain.pem nginx/ssl/cert.pem
cp nginx/ssl/live/ark-at-scale.space/privkey.pem nginx/ssl/key.pem

# Restart Nginx
docker-compose -f docker-compose.cloud.yml restart nginx
```

### Option 2: Integrate with Existing n8n Workflows

If you want to use n8n workflows to orchestrate the platform:

#### Step 1: Import n8n Workflow

1. Login to your n8n instance at https://ark-at-scale.space/n8n
2. Go to **Workflows** → **Import from File**
3. Import the workflow (I'll create this file next)

#### Step 2: Configure n8n Webhook

Create a webhook in n8n that triggers the migration:

```json
{
  "name": "Agent@Scale Migration Workflow",
  "nodes": [
    {
      "parameters": {
        "path": "migration",
        "responseMode": "onReceived",
        "options": {}
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "url": "http://backend:4000/api/migrations",
        "method": "POST",
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "repositoryUrl",
              "value": "={{ $json.body.repositoryUrl }}"
            }
          ]
        }
      },
      "name": "Start Migration",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Start Migration",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 🔧 Post-Deployment Configuration

### 1. Test the Platform

```bash
# Access the platform
# Frontend: https://ark-at-scale.space
# Backend API: https://ark-at-scale.space/api
# n8n: https://ark-at-scale.space/n8n

# Test migration
curl -X POST https://ark-at-scale.space/api/migrations \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl": "https://github.com/test/repo"}'
```

### 2. Monitor Services

```bash
# View logs
docker-compose -f docker-compose.cloud.yml logs -f backend
docker-compose -f docker-compose.cloud.yml logs -f frontend
docker-compose -f docker-compose.cloud.yml logs -f mock-ark

# Check resource usage
docker stats

# Check disk usage
docker system df
```

### 3. Backup Configuration

```bash
# Backup volumes
docker run --rm \
  -v agent-scale-platform_postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres-$(date +%Y%m%d).tar.gz /data

# Backup workspace
docker run --rm \
  -v agent-scale-platform_backend_workspace:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/workspace-$(date +%Y%m%d).tar.gz /data
```

## 📊 Production Checklist

- [ ] Server has adequate resources (4GB+ RAM, 50GB+ disk)
- [ ] Docker and Docker Compose installed
- [ ] Environment variables configured
- [ ] SSL certificates installed (for HTTPS)
- [ ] Firewall rules configured (ports 80, 443)
- [ ] Ollama llama3 model downloaded
- [ ] All services running and healthy
- [ ] Backend API accessible
- [ ] Frontend accessible
- [ ] n8n webhook configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented

## 🐛 Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose -f docker-compose.cloud.yml logs

# Restart specific service
docker-compose -f docker-compose.cloud.yml restart backend

# Rebuild
docker-compose -f docker-compose.cloud.yml up -d --build --force-recreate
```

### Ollama model not found

```bash
# Re-download model
docker exec agent-scale-ollama ollama pull llama3

# Verify
docker exec agent-scale-ollama ollama list
```

### Can't connect to n8n

```bash
# Test webhook
curl -X POST https://ark-at-scale.space/n8n/webhook/migration \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check n8n logs in your n8n instance
```

### Database connection issues

```bash
# Check PostgreSQL
docker exec agent-scale-postgres psql -U banque -d migrations -c "SELECT 1"

# Reset database
docker-compose -f docker-compose.cloud.yml down postgres
docker volume rm agent-scale-platform_postgres_data
docker-compose -f docker-compose.cloud.yml up -d postgres
```

## 🔄 Updating the Platform

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose -f docker-compose.cloud.yml down
docker-compose -f docker-compose.cloud.yml up -d --build

# Clean up old images
docker image prune -a
```

## 📞 Support

For issues:
1. Check logs: `docker-compose -f docker-compose.cloud.yml logs`
2. Check service health: `docker-compose -f docker-compose.cloud.yml ps`
3. Restart services: `docker-compose -f docker-compose.cloud.yml restart`

## 🎉 Next Steps

After deployment:
1. Test a migration with your banking app
2. Configure n8n workflows for advanced orchestration
3. Set up monitoring (Prometheus, Grafana)
4. Configure automatic backups
5. Set up CI/CD for automated deployments

---

**Deployment Status**: Ready for cloud deployment to ark-at-scale.space
