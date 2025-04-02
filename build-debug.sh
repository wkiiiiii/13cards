#!/bin/bash

# This script helps debug build issues on Render

# Set environment variable
export NODE_ENV=production

# Show current directory and Node.js version
echo "Current directory: $(pwd)"
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install server dependencies
echo "Installing server dependencies..."
npm install

# Install client dependencies
echo "Installing client dependencies..."
cd client
npm install

# Build client
echo "Building client..."
npm run build
cd ..

# List build directory to verify it exists
echo "Client build directory contents:"
ls -la client/build

# Ensure client build directory exists
if [ ! -d "client/build" ]; then
  echo "ERROR: client/build directory does not exist!"
  exit 1
fi

echo "Build process completed successfully!" 