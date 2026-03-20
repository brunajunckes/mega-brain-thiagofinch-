#!/bin/bash
set -e

echo "🚀 BookMe Production Deployment Started..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t bookme-web:latest -f packages/bookme-web/Dockerfile .

# Create data directories
echo "📁 Creating data directories..."
mkdir -p /var/lib/bookme /var/lib/projects /var/lib/bookme/cache

# Stop existing container
echo "⏹️  Stopping existing container..."
docker-compose -f docker-compose.bookme.yml down 2>/dev/null || true

# Start with docker-compose
echo "▶️  Starting BookMe Web..."
docker-compose -f docker-compose.bookme.yml up -d

# Wait for health check
echo "⏳ Waiting for service to be healthy..."
sleep 10

# Health check
echo "🏥 Running health check..."
if curl -f http://localhost:3000/api/books > /dev/null 2>&1; then
  echo "✅ BookMe Web is running and healthy!"
  echo "📍 Access at: http://localhost:3000"
  exit 0
else
  echo "❌ Health check failed!"
  docker logs bookme-web
  exit 1
fi
