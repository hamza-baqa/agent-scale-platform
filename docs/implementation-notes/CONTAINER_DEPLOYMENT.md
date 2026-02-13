# 🐳 Container Deployment Feature

## Overview

I've successfully added an **automatic container deployment** step to the migration platform. After the code generation and validation, your generated microservices and micro-frontends are automatically deployed in Docker containers for immediate testing!

## 🎯 What's New

### Automatic Container Deployment

After successful migration and validation, the platform now:

1. ✅ **Generates Dockerfiles** for all services and frontends
2. ✅ **Creates docker-compose.yml** with all configurations
3. ✅ **Builds Docker images** for each component
4. ✅ **Deploys PostgreSQL database** automatically
5. ✅ **Starts all containers** with proper networking
6. ✅ **Performs health checks** on all services
7. ✅ **Provides access URLs** for immediate testing

## 🚀 How It Works

### Migration Flow with Container Deployment

```
1. Code Analyzer
   ↓
2. Migration Planner
   ↓
3. Service Generator
   ↓
4. Frontend Migrator
   ↓
5. Quality Validator
   ↓
6. Container Deployer ⭐ NEW
   ├─ Generate Dockerfiles
   ├─ Create docker-compose.yml
   ├─ Build Docker images
   ├─ Deploy PostgreSQL
   ├─ Start all containers
   ├─ Wait for health checks
   └─ Provide access URLs
   ↓
Migration Complete! 🎉
Ready for testing in containers!
```

### What Gets Deployed

#### 🗄️ **Database**
- **PostgreSQL 15** (Alpine Linux)
- Container name: `eurobank-postgres-{migration-id}`
- Port: `5432`
- Credentials: `eurobank` / `eurobank123`
- Health check: Automatic

#### 🚀 **Microservices** (5 services)
Each service gets:
- Multi-stage Docker build (Maven + JRE)
- External ports: `8081-8085`
- Internal port: `8080`
- Health endpoint: `/actuator/health`
- Automatic database connection
- Health checks every 30s

Services deployed:
1. **auth-service** → `http://localhost:8081`
2. **client-service** → `http://localhost:8082`
3. **account-service** → `http://localhost:8083`
4. **transaction-service** → `http://localhost:8084`
5. **card-service** → `http://localhost:8085`

#### 🎨 **Micro-Frontends** (5 applications)
Each frontend gets:
- Multi-stage Docker build (Node.js + Nginx)
- External ports: `4200-4204`
- Internal port: `80`
- Nginx with optimized configuration
- Gzip compression
- Static asset caching
- Health checks

Frontends deployed:
1. **shell** → `http://localhost:4200`
2. **auth-mfe** → `http://localhost:4201`
3. **dashboard-mfe** → `http://localhost:4200`
4. **transfers-mfe** → `http://localhost:4203`
5. **cards-mfe** → `http://localhost:4204`

## 📋 Generated Files

After deployment, you'll find these files in the output directory:

### 1. **Dockerfiles**

#### Spring Boot Service Dockerfile
```dockerfile
# Multi-stage build for Spring Boot
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
```

#### Angular Frontend Dockerfile
```dockerfile
# Multi-stage build for Angular
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runtime stage with nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2. **docker-compose.yml**

Complete orchestration file with:
- PostgreSQL database
- All 5 microservices
- All 5 micro-frontends
- Network configuration
- Volume management
- Health checks
- Environment variables

Example structure:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: eurobank-postgres-{id}
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: eurobank
      POSTGRES_PASSWORD: eurobank123
      POSTGRES_DB: eurobank_db
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U eurobank"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth-service:
    build:
      context: ./microservices/auth-service
      dockerfile: Dockerfile
    container_name: eurobank-auth-service-{id}
    ports:
      - "8081:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/eurobank_db
      SPRING_DATASOURCE_USERNAME: eurobank
      SPRING_DATASOURCE_PASSWORD: eurobank123
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s

  # ... other services ...

networks:
  eurobank-network:
    driver: bridge

volumes:
  eurobank-postgres-data:
```

## 🎛️ API Endpoints

### Deploy in Containers
```http
POST /api/migrations/:id/containers/deploy
```

**Request:**
```bash
curl -X POST http://localhost:4000/api/migrations/{migrationId}/containers/deploy
```

