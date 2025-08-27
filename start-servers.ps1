# Start the integrated alert and notification system servers

Write-Host "🚀 Starting JELPAPHARM Pharmacy Management System..." -ForegroundColor Green

# Start the server
Write-Host "📡 Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start" -WindowStyle Normal

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Start the client
Write-Host "🖥️ Starting frontend client..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm start" -WindowStyle Normal

Write-Host "✅ Both servers started!" -ForegroundColor Green
Write-Host "📊 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔔 Alert Integration: Navigate to Alerts screen to see the unified system" -ForegroundColor Magenta
