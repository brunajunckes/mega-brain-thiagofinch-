#!/bin/bash
# Start Brain Factory Engine on port 8000

cd /srv/aiox/aiox-engine

# Kill any existing processes on 8000
killall -9 uvicorn python 2>/dev/null
sleep 2

# Create venv if doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating venv..."
  python3.12 -m venv venv
  source venv/bin/activate
  pip install --quiet -r requirements.txt
fi

# Start server
echo "Starting Brain Factory Engine on port 8000..."
source venv/bin/activate
/srv/aiox/aiox-engine/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level info &

# Wait for startup
sleep 5

# Test health
curl -s http://localhost:8000/health || echo "Server not responding yet..."
