# Environment Setup Guide - Never Build with Wrong URL Again! 🎯

## Problem Solved ✅

You had two concerns:
1. **Development**: Don't want to use production URL (slow to see changes)
2. **Production**: Don't want to accidentally send APK with local URL to client

**Solution**: Automatic environment detection based on build profile!

---

## How It Works

### For Development (Local Testing)
```bash
# Start Expo dev server
npx expo start
```
- ✅ Uses `.env` or `.env.local`
- ✅ Points to your local backend: `http://192.168.100.6:8000/api`
- ✅ See changes immediately
- ✅ Fast development cycle

### For Production Builds
```bash
# Build APK for client
eas build --platform android --profile production
```
- ✅ Uses `eas.json` configuration
- ✅ Automatically uses production URL: `https://inventory-application-xjc5.onrender.com/api`
- ✅ No manual .env editing needed
- ✅ Impossible to build with local URL

---

## File Structure

```
your-project/
├── .env                    # Default (local development)
├── .env.local             # Local development (optional)
├── .env.production        # Production reference (not used by EAS)
├── eas.json               # EAS build configuration (THIS IS WHAT MATTERS!)
└── .gitignore             # Keeps .env files private
```

### What Each File Does

#### `.env` (Default for `npx expo start`)
```env
# Local development - Used when running: npx expo start
EXPO_PUBLIC_API_URL=http://192.168.100.6:8000/api
```

#### `.env.local` (Optional override)
```env
# Your personal local setup
EXPO_PUBLIC_API_URL=http://192.168.100.6:8000/api
```

#### `.env.production` (Reference only)
```env
# Production URL - For reference only
# EAS uses eas.json, not this file!
EXPO_PUBLIC_API_URL=https://inventory-application-xjc5.onrender.com/api
```

#### `eas.json` (THE IMPORTANT ONE!)
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://inventory-application-xjc5.onrender.com/api"
      }
    }
  }
}
```

**This is what EAS uses for production builds!**

---

## Your Current Setup (Already Configured! ✅)

Your `eas.json` is already set up correctly:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://inventory-application-xjc5.onrender.com/api"
      },
      "channel": "preview"
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://inventory-application-xjc5.onrender.com/api"
      },
      "channel": "production"
    }
  }
}
```

**You're all set!** 🎉

---

## Usage Guide

### Development Workflow

#### 1. Start Local Backend
```bash
cd backend
npm run dev
# Server runs on http://192.168.100.6:8000
```

#### 2. Start Expo Dev Server
```bash
# In project root
npx expo start
```

#### 3. Test on Device
- Scan QR code with Expo Go
- App connects to local backend
- See changes instantly with hot reload

**Environment Used**: `.env` (local URL)

---

### Production Build Workflow

#### 1. Validate Environment (Optional but Recommended)
```bash
node scripts/validate-build-env.js production
```

This checks:
- ✅ Production profile exists in eas.json
- ✅ Production URL is set correctly
- ✅ No local URLs in production config
- ✅ All .env files are correct

#### 2. Build APK
```bash
eas build --platform android --profile production
```

**What happens:**
1. EAS reads `eas.json`
2. Uses production profile
3. Sets `EXPO_PUBLIC_API_URL` to production URL
4. Builds APK with production URL embedded
5. **Impossible to use local URL!**

#### 3. Download APK
- Wait 15-20 minutes for build
- Download from EAS dashboard
- Install on device
- Test with production backend

**Environment Used**: `eas.json` production profile (production URL)

---

### Preview Build (Testing Production URL Locally)

Sometimes you want to test the production backend before sending to client:

```bash
eas build --platform android --profile preview
```

This builds an APK with:
- ✅ Production URL
- ✅ Internal distribution (not for app stores)
- ✅ Good for testing before final production build

---

## Validation Script Usage

### Before Every Production Build

```bash
# Validate production build
node scripts/validate-build-env.js production

# Output:
# ============================================================
# ℹ️  Validating build environment for profile: production
# ============================================================
# ℹ️  Profile: production
# ℹ️  API URL from eas.json: https://inventory-application-xjc5.onrender.com/api
# 
# Checking .env files...
#   .env: 🏠 LOCAL - http://192.168.100.6:8000/api
#   .env.local: 🏠 LOCAL - http://192.168.100.6:8000/api
#   .env.production: 🌐 REMOTE - https://inventory-application-xjc5.onrender.com/api
# 
# ============================================================
# ✅ Build environment validation passed for profile: production
# ℹ️  API URL: https://inventory-application-xjc5.onrender.com/api
# ============================================================
```

### If Something's Wrong

```bash
# Example: If production profile has local URL
node scripts/validate-build-env.js production

# Output:
# ❌ ERROR: Production/Preview builds cannot use local URLs!
# ❌ ERROR: Found: http://192.168.100.6:8000/api
# ❌ ERROR: Expected: https://inventory-application-xjc5.onrender.com/api
# 
# Update eas.json to use production URL:
#   "EXPO_PUBLIC_API_URL": "https://inventory-application-xjc5.onrender.com/api"
```