**Response:**
```json
{
  "id": "deployment-{migrationId}",
  "migrationId": "{migrationId}",
  "status": "running",
  "services": [
    {
      "name": "auth-service",
      "port": 8081,
      "status": "running",
      "healthUrl": "http://localhost:8081/actuator/health",
      "apiUrl": "http://localhost:8081"
    }
    // ... more services
  ],
  "microFrontends": [
    {
      "name": "shell",
      "port": 4200,
      "status": "running",
      "url": "http://localhost:4200"
    }
    // ... more frontends
  ],
  "urls": {
    "auth-service": "http://localhost:8081",
    "shell": "http://localhost:4200",
    // ... all URLs
  }
}
```

### Get Deployment Status
```http
GET /api/migrations/:id/containers
```

### Stop Containers
```http
POST /api/migrations/:id/containers/stop
```

### Remove Deployment
```http
DELETE /api/migrations/:id/containers
```

### Get Service Logs
```http
GET /api/migrations/:id/containers/logs/:serviceName?tail=100
```

**Example:**
```bash
curl http://localhost:4000/api/migrations/{migrationId}/containers/logs/auth-service?tail=100
```

## 🧪 Testing Your Application

After deployment completes, you can immediately test your application:

### 1. **Access the Application**
```bash
# Frontend shell (main app)
open http://localhost:4200

# Individual micro-frontends
open http://localhost:4201  # auth-mfe
open http://localhost:4202  # dashboard-mfe
open http://localhost:4203  # transfers-mfe
open http://localhost:4204  # cards-mfe
```

### 2. **Test Microservices**
```bash
# Check service health
curl http://localhost:8081/actuator/health  # auth-service
curl http://localhost:8082/actuator/health  # client-service
curl http://localhost:8083/actuator/health  # account-service
curl http://localhost:8084/actuator/health  # transaction-service
curl http://localhost:8085/actuator/health  # card-service

# Test API endpoints
curl http://localhost:8081/api/v1/auth/status
curl http://localhost:8082/api/v1/clients
curl http://localhost:8083/api/v1/accounts
```

### 3. **Check Database**
```bash
# Connect to PostgreSQL
docker exec -it eurobank-postgres-{migration-id} psql -U eurobank -d eurobank_db

# View tables
\dt

# Query data
SELECT * FROM users;
```

### 4. **View Logs**
```bash
# View all logs
cd {migration-output-directory}
docker-compose logs -f

# View specific service logs
docker-compose logs -f auth-service
docker-compose logs -f shell

# View logs via API
curl http://localhost:4000/api/migrations/{migrationId}/containers/logs/auth-service
```

## 🔧 Container Management

### Using docker-compose

Navigate to the migration output directory:
```bash
cd /workspace/{migrationId}/output
```

#### Start containers:
```bash
docker-compose up -d
```

#### Stop containers:
```bash
docker-compose down
```

#### Restart a service:
```bash
docker-compose restart auth-service
```

#### View logs:
```bash
docker-compose logs -f
```

#### Scale a service:
```bash
docker-compose up -d --scale auth-service=2
```

#### Rebuild and restart:
```bash
docker-compose up -d --build
```

### Using Docker commands

#### List containers:
```bash
docker ps | grep eurobank
```

#### View logs:
```bash
docker logs eurobank-auth-service-{id} -f
```

#### Execute commands in container:
```bash
docker exec -it eurobank-auth-service-{id} sh
```

#### Inspect container:
```bash
docker inspect eurobank-auth-service-{id}
```

## 📊 Deployment Report

After deployment, you'll see a comprehensive report:

```markdown
✅ Container Deployment Complete

🐳 **Deployment Status:**
- Status: ✅ Running
- Network: eurobank-network-{id}
- Docker Compose: ✅ Generated

🚀 **Microservices Deployed:**

✅ **auth-service**
   - Status: running
   - URL: http://localhost:8081
   - Health: http://localhost:8081/actuator/health
   - Port: 8081
   - Build Time: 45.23s

✅ **client-service**
   - Status: running
   - URL: http://localhost:8082
   - Health: http://localhost:8082/actuator/health
   - Port: 8082
   - Build Time: 42.15s

... (all 5 services)

🎨 **Micro-Frontends Deployed:**

✅ **shell**
   - Status: running
   - URL: http://localhost:4200
   - Port: 4200
   - Build Time: 38.67s

... (all 5 frontends)

🔗 **Quick Access URLs:**

- **auth-service**: http://localhost:8081
- **client-service**: http://localhost:8082
- **account-service**: http://localhost:8083
- **transaction-service**: http://localhost:8084
- **card-service**: http://localhost:8085
- **shell**: http://localhost:4200
- **auth-mfe**: http://localhost:4201
- **dashboard-mfe**: http://localhost:4202
- **transfers-mfe**: http://localhost:4203
- **cards-mfe**: http://localhost:4204

📋 **Container Management:**

View logs:
```bash
cd {output-dir}
docker-compose logs -f [service-name]
```

Stop containers:
```bash
docker-compose down
```

Restart a service:
```bash
docker-compose restart [service-name]
```

🎉 **Your application is now running in containers and ready for testing!**
```

