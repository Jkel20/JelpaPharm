@echo off
echo 🚀 Setting up JELPAPHARM Pharmacy Management System with Expo...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are installed

REM Install root dependencies
echo 📦 Installing root dependencies...
npm install

REM Install server dependencies
echo 📦 Installing server dependencies...
cd server
npm install
cd ..

REM Install client dependencies
echo 📦 Installing client dependencies...
cd client
npm install
cd ..

REM Copy environment file
echo 📝 Setting up environment variables...
if not exist "server\.env" (
    copy "server\env.example" "server\.env"
    echo ✅ Environment file created. Please edit server\.env with your configuration.
) else (
    echo ✅ Environment file already exists.
)

echo.
echo 🎉 Setup complete!
echo.
echo Next steps:
echo 1. Edit server\.env with your MongoDB connection and JWT secret
echo 2. Start the backend: npm run server
echo 3. Start the Expo app: cd client ^&^& npm start
echo.
echo Access points:
echo - Backend API: http://localhost:5000
echo - Web App: http://localhost:19006
echo - Mobile: Use Expo Go app to scan QR code
echo.
echo Happy coding! 🚀
pause
