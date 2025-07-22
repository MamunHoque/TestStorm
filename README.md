# API Load Testing & Monitoring SPA

A single-page web application for testing REST and GraphQL APIs for both functional correctness and performance under load.

## Project Structure

```
├── frontend/          # React.js SPA with TypeScript
├── backend/           # Node.js Express API with TypeScript
├── .kiro/specs/       # Project specifications and tasks
└── package.json       # Root package.json for development scripts
```

## Technology Stack

### Frontend
- React.js 18+ with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- Recharts for data visualization
- Axios for HTTP requests
- Socket.IO client for real-time communication
- React Hook Form for form management
- Zustand for state management

### Backend
- Node.js with Express.js
- TypeScript for type safety
- Socket.IO for WebSocket communication
- Artillery.js for load testing
- SQLite for data persistence
- Helmet.js for security

## Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for both frontend and backend:

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### Development

Start both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:3001

### Individual Commands

```bash
# Frontend only
npm run dev:frontend

# Backend only
npm run dev:backend

# Build both
npm run build

# Build frontend only
npm run build:frontend

# Build backend only
npm run build:backend
```

## Environment Configuration

Copy the example environment file and configure as needed:

```bash
cp backend/.env.example backend/.env
```

Default configuration:
- Backend Port: 3001
- Frontend Port: 5173 (Vite default)
- CORS Origin: http://localhost:5173

## Features

- Single-page application with tab-based navigation
- API endpoint testing with authentication support
- Load testing with configurable parameters
- Real-time performance monitoring
- Interactive charts and visualizations
- Test history and data export
- Support for REST and GraphQL APIs

## Development Status

This project is currently in development. See `.kiro/specs/api-load-testing-spa/tasks.md` for the implementation roadmap.