## 🔍 Troubleshooting

### Port Already in Use

**Problem:** Port conflicts when starting containers

**Solution:**
```bash
# Check what's using the port
lsof -i :8081

# Stop the process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Container Won't Start

**Problem:** Container fails to start

**Solution:**
```bash
# Check logs
docker-compose logs auth-service

# Rebuild the image
docker-compose build --no-cache auth-service

# Start with verbose output
docker-compose up auth-service
```

### Database Connection Failed

**Problem:** Services can't connect to PostgreSQL

**Solution:**
```bash
# Check if PostgreSQL is healthy
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Verify network connectivity
docker exec eurobank-auth-service-{id} ping postgres
```

### Health Check Timeout

**Problem:** Services don't pass health checks

**Solution:**
```bash
# Check service logs
docker-compose logs auth-service

# Manually check health endpoint
docker exec eurobank-auth-service-{id} wget -O- http://localhost:8080/actuator/health

# Increase health check timeout in docker-compose.yml
```

### Build Failures

**Problem:** Docker image build fails

**Solution:**
```bash
# Build with verbose output
docker-compose build --progress=plain auth-service

# Check Dockerfile syntax
docker build -f microservices/auth-service/Dockerfile .

# Clean Docker cache
docker system prune -a
```

## 📚 Prerequisites

### Required Software

- **Docker** 20.10+
  ```bash
  docker --version
  ```

- **Docker Compose** 2.0+
  ```bash
  docker-compose --version
  # or
  docker compose version
  ```

### System Requirements

- **Memory**: 4GB minimum, 8GB recommended
- **Disk Space**: 10GB free space
- **CPU**: 2 cores minimum, 4 cores recommended

### Verify Installation

```bash
# Check Docker daemon
docker ps

# Check Docker Compose
docker-compose --version

# Test Docker
docker run hello-world
```

## 🎯 Benefits

### For Development
- ✅ **Instant Testing**: Test immediately after migration
- ✅ **Isolated Environment**: No conflicts with host system
- ✅ **Easy Cleanup**: Remove everything with one command
- ✅ **Reproducible**: Same environment every time

### For QA
- ✅ **Complete Stack**: All services running together
- ✅ **Real Database**: Actual PostgreSQL instance
- ✅ **Easy Reset**: Fresh start anytime
- ✅ **Logs Access**: Easy debugging with logs

### For Demo
- ✅ **One-Click Deploy**: Automatic deployment
- ✅ **Professional Setup**: Production-like environment
- ✅ **Working URLs**: Share URLs with stakeholders
- ✅ **No Manual Setup**: Everything automated

## 🚀 Next Steps

After testing in containers, you can:

1. **Deploy to Kubernetes**: Use generated Dockerfiles
2. **Deploy to OpenShift**: Use existing OpenShift deployment feature
3. **Push to Registry**: Tag and push images to Docker Hub/ECR
4. **CI/CD Integration**: Use docker-compose.yml in pipelines

## 📝 Example Workflow

Complete workflow from migration to testing:

```bash
# 1. Start a migration
curl -X POST http://localhost:4000/api/migrations \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "/path/to/source/code",
    "options": {
      "targetStack": "angular-springboot"
    }
  }'

# 2. Wait for migration to complete
# (Monitor in dashboard or poll API)

# 3. Containers are automatically deployed!
# Get deployment status:
curl http://localhost:4000/api/migrations/{migrationId}/containers

# 4. Test your application
open http://localhost:4200

# 5. Check service health
curl http://localhost:8081/actuator/health
curl http://localhost:8082/actuator/health

# 6. View logs if needed
curl http://localhost:4000/api/migrations/{migrationId}/containers/logs/auth-service

# 7. When done, stop containers
curl -X POST http://localhost:4000/api/migrations/{migrationId}/containers/stop
```

---

**Generated by Agent@Scale Platform**

Your migrated application is automatically deployed in containers and ready for immediate testing! 🎉🐳
