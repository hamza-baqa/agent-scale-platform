#!/bin/bash

# Cleanup Script for Banking Migration Platform
# Stops and removes all containers from previous deployments

echo "🧹 Cleaning up containers from previous migrations..."

# Stop all containers with migration label
echo "Stopping containers..."
sudo docker ps -q --filter "label=migration" | xargs -r sudo docker stop

# Remove all stopped containers with migration label
echo "Removing containers..."
sudo docker ps -aq --filter "label=migration" | xargs -r sudo docker rm

# Clean up containers on specific ports
PORTS=(4200 4201 4202 4203 4204 8080 8081 8082 8083 8084 8085 5432 5433 5434 5435 5436)

echo "Cleaning up port conflicts..."
for port in "${PORTS[@]}"; do
    CONTAINER=$(sudo docker ps --filter "publish=$port" --format "{{.Names}}" 2>/dev/null)
    if [ ! -z "$CONTAINER" ]; then
        echo "  Stopping container on port $port: $CONTAINER"
        sudo docker stop "$CONTAINER" 2>/dev/null
        sudo docker rm "$CONTAINER" 2>/dev/null
    fi
done

# Remove unused networks
echo "Cleaning up unused Docker networks..."
sudo docker network prune -f 2>/dev/null

echo "✅ Cleanup complete!"
echo ""
echo "Summary:"
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "No containers running"
