#!/bin/bash

echo "=================================="
echo "Docker Installation Script"
echo "=================================="
echo ""

# Update package lists
echo "Step 1: Updating package lists..."
sudo apt-get update

# Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Add Docker's official GPG key
echo ""
echo "Step 3: Adding Docker GPG key..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo ""
echo "Step 4: Setting up Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package lists again
echo ""
echo "Step 5: Updating package lists with Docker repo..."
sudo apt-get update

# Install Docker
echo ""
echo "Step 6: Installing Docker..."
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker service
echo ""
echo "Step 7: Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
echo ""
echo "Step 8: Adding user to docker group..."
sudo usermod -aG docker $USER

# Test Docker installation
echo ""
echo "Step 9: Testing Docker installation..."
sudo docker run hello-world

echo ""
echo "=================================="
echo "✅ Docker Installation Complete!"
echo "=================================="
echo ""
echo "⚠️  IMPORTANT: You need to log out and log back in"
echo "    for the docker group changes to take effect."
echo ""
echo "After logging back in, test with:"
echo "  docker --version"
echo "  docker ps"
echo ""
echo "Then restart the backend:"
echo "  cd /home/hbaqa/Desktop/banque-app-transformed/platform/backend"
echo "  npm run dev"
echo ""
