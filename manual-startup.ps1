# Manual startup script - Run each step individually to debug issues

Write-Host "🔧 Manual Startup Script for JELPAPHARM Pharmacy Management System" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "This script will run each step individually so you can see any errors." -ForegroundColor Yellow
Write-Host ""

# Step 1: Check Node.js and npm
Write-Host "Step 1: Checking Node.js and npm..." -ForegroundColor Yellow
Write-Host "Node version: $(node --version)" -ForegroundColor Cyan
Write-Host "npm version: $(npm --version)" -ForegroundColor Cyan
Write-Host "Press Enter to continue to Step 2..." -ForegroundColor White
Read-Host

# Step 2: Check server dependencies
Write-Host "`nStep 2: Checking server dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "server/node_modules")) {
    Write-Host "Installing server dependencies..." -ForegroundColor Yellow
    Set-Location server
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Server dependency installation failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
} else {
    Write-Host "✅ Server dependencies already installed" -ForegroundColor Green
}
Write-Host "Press Enter to continue to Step 3..." -ForegroundColor White
Read-Host

# Step 3: Build server
Write-Host "`nStep 3: Building server..." -ForegroundColor Yellow
Set-Location server
Write-Host "Running: npm run build" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Server build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✅ Server built successfully" -ForegroundColor Green
Write-Host "Press Enter to continue to Step 4..." -ForegroundColor White
Read-Host

# Step 4: Check client dependencies
Write-Host "`nStep 4: Checking client dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "client/node_modules")) {
    Write-Host "Installing client dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Client dependency installation failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
} else {
    Write-Host "✅ Client dependencies already installed" -ForegroundColor Green
}
Write-Host "Press Enter to continue to Step 5..." -ForegroundColor White
Read-Host

# Step 5: Start server manually
Write-Host "`nStep 5: Starting server manually..." -ForegroundColor Yellow
Write-Host "This will start the server in a new PowerShell window." -ForegroundColor Cyan
Write-Host "You should see any error messages in that window." -ForegroundColor Cyan
Write-Host "Press Enter to start the server..." -ForegroundColor White
Read-Host

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; Write-Host 'Starting server...'; npm start" -WindowStyle Normal

Write-Host "Server started in new window. Check that window for any errors." -ForegroundColor Green
Write-Host "Press Enter to continue to Step 6..." -ForegroundColor White
Read-Host

# Step 6: Start client manually
Write-Host "`nStep 6: Starting client manually..." -ForegroundColor Yellow
Write-Host "This will start the Expo client in a new PowerShell window." -ForegroundColor Cyan
Write-Host "You should see any error messages in that window." -ForegroundColor Cyan
Write-Host "Press Enter to start the client..." -ForegroundColor White
Read-Host

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; Write-Host 'Starting Expo client...'; npm start" -WindowStyle Normal

Write-Host "Client started in new window. Check that window for any errors." -ForegroundColor Green
Write-Host "`n✅ Manual startup complete!" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "📊 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3000 (or Expo DevTools)" -ForegroundColor Cyan
Write-Host "🔔 Alert Integration: Navigate to Alerts screen to see the unified system" -ForegroundColor Magenta
Write-Host "`n💡 Check the PowerShell windows that opened for any error messages" -ForegroundColor Yellow
Write-Host "💡 To stop servers, close the PowerShell windows or press Ctrl+C in each window" -ForegroundColor Yellow
