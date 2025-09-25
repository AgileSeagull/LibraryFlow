#!/bin/bash

# LibraryFlow Restart Script
# This script stops and restarts both backend and frontend services

echo "🔄 Restarting LibraryFlow Services..."
echo ""

# Stop existing processes
echo "📛 Stopping existing processes..."

# Stop backend (port 5000)
BACKEND_PID=$(lsof -ti :5000)
if [ ! -z "$BACKEND_PID" ]; then
    echo "  Stopping backend (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null
    sleep 1
else
    echo "  No backend process found"
fi

# Stop frontend (port 3000)
FRONTEND_PIDS=$(lsof -ti :3000)
if [ ! -z "$FRONTEND_PIDS" ]; then
    echo "  Stopping frontend (PIDs: $FRONTEND_PIDS)..."
    kill $FRONTEND_PIDS 2>/dev/null
    sleep 1
else
    echo "  No frontend process found"
fi

echo "✓ All processes stopped"
echo ""

# Start backend
echo "🚀 Starting backend..."
cd /home/vishal/Documents/LibraryFlow/backend
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!
echo "  Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "  Waiting for backend to start..."
for i in {1..10}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "  ✓ Backend ready!"
        break
    fi
    sleep 1
done

# Start frontend
echo ""
echo "🌐 Starting frontend..."
cd /home/vishal/Documents/LibraryFlow/frontend
npm start > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "  Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to be ready
echo "  Waiting for frontend to start..."
for i in {1..15}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "  ✓ Frontend ready!"
        break
    fi
    sleep 1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ LibraryFlow Services Restarted!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Service Status:"
echo "  Backend:  http://localhost:5000 (PID: $BACKEND_PID)"
echo "  Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo "  Prisma:   http://localhost:5555 (if running)"
echo ""
echo "📖 Next Steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Register/Login to test the application"
echo "  3. Check logs: tail -f backend/logs (if logging enabled)"
echo ""
echo "💡 To stop services: ./stop.sh"
echo ""

