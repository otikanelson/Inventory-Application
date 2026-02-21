# Network Setup Guide for Testing

## Problem

The app is showing "No Sales Yet" even though:
- ✅ Authentication is working
- ✅ Backend has data (verified with debug scripts)
- ✅ Token is being sent with requests

**Root Cause**: The app is trying to connect to the **production backend (Vercel)**, which uses a **different database** than your local backend. The production database doesn't have the test sales data.

---

## Solution Options

### Option 1: Use Local Backend (Recommended for Development)

This allows you to test with the local database that has the sales data.

#### For iOS Simulator

1. **Update .env file**:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:8000/api
   ```

2. **Restart the app**:
   - Stop the Expo dev server
   - Run `npx expo start --clear`
   - Reload the app

3. **Verify**:
   - Check console logs for: `📤 [REQUEST] GET http://localhost:8000/api/analytics/recently-sold`
   - Should see data loading

#### For Android Emulator

1. **Update .env file**:
   ```env
   EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api
   ```

2. **Restart the app**:
   - Stop the Expo dev server
   - Run `npx expo start --clear`
   - Reload the app

3. **Verify**:
   - Check console logs for: `📤 [REQUEST] GET http://10.0.2.2:8000/api/analytics/recently-sold`
   - Should see data loading

#### For Physical Device (Same Network)

1. **Find your computer's IP address**:
   - Windows: Run `ipconfig` and look for IPv4 Address
   - Mac/Linux: Run `ifconfig` and look for inet address
   - Example: `192.168.1.100`

2. **Update .env file**:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
   ```

3. **Ensure backend allows connections**:
   - Check backend CORS settings
   - Backend should allow requests from your device's IP

4. **Restart the app**:
   - Stop the Expo dev server
   - Run `npx expo start --clear`
   - Reload the app

---

### Option 2: Use Production Backend with Production Data

This requires deploying your fixes to production and ensuring the production database has data.

#### Step 1: Deploy Backend to Vercel

```bash
cd backend
vercel --prod
```

#### Step 2: Verify Production Database Has Data

Run this script to check production database:

```bash
# Update backend/.env to use production MONGO_URI
node backend/scripts/test-multi-tenancy-fixes.js
```

#### Step 3: Use Production Backend in App

```env
EXPO_PUBLIC_API_URL=https://inventory-application-git-backend-otikanelsons-projects.vercel.app/api
```

---

## Current Setup Detection

Based on your screenshots, you're using:
- **Backend**: Production (Vercel)
- **Database**: Production MongoDB
- **Issue**: Production database doesn't have the test sales data

---

## Recommended Steps

### For Immediate Testing (Use Local Backend)

1. **Check what device you're using**:
   - iOS Simulator → Use `http://localhost:8000/api`
   - Android Emulator → Use `http://10.0.2.2:8000/api`
   - Physical Device → Use `http://YOUR_IP:8000/api`

2. **Update .env file** with the correct URL

3. **Ensure local backend is running**:
   ```bash
   cd backend
   npm start
   ```
   
   Should see:
   ```
   ✅ MongoDB Connected
   Server running on port 8000
   ```

4. **Restart the app**:
   ```bash
   npx expo start --clear
   ```

5. **Log out and log back in**:
   - This ensures a fresh auth token
   - Check AuthDebugger to verify authentication

6. **Check Recently Sold tab**:
   - Should now show 2 products (Joy soap, CWAY bottle water)

### For Production Testing (Use Production Backend)

1. **Add test data to production database**:
   - Log in to production app
   - Add some products
   - Record some sales

2. **Or deploy local database to production**:
   - Export local database
   - Import to production MongoDB
   - Verify data exists

3. **Deploy backend fixes to production**:
   ```bash
   cd backend
   vercel --prod
   ```

4. **Test production app**:
   - Should now show sales data

---

## Troubleshooting

### "Network Error" in console

**Cause**: App can't reach backend

**Solutions**:
- Verify backend is running (`http://localhost:8000` in browser)
- Check firewall isn't blocking connections
- Verify correct IP address for physical device
- For Android emulator, use `10.0.2.2` not `localhost`

### "401 Unauthorized" errors

**Cause**: Auth token not being sent or invalid

**Solutions**:
- Log out and log back in
- Check AuthDebugger shows token exists
- Verify backend is receiving Authorization header

### Data still not showing

**Cause**: Backend database doesn't have data

**Solutions**:
- Run debug script: `node backend/scripts/test-multi-tenancy-fixes.js`
- Verify you're connected to correct database
- Check if you're using local vs production backend
- Add test data if needed

---

## Quick Test Commands

### Test Local Backend
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Test endpoint
curl http://localhost:8000/api/products
# Should return 401 (requires auth) - this is good!

# Terminal 3: Run debug script
node backend/scripts/test-multi-tenancy-fixes.js
# Should show sales data exists
```

### Test Production Backend
```bash
node test-production-backend.js
# Should show backend is running
```

---

## Environment File Reference

### .env (Default)
```env
# Use local backend for development
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

### .env.local (Local Development)
```env
# iOS Simulator
EXPO_PUBLIC_API_URL=http://localhost:8000/api

# Android Emulator
# EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api

# Physical Device (replace with your IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.100:8000/api
```

### .env.production (Production Builds)
```env
# Production backend
EXPO_PUBLIC_API_URL=https://inventory-application-git-backend-otikanelsons-projects.vercel.app/api
```

---

## Next Steps

1. **Determine your testing environment**:
   - Are you using iOS Simulator, Android Emulator, or Physical Device?

2. **Update .env file** with correct backend URL

3. **Restart everything**:
   - Backend server
   - Expo dev server
   - App (log out and log back in)

4. **Verify with AuthDebugger and console logs**

5. **Check Recently Sold tab** - should now show data!

---

**Need Help?**

Check the console logs for:
- `📤 [REQUEST] GET <URL>` - Shows which backend you're connecting to
- `🔐 [AUTH] Token added` - Confirms authentication is working
- `✅ [200]` - Successful API response
- `🔒 [401]` - Authentication issue
- `📡 [NETWORK ERROR]` - Can't reach backend

Use AuthDebugger (bug icon) to verify authentication status.
