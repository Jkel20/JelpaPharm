@echo off
REM 🚀 JELPAPHARM Pharmacy Management System - Deployment Script (Windows)
REM This script prepares the project for production deployment on Render

echo 🚀 Starting JELPAPHARM Pharmacy Management System deployment preparation...

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory
    exit /b 1
)

if not exist "server" (
    echo [ERROR] Server directory not found
    exit /b 1
)

if not exist "client" (
    echo [ERROR] Client directory not found
    exit /b 1
)

echo [INFO] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    exit /b 1
)

echo [INFO] Checking npm version...
npm --version
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    exit /b 1
)

echo [INFO] Installing dependencies...
call npm run install-all
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully

echo [INFO] Building server for production...
cd server
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build server
    exit /b 1
)
echo [SUCCESS] Server built successfully
cd ..

echo [INFO] Building client for production...
cd client
call npm run build:web
if %errorlevel% neq 0 (
    echo [WARNING] Failed to build client web version
    echo [INFO] This is optional for backend deployment
)
echo [SUCCESS] Client build completed
cd ..

echo [INFO] Running linting checks...
call npm run lint
if %errorlevel% neq 0 (
    echo [WARNING] Linting issues found. Please fix them before deployment.
) else (
    echo [SUCCESS] Linting passed
)

echo [INFO] Checking for sensitive files...
if exist "server\.env" (
    echo [WARNING] Found server\.env file. Make sure it's not committed to Git.
)

if exist "client\.env" (
    echo [WARNING] Found client\.env file. Make sure it's not committed to Git.
)

echo [INFO] Checking for build artifacts...
if exist "server\dist" (
    echo [SUCCESS] Server build artifacts found
) else (
    echo [ERROR] Server build artifacts not found
    exit /b 1
)

if exist "client\web-build" (
    echo [SUCCESS] Client build artifacts found
) else (
    echo [WARNING] Client web build artifacts not found
)

echo.
echo 🎉 Deployment preparation completed!
echo.
echo 📋 Next steps:
echo 1. Review and commit your changes:
echo    git add .
echo    git commit -m "Production ready for Render deployment"
echo.
echo 2. Push to GitHub:
echo    git push origin main
echo.
echo 3. Deploy on Render:
echo    - Go to https://render.com
echo    - Create new Web Service
echo    - Connect your GitHub repository
echo    - Use build command: cd server ^&^& npm install ^&^& npm run build
echo    - Use start command: cd server ^&^& npm start
echo    - Add environment variables (see DEPLOYMENT.md)
echo.
echo 4. Update client configuration with your Render URL
echo.
echo 📖 For detailed instructions, see DEPLOYMENT.md
echo.
echo [SUCCESS] Ready for deployment! 🚀
pause
