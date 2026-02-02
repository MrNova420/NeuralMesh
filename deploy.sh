#!/bin/bash
# NeuralMesh Deployment Script

set -e

echo "🧠 NeuralMesh Deployment"
echo "========================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${BLUE}📝 Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file${NC}"
fi

# Build images
echo -e "${BLUE}🔨 Building Docker images...${NC}"
docker-compose build

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check service status
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose ps

# Show logs
echo ""
echo -e "${GREEN}✅ NeuralMesh is running!${NC}"
echo ""
echo "🌐 Frontend: http://localhost"
echo "🔌 Backend:  http://localhost:3001"
echo ""
echo "📝 View logs:   docker-compose logs -f"
echo "🛑 Stop:        docker-compose down"
echo "🔄 Restart:     docker-compose restart"
echo "🗑️  Clean all:   docker-compose down -v"
