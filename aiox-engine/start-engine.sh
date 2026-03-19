#!/bin/bash
# Start AIOX Engine with validation

set -e

echo "🚀 Starting AIOX Engine..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Validate structure
echo "${YELLOW}1️⃣  Validating structure...${NC}"
if ! ./validate-structure.sh > /dev/null 2>&1; then
    echo "${RED}❌ Validation failed. Fix issues before starting.${NC}"
    exit 1
fi
echo "${GREEN}✅ Structure valid${NC}"
echo ""

# 2. Check Docker
echo "${YELLOW}2️⃣  Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "${RED}❌ Docker not found. Install Docker first.${NC}"
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo "${RED}❌ Docker Compose not found. Install Docker Compose first.${NC}"
    exit 1
fi
echo "${GREEN}✅ Docker and Docker Compose ready${NC}"
echo ""

# 3. Check Ollama
echo "${YELLOW}3️⃣  Checking Ollama models...${NC}"
if command -v ollama &> /dev/null; then
    model_count=$(ollama list 2>/dev/null | wc -l)
    echo "${GREEN}✅ Ollama available with $((model_count - 1)) models${NC}"
else
    echo "${YELLOW}⚠️  Ollama not found locally (will use Docker container)${NC}"
fi
echo ""

# 4. Create .env if missing
echo "${YELLOW}4️⃣  Setting up environment...${NC}"
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.example .env
    echo "${GREEN}✅ .env created${NC}"
else
    echo "${GREEN}✅ .env exists${NC}"
fi
echo ""

# 5. Start services
echo "${YELLOW}5️⃣  Starting Docker services...${NC}"
docker-compose up -d

echo ""
echo "${GREEN}✅ Services starting...${NC}"
echo ""

# 6. Wait for services
echo "${YELLOW}6️⃣  Waiting for services to be ready...${NC}"
sleep 3

max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "${GREEN}✅ API is ready!${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo "  Waiting... ($attempt/$max_attempts)"
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo "${YELLOW}⚠️  API still starting (may take longer)${NC}"
fi
echo ""

# 7. Show status
echo "${YELLOW}7️⃣  Service Status:${NC}"
docker-compose ps
echo ""

# 8. Test API
echo "${YELLOW}8️⃣  Testing API...${NC}"
health=$(curl -s http://localhost:8000/health || echo "{}")
if echo "$health" | grep -q "healthy"; then
    echo "${GREEN}✅ API is healthy${NC}"
else
    echo "${YELLOW}⚠️  API not responding yet (give it a few more seconds)${NC}"
fi
echo ""

# 9. Show next steps
echo "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo "${GREEN}✅ AIOX Engine Started!${NC}"
echo "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "📊 Services Running:"
echo "  • FastAPI:  http://localhost:8000"
echo "  • Ollama:   http://localhost:11434"
echo "  • Redis:    localhost:6379"
echo "  • Qdrant:   http://localhost:6333"
echo ""
echo "📝 Quick Test:"
echo "  curl -X POST http://localhost:8000/agent \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"prompt\": \"hello world\"}'"
echo ""
echo "📋 Commands:"
echo "  • View logs:    docker-compose logs -f aiox-api"
echo "  • Stop:         docker-compose down"
echo "  • Restart:      docker-compose restart"
echo "  • Status:       docker-compose ps"
echo ""
