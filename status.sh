#!/bin/bash

echo "=========================================="
echo " Banking Migration Platform - Status"
echo "=========================================="
echo ""

# Check Backend
echo "Backend (port 4000):"
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "  ✓ Running"
    curl -s http://localhost:4000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:4000/health
else
    echo "  ✗ Not running"
fi
echo ""

# Check Frontend
echo "Frontend (port 3000):"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✓ Running"
    echo "  URL: http://localhost:3000"
else
    echo "  ✗ Not running"
fi
echo ""

# Process Info
echo "Running Processes:"
ps aux | grep -E "npm run dev|next dev" | grep -v grep | awk '{print "  PID:", $2, "-", $NF}' || echo "  No processes found"
echo ""

echo "=========================================="
echo " To access the platform:"
echo "   Open: http://localhost:3000"
echo ""
echo " To stop:"
echo "   ./stop-simple.sh"
echo "=========================================="
