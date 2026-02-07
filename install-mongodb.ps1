# MongoDB Installation Helper Script
# Run this with: powershell -ExecutionPolicy Bypass -File install-mongodb.ps1

Write-Host "🔍 MongoDB Installation Helper" -ForegroundColor Cyan
Write-Host "=" * 50

# Check if MongoDB is already installed
Write-Host "`n1️⃣  Checking if MongoDB is installed..." -ForegroundColor Yellow
$mongoPath = "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
$mongoPath7 = "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"

if (Test-Path $mongoPath) {
    Write-Host "✅ MongoDB 8.0 is already installed!" -ForegroundColor Green
    $installed = $true
} elseif (Test-Path $mongoPath7) {
    Write-Host "✅ MongoDB 7.0 is already installed!" -ForegroundColor Green
    $installed = $true
} else {
    Write-Host "❌ MongoDB is not installed" -ForegroundColor Red
    $installed = $false
}

# Check if Chocolatey is available
Write-Host "`n2️⃣  Checking for Chocolatey package manager..." -ForegroundColor Yellow
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if ($chocoInstalled) {
    Write-Host "✅ Chocolatey is installed" -ForegroundColor Green
    
    if (-not $installed) {
        Write-Host "`n📦 Would you like to install MongoDB using Chocolatey? (Y/N)" -ForegroundColor Cyan
        $response = Read-Host
        
        if ($response -eq 'Y' -or $response -eq 'y') {
            Write-Host "`n⏳ Installing MongoDB..." -ForegroundColor Yellow
            choco install mongodb -y
            
            Write-Host "`n✅ MongoDB installation complete!" -ForegroundColor Green
            $installed = $true
        }
    }
} else {
    Write-Host "⚠️  Chocolatey is not installed" -ForegroundColor Yellow
    Write-Host "   You can install it from: https://chocolatey.org/install" -ForegroundColor Gray
}

# If not installed, provide manual instructions
if (-not $installed) {
    Write-Host "`n📥 Manual Installation Required" -ForegroundColor Yellow
    Write-Host "=" * 50
    Write-Host "`nPlease follow these steps:" -ForegroundColor Cyan
    Write-Host "1. Go to: https://www.mongodb.com/try/download/community"
    Write-Host "2. Download MongoDB Community Server for Windows"
    Write-Host "3. Run the installer and choose 'Complete' installation"
    Write-Host "4. Make sure to check 'Install MongoDB as a Service'"
    Write-Host "5. Come back and run this script again"
    Write-Host "`nPress any key to open the download page..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    Start-Process "https://www.mongodb.com/try/download/community"
    exit
}

# Check if MongoDB service is running
Write-Host "`n3️⃣  Checking MongoDB service..." -ForegroundColor Yellow
$service = Get-Service -Name MongoDB -ErrorAction SilentlyContinue

if ($service) {
    if ($service.Status -eq 'Running') {
        Write-Host "✅ MongoDB service is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB service is not running. Starting it..." -ForegroundColor Yellow
        Start-Service -Name MongoDB
        Write-Host "✅ MongoDB service started" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  MongoDB service not found" -ForegroundColor Yellow
    Write-Host "   You may need to restart your computer after installation" -ForegroundColor Gray
}

# Update backend .env file
Write-Host "`n4️⃣  Updating backend configuration..." -ForegroundColor Yellow
$envPath = ".\backend\.env"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    # Check if already using local MongoDB
    if ($envContent -match "mongodb://localhost:27017") {
        Write-Host "✅ Backend .env already configured for local MongoDB" -ForegroundColor Green
    } else {
        # Backup original
        Copy-Item $envPath "$envPath.backup" -Force
        Write-Host "📋 Created backup: backend\.env.backup" -ForegroundColor Gray
        
        # Update MONGO_URI
        $envContent = $envContent -replace "MONGO_URI=.*", "MONGO_URI=mongodb://localhost:27017/inventiease"
        Set-Content $envPath $envContent -NoNewline
        
        Write-Host "✅ Updated backend\.env to use local MongoDB" -ForegroundColor Green
    }
} else {
    Write-Host "❌ backend\.env file not found" -ForegroundColor Red
}

# Test connection
Write-Host "`n5️⃣  Testing MongoDB connection..." -ForegroundColor Yellow
$testScriptPath = ".\backend\scripts\test-mongo.js"

if (Test-Path $testScriptPath) {
    Write-Host "⏳ Running connection test..." -ForegroundColor Gray
    Push-Location backend
    $testResult = node scripts\test-mongo.js 2>&1
    Pop-Location
    
    if ($testResult -match "Connected Successfully") {
        Write-Host "✅ MongoDB connection successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Connection test result:" -ForegroundColor Yellow
        Write-Host $testResult -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️  Test script not found, skipping connection test" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
Write-Host "📋 NEXT STEPS" -ForegroundColor Cyan
Write-Host ("=" * 50) -ForegroundColor Cyan

Write-Host "`n1. Restart your backend server:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   node src/server.js" -ForegroundColor White

Write-Host "`n2. Seed the database:" -ForegroundColor Yellow
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   node scripts/seed-sample-data.js" -ForegroundColor White

Write-Host "`n3. Start your Expo app:" -ForegroundColor Yellow
Write-Host "   npx expo start" -ForegroundColor White

Write-Host "`n✨ You're all set! MongoDB is ready to use." -ForegroundColor Green
Write-Host ""
