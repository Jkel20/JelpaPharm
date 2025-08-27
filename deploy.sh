#!/bin/bash

# 🚀 JELPAPHARM Pharmacy Management System - Deployment Script
# This script prepares the project for production deployment on Render

echo "🚀 Starting JELPAPHARM Pharmacy Management System deployment preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "server" ] || [ ! -d "client" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi
print_success "Node.js version: $(node --version)"

print_status "Checking npm version..."
NPM_VERSION=$(npm --version | cut -d'.' -f1)
if [ "$NPM_VERSION" -lt 8 ]; then
    print_error "npm version 8 or higher is required. Current version: $(npm --version)"
    exit 1
fi
print_success "npm version: $(npm --version)"

print_status "Installing dependencies..."
npm run install-all
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi
print_success "Dependencies installed successfully"

print_status "Building server for production..."
cd server
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build server"
    exit 1
fi
print_success "Server built successfully"
cd ..

print_status "Building client for production..."
cd client
npm run build:web
if [ $? -ne 0 ]; then
    print_error "Failed to build client"
    exit 1
fi
print_success "Client built successfully"
cd ..

print_status "Running linting checks..."
npm run lint
if [ $? -ne 0 ]; then
    print_warning "Linting issues found. Please fix them before deployment."
else
    print_success "Linting passed"
fi

print_status "Checking for sensitive files..."
if [ -f "server/.env" ]; then
    print_warning "Found server/.env file. Make sure it's not committed to Git."
fi

if [ -f "client/.env" ]; then
    print_warning "Found client/.env file. Make sure it's not committed to Git."
fi

print_status "Checking .gitignore..."
if grep -q "\.env" .gitignore; then
    print_success ".env files are properly ignored"
else
    print_warning ".env files are not in .gitignore"
fi

print_status "Checking for build artifacts..."
if [ -d "server/dist" ]; then
    print_success "Server build artifacts found"
else
    print_error "Server build artifacts not found"
    exit 1
fi

if [ -d "client/web-build" ]; then
    print_success "Client build artifacts found"
else
    print_warning "Client web build artifacts not found"
fi

echo ""
echo "🎉 Deployment preparation completed!"
echo ""
echo "📋 Next steps:"
echo "1. Review and commit your changes:"
echo "   git add ."
echo "   git commit -m 'Production ready for Render deployment'"
echo ""
echo "2. Push to GitHub:"
echo "   git push origin main"
echo ""
echo "3. Deploy on Render:"
echo "   - Go to https://render.com"
echo "   - Create new Web Service"
echo "   - Connect your GitHub repository"
echo "   - Use build command: cd server && npm install && npm run build"
echo "   - Use start command: cd server && npm start"
echo "   - Add environment variables (see DEPLOYMENT.md)"
echo ""
echo "4. Update client configuration with your Render URL"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
print_success "Ready for deployment! 🚀"
