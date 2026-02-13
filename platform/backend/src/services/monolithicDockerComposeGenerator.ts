import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

/**
 * Generate docker-compose.yml for monolithic application
 * Simple structure: frontend + backend + postgres
 */
class MonolithicDockerComposeGenerator {

  /**
   * Generate docker-compose.yml for monolithic stack
   */
  async generateDockerCompose(outputDir: string): Promise<void> {
    logger.info('📦 Generating monolithic docker-compose.yml');

    const dockerCompose = `version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: eurobank-postgres
    environment:
      POSTGRES_DB: eurobank_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - eurobank-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Spring Boot Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: eurobank-backend
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/eurobank_db
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: postgres
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - eurobank-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Angular Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: eurobank-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - eurobank-network

networks:
  eurobank-network:
    driver: bridge

volumes:
  postgres-data:
`;

    await fs.writeFile(path.join(outputDir, 'docker-compose.yml'), dockerCompose);
    logger.info('✅ docker-compose.yml created');
  }

  /**
   * Generate .gitignore file
   */
  async generateGitignore(outputDir: string): Promise<void> {
    const gitignore = `# Backend (Spring Boot)
backend/target/
backend/.mvn/
backend/mvnw
backend/mvnw.cmd

# Frontend (Angular)
frontend/node_modules/
frontend/dist/
frontend/.angular/

# IDE
.idea/
.vscode/
*.iml

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
`;

    await fs.writeFile(path.join(outputDir, '.gitignore'), gitignore);
    logger.info('✅ .gitignore created');
  }

  /**
   * Generate README.md
   */
  async generateReadme(outputDir: string): Promise<void> {
    const readme = `# Banking Application - Full Stack

Complete banking application with Angular frontend and Spring Boot backend.

## Architecture

- **Frontend**: Angular 17+ with standalone components
- **Backend**: Spring Boot 3.2.5 with PostgreSQL
- **Database**: PostgreSQL 15

## Quick Start

\`\`\`bash
# Start all services
docker-compose up -d

# Wait for services to start (~60 seconds)
docker-compose ps

# Access application
open http://localhost
\`\`\`

## Services

- **Frontend**: http://localhost (port 80)
- **Backend API**: http://localhost:8080
- **Database**: localhost:5432

## Development

### Backend

\`\`\`bash
cd backend
./mvnw spring-boot:run
\`\`\`

### Frontend

\`\`\`bash
cd frontend
npm install
npm start
# Access at http://localhost:4200
\`\`\`

## API Documentation

Swagger UI: http://localhost:8080/swagger-ui.html

## Stop

\`\`\`bash
docker-compose down
\`\`\`

## Features

- User authentication with JWT
- Account management
- Transaction history
- Card management
- Fund transfers
- Responsive UI (mobile-first)

## Tech Stack

### Backend
- Spring Boot 3.2.5
- Spring Security (JWT)
- Spring Data JPA
- PostgreSQL
- OpenAPI/Swagger

### Frontend
- Angular 17+
- Standalone Components
- Reactive Forms
- HttpClient
- Angular Material/PrimeNG

## License

MIT
`;

    await fs.writeFile(path.join(outputDir, 'README.md'), readme);
    logger.info('✅ README.md created');
  }
}

export default new MonolithicDockerComposeGenerator();
