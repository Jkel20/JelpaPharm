#!/bin/bash

echo "🚀 Setting up JELPAPHARM Pharmacy Management System with Expo..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Copy environment file
echo "📝 Setting up environment variables..."
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ Environment file created. Please edit server/.env with your configuration."
else
    echo "✅ Environment file already exists."
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit server/.env with your MongoDB connection and JWT secret"
echo "2. Start the backend: npm run server"
echo "3. Start the Expo app: cd client && npm start"
echo ""
echo "Access points:"
echo "- Backend API: http://localhost:5000"
echo "- Web App: http://localhost:19006"
echo "- Mobile: Use Expo Go app to scan QR code"
echo ""
echo "Happy coding! 🚀"
