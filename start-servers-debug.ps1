# Comprehensive startup script with debugging for JELPAPHARM Pharmacy Management System

Write-Host "🚀 Starting JELPAPHARM Pharmacy Management System with Debug Mode..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js and npm found" -ForegroundColor Green
Write-Host "Node version: $(node --version)" -ForegroundColor Cyan
Write-Host "npm version: $(npm --version)" -ForegroundColor Cyan

# Check if server dist directory exists
Write-Host "`n🔍 Checking server build status..." -ForegroundColor Yellow
if (-not (Test-Path "server/dist")) {
    Write-Host "⚠️ Server dist directory not found. Building server..." -ForegroundColor Yellow
    
    Set-Location server
    Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "🔨 Building server (TypeScript compilation)..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Server build failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
    Write-Host "✅ Server built successfully" -ForegroundColor Green
} else {
    Write-Host "✅ Server dist directory found" -ForegroundColor Green
}

# Check if client node_modules exists
Write-Host "`n🔍 Checking client dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "client/node_modules")) {
    Write-Host "⚠️ Client node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    
    Set-Location client
    Write-Host "📦 Installing client dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Client dependency installation failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
    Write-Host "✅ Client dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Client dependencies found" -ForegroundColor Green
}

# Check if server node_modules exists
Write-Host "`n🔍 Checking server dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "server/node_modules")) {
    Write-Host "⚠️ Server node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    
    Set-Location server
    Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Server dependency installation failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    
    Set-Location ..
    Write-Host "✅ Server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✅ Server dependencies found" -ForegroundColor Green
}

Write-Host "`n🚀 Starting servers..." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan

# Start the server with error logging
Write-Host "📡 Starting backend server..." -ForegroundColor Yellow
$serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; Write-Host 'Starting server...'; npm start" -WindowStyle Normal -PassThru

# Wait a moment for server to start
Start-Sleep -Seconds 5

# Check if server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend server is running on http://localhost:5000" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Backend server may not be fully started yet. Continuing..." -ForegroundColor Yellow
}

# Start the client
Write-Host "🖥️ Starting frontend client..." -ForegroundColor Yellow
$clientProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; Write-Host 'Starting Expo client...'; npm start" -WindowStyle Normal -PassThru

# Wait a moment for client to start
Start-Sleep -Seconds 3

Write-Host "`n✅ Both servers started!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📊 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3000 (or Expo DevTools)" -ForegroundColor Cyan
Write-Host "🔔 Alert Integration: Navigate to Alerts screen to see the unified system" -ForegroundColor Magenta
Write-Host "`n💡 If you see any errors, check the PowerShell windows that opened" -ForegroundColor Yellow
Write-Host "💡 To stop servers, close the PowerShell windows or press Ctrl+C in each window" -ForegroundColor Yellow

# Keep the script running to show status
Write-Host "`n🔄 Monitoring server status..." -ForegroundColor Green
Write-Host "Press Ctrl+C to exit this script (servers will continue running)" -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        # Check server status
        try {
            $serverResponse = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 3 -ErrorAction Stop
            Write-Host "✅ Backend server: Running" -ForegroundColor Green
        } catch {
            Write-Host "❌ Backend server: Not responding" -ForegroundColor Red
        }
        
        # Check if processes are still running
        if ($serverProcess.HasExited) {
            Write-Host "❌ Backend server process has stopped" -ForegroundColor Red
        }
        if ($clientProcess.HasExited) {
            Write-Host "❌ Frontend client process has stopped" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "`n👋 Exiting monitoring..." -ForegroundColor Yellow
}