---

## Common Scenarios

### Scenario 1: Developing New Feature

```bash
# 1. Start local backend
cd backend && npm run dev

# 2. Start Expo
npx expo start

# 3. Make changes
# 4. See updates instantly
# 5. Uses local URL automatically ✅
```

### Scenario 2: Building for Client

```bash
# 1. Validate (optional but recommended)
node scripts/validate-build-env.js production

# 2. Build
eas build --platform android --profile production

# 3. Wait for build
# 4. Download APK
# 5. Send to client
# 6. Uses production URL automatically ✅
```

### Scenario 3: Testing Production Backend Locally

```bash
# Option A: Temporarily change .env
# Edit .env to use production URL
EXPO_PUBLIC_API_URL=https://inventory-application-xjc5.onrender.com/api

# Then run
npx expo start

# Option B: Build preview APK
eas build --platform android --profile preview
```

### Scenario 4: Switching Between Environments

```bash
# Development (local backend)
npx expo start
# Uses .env (local URL)

# Production build
eas build --platform android --profile production
# Uses eas.json (production URL)

# No manual switching needed! ✅
```

---

## Troubleshooting

### Problem: "App shows 'No network connection' after installing APK"

**Cause**: APK was built with local URL

**Solution**:
```bash
# 1. Check what URL was used
node scripts/validate-build-env.js production

# 2. If wrong, rebuild
eas build --platform android --profile production

# 3. Download new APK
# 4. Uninstall old APK from device
# 5. Install new APK
```

### Problem: "Local development is slow"

**Cause**: Using production URL in .env

**Solution**:
```bash
# Check .env file
cat .env

# Should be:
EXPO_PUBLIC_API_URL=http://192.168.100.6:8000/api

# NOT:
EXPO_PUBLIC_API_URL=https://inventory-application-xjc5.onrender.com/api
```

### Problem: "How do I know which URL my app is using?"

**Solution**: Add environment indicator in app

```typescript
// In app/settings.tsx (Admin only)
<Text>API URL: {process.env.EXPO_PUBLIC_API_URL}</Text>
```

Or check build logs:
```bash
eas build:view <build-id>
```

---

## Best Practices

### ✅ DO

1. **Always validate before production builds**
   ```bash
   node scripts/validate-build-env.js production
   ```

2. **Keep .env files in .gitignore**
   - Prevents committing local URLs
   - Keeps credentials private

3. **Use descriptive build profiles**
   - `development` - Local testing
   - `preview` - Test production URL
   - `production` - Client builds

4. **Document your API URLs**
   - Keep README updated
   - Note which URL is for what

5. **Test APK before sending to client**
   - Install on your device first
   - Verify scanner works
   - Check all features

### ❌ DON'T

1. **Don't manually edit .env for production builds**
   - EAS uses eas.json, not .env
   - Editing .env won't affect builds

2. **Don't commit .env files**
   - Already in .gitignore
   - Keep it that way

3. **Don't use production URL for local development**
   - Slow (network latency)
   - Can't see backend logs
   - Harder to debug

4. **Don't skip validation**
   - Takes 2 seconds
   - Prevents costly mistakes

5. **Don't build without testing locally first**
   - Builds take 15-20 minutes
   - Test locally first to save time

---

## Quick Reference

### Commands Cheat Sheet

```bash
# Local Development
npx expo start                                    # Uses .env (local URL)

# Validate Build
node scripts/validate-build-env.js production     # Check before building

# Build APK
eas build --platform android --profile production # Uses eas.json (production URL)

# Preview Build (test production URL)
eas build --platform android --profile preview    # Uses eas.json (production URL)

# Check Build Status
eas build:list                                    # List all builds

# View Build Details
eas build:view <build-id>                         # See build configuration
```

### File Priority

When running `npx expo start`:
1. `.env.local` (if exists)
2. `.env` (fallback)

When running `eas build`:
1. `eas.json` profile env vars (HIGHEST PRIORITY)
2. `.env.production` (NOT USED by EAS)
3. `.env` (NOT USED by EAS)

**Remember**: EAS builds ONLY use `eas.json`!

---

## Summary

### Problem Solved ✅

1. **Development**: Uses local URL automatically
2. **Production**: Uses production URL automatically
3. **No manual switching**: Build profile determines URL
4. **Validation**: Script prevents mistakes
5. **Foolproof**: Can't accidentally build with wrong URL

### Your Workflow

```bash
# Develop
npx expo start                                    # Local URL

# Build for client
node scripts/validate-build-env.js production     # Validate
eas build --platform android --profile production # Build with production URL

# Done! ✅
```

---

## Next Steps

1. ✅ **Environment setup is complete** - No action needed
2. ✅ **Validation script is ready** - Use before builds
3. 🔄 **Address server performance** - See SERVER_PERFORMANCE_SOLUTIONS.md
4. 🔄 **Implement other features** - See requirements.md

---

*Last Updated: February 14, 2026*
*Status: Ready to Use* ✅
