# Banking Migration Platform - Frontend Dashboard

## Overview

React/Next.js dashboard for demonstrating real-time code migration using ARK agents orchestrated through n8n.

## Features

- 📥 **Repository Input**: Enter Git repository URL
- 📊 **Real-time Progress**: Watch ARK agents execute live
- 🔍 **Code Review**: Browse generated microservices and micro-frontends
- 📈 **Quality Reports**: View validation results and metrics
- 💾 **Download**: Export transformed code as ZIP

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Socket.io Client** - Real-time WebSocket updates
- **Axios** - HTTP requests
- **Recharts** - Data visualization
- **React Syntax Highlighter** - Code display

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local with your backend URL
nano .env.local
```

### Development

```bash
npm run dev
```

Open http://localhost:3000

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                    # Next.js 14 app directory
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Migration dashboard
│   │   └── page.tsx
│   ├── review/            # Code review interface
│   │   └── [id]/page.tsx
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── MigrationDashboard.tsx
│   ├── AgentProgress.tsx
│   ├── CodeViewer.tsx
│   ├── QualityReport.tsx
│   └── FileTree.tsx
├── services/              # API services
│   ├── migrationService.ts
│   └── websocketService.ts
├── types/                 # TypeScript types
│   └── migration.types.ts
└── utils/                 # Utility functions
    └── formatting.ts
```

## Key Components

### MigrationDashboard

Main dashboard showing:
- Repository input form
- Active migrations list
- Real-time agent progress
- Status indicators

### AgentProgress

Real-time visualization of agent execution:
- Progress bars
- Status badges
- Execution time
- Output summaries

### CodeViewer

Syntax-highlighted code viewer with:
- File tree navigation
- Side-by-side comparison
- Search functionality
- Download options

### QualityReport

Validation results display:
- Build status
- Test results
- Code coverage
- Security scan results

## WebSocket Events

The frontend subscribes to real-time updates:

```typescript
socket.on('agent-started', (data) => {
  // Update UI: agent started
});

socket.on('agent-progress', (data) => {
  // Update progress bar
});

socket.on('agent-completed', (data) => {
  // Show completion status
});

socket.on('migration-completed', (data) => {
  // Enable download, show final report
});
```

## API Integration

### Start Migration

```typescript
POST /api/migrations
{
  "repoUrl": "https://github.com/org/repo",
  "options": {
    "includeDocs": true,
    "includeTests": true
  }
}

Response:
{
  "id": "uuid",
  "status": "pending"
}
```

### Get Migration Status

```typescript
GET /api/migrations/:id

Response:
{
  "id": "uuid",
  "status": "analyzing",
  "progress": [
    {
      "agent": "code-analyzer",
      "status": "running",
      "startedAt": "2024-02-05T10:00:00Z"
    }
  ]
}
```

### Download Results

```typescript
GET /api/migrations/:id/download

Response: ZIP file
```

## Styling

Uses Tailwind CSS with custom theme:

- **Primary Color**: Blue (ARK brand)
- **Success**: Green
- **Warning**: Yellow
- **Error**: Red
- **Dark Mode**: Supported

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```bash
docker build -t migration-platform-frontend .
docker run -p 3000:3000 migration-platform-frontend
```

### Kubernetes

```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:4000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:4000` |
| `NEXT_PUBLIC_DEMO_REPO_URL` | Demo repository | - |

## Development Tips

### Hot Reload

Next.js automatically hot reloads on file changes.

### TypeScript

Run type checking:
```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance

- Code splitting with Next.js
- Image optimization
- WebSocket connection pooling
- Lazy loading for code viewer

## Accessibility

- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode

## License

MIT
