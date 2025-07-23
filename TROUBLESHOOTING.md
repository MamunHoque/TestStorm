# 🔧 Troubleshooting Guide

## TypeScript Compilation Errors

If you're encountering TypeScript compilation errors when running `npm run dev`, here are the solutions:

### Common Error: "declared but its value is never read"

**Error Example:**
```
TSError: ⨯ Unable to compile TypeScript:
src/index.ts:79:15 - error TS6133: 'res' is declared but its value is never read.
```

**Solution:**
Add underscore prefix to unused parameters:

```typescript
// ❌ Before (causes error)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ✅ After (fixed)
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

### Quick Fix Script

Run the automated fix script:
```bash
./fix-and-run.sh
```

### Manual Fixes

If you need to fix manually, here are the common issues:

#### 1. Fix index.ts logging middleware
```typescript
// Line ~79
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
```

#### 2. Fix health endpoint
```typescript
// Line ~88
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});
```

#### 3. Fix WebSocket service initialization
```typescript
// Line ~100
// Initialize WebSocket service for real-time communication
initializeWebSocketService(server);
```

#### 4. Fix errorHandler middleware
```typescript
// In src/middleware/errorHandler.ts
export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction  // Add underscore prefix
): void => {
  // ... rest of the function
};
```

## Running the Application

### Option 1: Automated Script
```bash
./start-app.sh
```

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

### Option 3: Fix and Run
```bash
./fix-and-run.sh
```

## Environment Issues

### Node.js Version
Make sure you have Node.js 18 or higher:
```bash
node --version  # Should show v18.x.x or higher
```

### Port Conflicts
If ports are in use:
```bash
# Kill processes on default ports
npx kill-port 3001  # Backend
npx kill-port 5173  # Frontend
```

### Dependencies Issues
Clear and reinstall dependencies:
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend  
rm -rf node_modules package-lock.json
npm install
```

## Development Commands

### Backend
```bash
cd backend
npm run dev     # Development with hot reload
npm start       # Production server
npm run build   # Build TypeScript
npm test        # Run tests
```

### Frontend
```bash
cd frontend
npm run dev     # Development server
npm run build   # Production build
npm run preview # Preview production build
npm test        # Run tests
```

## TypeScript Configuration

The project uses strict TypeScript settings. Key rules:
- All unused parameters must have underscore prefix
- All imports must be used
- Strict type checking enabled
- No implicit any types

## Common Solutions

### 1. Unused Parameters
```typescript
// Express middleware signature requires all parameters
app.use((req, _res, next) => { ... });  // _res indicates intentionally unused
```

### 2. Error Handler Signature
```typescript
// Express error handlers must have 4 parameters
export const errorHandler = (error, req, res, _next) => { ... };
```

### 3. WebSocket Service
```typescript
// Don't assign to unused variable
initializeWebSocketService(server);  // Direct call without assignment
```

## Getting Help

If you continue to have issues:

1. **Check the error message** - TypeScript errors are usually very specific
2. **Look at line numbers** - The error shows exactly where the issue is
3. **Use the automated scripts** - `./start-app.sh` or `./fix-and-run.sh`
4. **Check Node.js version** - Must be 18 or higher
5. **Clear dependencies** - Sometimes a clean install helps

## Success Indicators

When everything is working correctly, you should see:

```
✅ TypeScript compilation successful!
🚀 Backend server running on http://localhost:3001
🎨 Frontend server running on http://localhost:5173
🌐 Application available at http://localhost:5173
```

The application should load without errors and show the professional glassmorphism interface with all features working.