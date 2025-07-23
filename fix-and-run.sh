#!/bin/bash

echo "🔧 Fixing any remaining TypeScript issues and starting the application..."

# Navigate to backend directory
cd backend

echo "📝 Checking for any remaining TypeScript issues..."

# Check if there are any TypeScript compilation errors
echo "Running TypeScript check..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful!"
    echo "🚀 Starting backend server..."
    npm run dev &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 3
    
    # Navigate to frontend and start it
    cd ../frontend
    echo "🎨 Starting frontend server..."
    npm run dev &
    FRONTEND_PID=$!
    
    echo ""
    echo "🎉 Application is running!"
    echo "================================"
    echo "📊 Backend:  http://localhost:3001"
    echo "🌐 Frontend: http://localhost:5173"
    echo "================================"
    echo ""
    echo "Press Ctrl+C to stop both servers"
    
    # Cleanup function
    cleanup() {
        echo ""
        echo "🛑 Stopping servers..."
        kill $BACKEND_PID 2>/dev/null
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ Servers stopped"
        exit 0
    }
    
    trap cleanup SIGINT SIGTERM
    wait
    
else
    echo "❌ TypeScript compilation failed. Please check the errors above."
    echo ""
    echo "Common fixes:"
    echo "1. Make sure all unused parameters have underscore prefix (_param)"
    echo "2. Check for any missing imports or type definitions"
    echo "3. Verify all function signatures match their usage"
    exit 1
fi