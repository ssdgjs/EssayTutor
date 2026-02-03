#!/bin/bash

# EssayTutor Deployment Script
# Run this on your server to deploy with Docker

set -e

echo "🚀 Starting EssayTutor deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing..."
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker is installed"
fi

# Check if Docker Compose is installed
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing..."
    mkdir -p ~/.docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64 -o ~/.docker/cli-plugins/docker-compose
    chmod +x ~/.docker/cli-plugins/docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose is installed"
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Pull latest changes from git
echo "📦 Pulling latest changes..."
git pull origin master || echo "⚠️  Git pull failed, continuing with existing files..."

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your API keys!"
fi

# Build and start containers
echo "🔨 Building and starting Docker containers..."
docker compose up -d --build

# Wait for container to start
sleep 5

# Check status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Container status:"
docker compose ps
echo ""
echo "🌐 Server should be running at: http://your-server-ip:3001"
echo ""
echo "📝 Don't forget to:"
echo "   1. Edit .env with your ZHIPU_API_KEY and ARK_API_KEY"
echo "   2. Run: docker compose restart server"
