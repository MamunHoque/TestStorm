#!/bin/bash

echo "🚀 Starting API Load Testing & Monitoring SPA"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    echo "   Please upgrade Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install backend dependencies"
        exit 1
    fi
else
    echo "✅ Backend dependencies already installed"
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "✅ Frontend dependencies already installed"
fi

# Start backend server
echo ""
echo "🔧 Starting backend server on http://localhost:3001..."
cd ../backend
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo ""
echo "🎨 Starting frontend server on http://localhost:5173..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Application is starting up!"
echo "=============================================="
echo "📊 Backend API:  http://localhost:3001"
echo "🌐 Frontend App: http://localhost:5173"
echo "=============================================="
echo ""
echo "📖 Open your browser and navigate to: http://localhost:5173"
echo ""
echo "🛑 To stop the application, press Ctrl+C"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait