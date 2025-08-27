# Simple server startup script with environment variables

Write-Host "🚀 Starting JELPAPHARM Pharmacy Management Server..." -ForegroundColor Green

# Set environment variables
$env:PORT = "5000"
$env:NODE_ENV = "development"
$env:MONGODB_URI = "mongodb://localhost:27017/pharmacy_management"
$env:JWT_SECRET = "dev-secret-key-for-development-only"
$env:JWT_EXPIRE = "7d"
$env:JWT_COOKIE_EXPIRE = "7"
$env:EMAIL_HOST = "smtp.gmail.com"
$env:EMAIL_PORT = "587"
$env:EMAIL_USER = "dev@example.com"
$env:EMAIL_PASS = "dev-password"
$env:EMAIL_FROM = "noreply@ghanapharmacy.com"
$env:BCRYPT_ROUNDS = "12"
$env:RATE_LIMIT_WINDOW_MS = "900000"
$env:RATE_LIMIT_MAX_REQUESTS = "100"
$env:MAX_FILE_SIZE = "5242880"
$env:UPLOAD_PATH = "./uploads"
$env:APP_NAME = "JELPAPHARM Pharmacy Management System"
$env:APP_URL = "http://localhost:3000"

Write-Host "✅ Environment variables set" -ForegroundColor Green
Write-Host "📡 Starting server on port 5000..." -ForegroundColor Yellow

# Change to server directory and start
Set-Location server
npm start
