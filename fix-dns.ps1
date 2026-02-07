# Quick DNS Fix Script for MongoDB Atlas Connection
# Run as Administrator: Right-click → Run with PowerShell

Write-Host "🔧 DNS Fix Script for MongoDB Atlas" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  This script needs Administrator privileges" -ForegroundColor Yellow
    Write-Host "   Right-click this file and select 'Run with PowerShell'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
    exit
}

Write-Host "✅ Running with Administrator privileges" -ForegroundColor Green
Write-Host ""

# Step 1: Flush DNS Cache
Write-Host "1️⃣  Flushing DNS cache..." -ForegroundColor Yellow
try {
    ipconfig /flushdns | Out-Null
    ipconfig /registerdns | Out-Null
    Write-Host "✅ DNS cache flushed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to flush DNS cache" -ForegroundColor Red
}
Write-Host ""

# Step 2: Get active network adapters
Write-Host "2️⃣  Finding active network adapters..." -ForegroundColor Yellow
$adapters = Get-NetAdapter | Where-Object { $_.Status -eq 'Up' }

if ($adapters.Count -eq 0) {
    Write-Host "❌ No active network adapters found" -ForegroundColor Red
    exit
}

Write-Host "✅ Found $($adapters.Count) active adapter(s)" -ForegroundColor Green
foreach ($adapter in $adapters) {
    Write-Host "   - $($adapter.Name) ($($adapter.InterfaceDescription))" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Change DNS to Google DNS
Write-Host "3️⃣  Changing DNS servers to Google DNS (8.8.8.8, 8.8.4.4)..." -ForegroundColor Yellow

foreach ($adapter in $adapters) {
    try {
        # Set DNS servers
        Set-DnsClientServerAddress -InterfaceAlias $adapter.Name -ServerAddresses ("8.8.8.8", "8.8.4.4")
        Write-Host "✅ Updated DNS for: $($adapter.Name)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not update: $($adapter.Name)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 4: Test DNS Resolution
Write-Host "4️⃣  Testing DNS resolution..." -ForegroundColor Yellow
try {
    $result = Resolve-DnsName -Name "inventicluster.evstzpk.mongodb.net" -Server "8.8.8.8" -ErrorAction Stop
    Write-Host "✅ DNS resolution successful!" -ForegroundColor Green
    Write-Host "   Resolved to: $($result[0].IPAddress)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️  DNS resolution test failed" -ForegroundColor Yellow
    Write-Host "   This might take a moment to propagate..." -ForegroundColor Gray
}
Write-Host ""

# Step 5: Test MongoDB Connection
Write-Host "5️⃣  Testing MongoDB connection..." -ForegroundColor Yellow
$backendPath = ".\backend"

if (Test-Path $backendPath) {
    Write-Host "⏳ Running connection test (this may take 10 seconds)..." -ForegroundColor Gray
    Push-Location $backendPath
    
    $testOutput = node scripts\diagnose-mongo.js 2>&1 | Out-String
    
    if ($testOutput -match "Connected Successfully") {
        Write-Host "✅ MongoDB connection successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  MongoDB connection test result:" -ForegroundColor Yellow
        Write-Host $testOutput -ForegroundColor Gray
    }
    
    Pop-Location
} else {
    Write-Host "⚠️  Backend folder not found, skipping connection test" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "📋 SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ DNS cache flushed" -ForegroundColor Green
Write-Host "✅ DNS servers changed to Google DNS (8.8.8.8, 8.8.4.4)" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Restart your backend server:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   node src/server.js" -ForegroundColor Gray
Write-Host ""
Write-Host "2. You should see:" -ForegroundColor White
Write-Host "   ✅ MongoDB Connected: inventicluster.evstzpk.mongodb.net" -ForegroundColor Gray
Write-Host ""
Write-Host "3. If you want to clear old data:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   node scripts/clear-database.js" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start your Expo app:" -ForegroundColor White
Write-Host "   npx expo start" -ForegroundColor Gray
Write-Host ""

# Option to revert DNS
Write-Host "💡 To revert DNS to automatic (undo changes):" -ForegroundColor Cyan
Write-Host "   Run this script again with -Revert flag" -ForegroundColor Gray
Write-Host "   Or manually: Network Settings → Adapter Properties → IPv4 → Obtain DNS automatically" -ForegroundColor Gray
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
