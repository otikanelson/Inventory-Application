# Fix Network Error - Find correct IP and update .env
# Run with: powershell -ExecutionPolicy Bypass -File fix-network.ps1

Write-Host "🔌 Network Error Fix Script" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# Step 1: Detect all network IPs
Write-Host "1️⃣  Detecting network interfaces..." -ForegroundColor Yellow
$allIPs = Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} |
    Select-Object IPAddress, InterfaceAlias

if ($allIPs.Count -eq 0) {
    Write-Host "❌ No local network IPs found" -ForegroundColor Red
    Write-Host "   Are you connected to a network?" -ForegroundColor Gray
    exit
}

Write-Host "✅ Found $($allIPs.Count) network interface(s):" -ForegroundColor Green
$allIPs | ForEach-Object {
    Write-Host "   - $($_.IPAddress) ($($_.InterfaceAlias))" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Identify WiFi IP (most common for mobile development)
Write-Host "2️⃣  Identifying WiFi IP..." -ForegroundColor Yellow
$wifiIP = $allIPs | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*"} | Select-Object -First 1

if ($wifiIP) {
    Write-Host "✅ WiFi IP found: $($wifiIP.IPAddress)" -ForegroundColor Green
    $recommendedIP = $wifiIP.IPAddress
} else {
    Write-Host "⚠️  No WiFi adapter found" -ForegroundColor Yellow
    Write-Host "   Using first available IP: $($allIPs[0].IPAddress)" -ForegroundColor Gray
    $recommendedIP = $allIPs[0].IPAddress
}
Write-Host ""

# Step 3: Check what device type user is using
Write-Host "3️⃣  What device are you testing on?" -ForegroundColor Yellow
Write-Host "   1. Physical Android device (phone/tablet)" -ForegroundColor White
Write-Host "   2. Android Emulator (AVD)" -ForegroundColor White
Write-Host "   3. iOS Simulator" -ForegroundColor White
Write-Host ""
$deviceChoice = Read-Host "Enter choice (1-3)"

$newAPIUrl = ""
switch ($deviceChoice) {
    "1" {
        $newAPIUrl = "http://${recommendedIP}:8000/api"
        Write-Host "✅ Using WiFi IP for physical device" -ForegroundColor Green
    }
    "2" {
        Write-Host "   For Android Emulator, you can use:" -ForegroundColor Gray
        Write-Host "   a) 10.0.2.2 (emulator's special IP)" -ForegroundColor White
        Write-Host "   b) Your WiFi IP: $recommendedIP" -ForegroundColor White
        Write-Host ""
        $emulatorChoice = Read-Host "Enter choice (a/b)"
        if ($emulatorChoice -eq "a") {
            $newAPIUrl = "http://10.0.2.2:8000/api"
            Write-Host "✅ Using emulator special IP" -ForegroundColor Green
        } else {
            $newAPIUrl = "http://${recommendedIP}:8000/api"
            Write-Host "✅ Using WiFi IP" -ForegroundColor Green
        }
    }
    "3" {
        $newAPIUrl = "http://localhost:8000/api"
        Write-Host "✅ Using localhost for iOS Simulator" -ForegroundColor Green
    }
    default {
        $newAPIUrl = "http://${recommendedIP}:8000/api"
        Write-Host "⚠️  Invalid choice, using WiFi IP" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 4: Update .env file
Write-Host "4️⃣  Updating .env file..." -ForegroundColor Yellow
$envPath = ".\.env"

if (Test-Path $envPath) {
    # Backup
    Copy-Item $envPath "$envPath.backup" -Force
    Write-Host "📋 Created backup: .env.backup" -ForegroundColor Gray
    
    # Read and update
    $envContent = Get-Content $envPath -Raw
    $envContent = $envContent -replace "EXPO_PUBLIC_API_URL=.*", "EXPO_PUBLIC_API_URL=$newAPIUrl"
    Set-Content $envPath $envContent -NoNewline
    
    Write-Host "✅ Updated .env file" -ForegroundColor Green
    Write-Host "   New API URL: $newAPIUrl" -ForegroundColor Gray
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
}
Write-Host ""

# Step 5: Test backend accessibility
Write-Host "5️⃣  Testing backend server..." -ForegroundColor Yellow
$backendURL = "http://localhost:8000"

try {
    $response = Invoke-WebRequest -Uri $backendURL -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend is running on port 8000" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not accessible" -ForegroundColor Red
    Write-Host "   Make sure backend is running: cd backend && node src/server.js" -ForegroundColor Gray
}
Write-Host ""

# Step 6: Configure firewall (for physical devices)
if ($deviceChoice -eq "1") {
    Write-Host "6️⃣  Configuring Windows Firewall..." -ForegroundColor Yellow
    
    # Check if running as admin
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    
    if ($isAdmin) {
        try {
            netsh advfirewall firewall add rule name="Node.js Server Port 8000" dir=in action=allow protocol=TCP localport=8000 | Out-Null
            Write-Host "✅ Firewall rule added for port 8000" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Firewall rule might already exist" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  Not running as Administrator" -ForegroundColor Yellow
        Write-Host "   Run this script as Admin to configure firewall automatically" -ForegroundColor Gray
        Write-Host "   Or manually allow Node.js through Windows Firewall" -ForegroundColor Gray
    }
    Write-Host ""
}

# Summary
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "📋 SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Configuration updated!" -ForegroundColor Green
Write-Host "   API URL: $newAPIUrl" -ForegroundColor White
Write-Host ""

if ($deviceChoice -eq "1") {
    Write-Host "📱 For Physical Device:" -ForegroundColor Yellow
    Write-Host "   1. Make sure phone and computer are on SAME WiFi" -ForegroundColor White
    Write-Host "   2. Test backend from phone browser: http://${recommendedIP}:8000" -ForegroundColor White
    Write-Host "   3. If it doesn't load, check firewall settings" -ForegroundColor White
} elseif ($deviceChoice -eq "2") {
    Write-Host "💻 For Android Emulator:" -ForegroundColor Yellow
    if ($newAPIUrl -like "*10.0.2.2*") {
        Write-Host "   Using emulator special IP (10.0.2.2)" -ForegroundColor White
        Write-Host "   This should work automatically" -ForegroundColor White
    } else {
        Write-Host "   Alternative: Run 'adb reverse tcp:8000 tcp:8000'" -ForegroundColor White
        Write-Host "   Then use: http://localhost:8000/api" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🔄 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Restart Expo app (Ctrl+C, then npx expo start)" -ForegroundColor White
Write-Host "   2. Reload app on device (shake device → Reload)" -ForegroundColor White
Write-Host "   3. Check for 'Network Error' - should be gone!" -ForegroundColor White
Write-Host ""
Write-Host "✨ Your app should now connect to the backend!" -ForegroundColor Green
Write-Host ""
