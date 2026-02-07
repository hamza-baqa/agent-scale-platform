#!/bin/bash

echo "Configuring passwordless sudo for Docker commands..."
echo ""

# Create sudoers rule for docker commands
echo "$USER ALL=(ALL) NOPASSWD: /usr/bin/docker" | sudo tee /etc/sudoers.d/docker-nopasswd > /dev/null

# Set proper permissions
sudo chmod 0440 /etc/sudoers.d/docker-nopasswd

echo "✅ Configuration complete!"
echo ""
echo "You can now run 'sudo docker' commands without a password."
echo ""
