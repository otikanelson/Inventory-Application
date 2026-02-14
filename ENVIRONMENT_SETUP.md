# Environment Configuration Guide

## Overview

This project uses multiple environment files to separate local development from production builds. This prevents accidentally deploying with the wrong API URL.

---

## Environment Files

### 1. `.env` (Default/Fallback)
- Used when no specific environment is set
- Contains local development URL by default
- Safe for development

### 2. `.env.local` (Local Development)
- Used during local development with `npx expo start`
- Points to your local backend: `http://192.168.152.95:8000/api`
- **NOT committed to git** (in `.gitignore`)

### 3. `.env.production` (Production Builds)
- Used automatically by EAS builds
- Points to deployed backend: `https://inventory-application-xjc5.onrender.com/api`
- **NOT committed to git** (in `.gitignore`)

---

## How It Works

### For Local Development
```bash
# Start Expo with local backend
npx expo start
```
- Uses `.env.local` (or falls back to `.env`)
- Connects to `http://192.168.152.95:8000/api`
- See changes immediately

### For Production Builds
```bash
# Build APK for client
eas build --platform android --profile production
```
- EAS automatically uses environment variables from `eas.json`
- Connects to `https://inventory-application-xjc5.onrender.com/api`
- **IMPOSSIBLE to accidentally use local URL**

---

## EAS Build Configuration

The `eas.json` file has environment-specific configurations:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://inventory-application-xjc5.onrender.com/api"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://inventory-application-xjc5.onrender.com/api"
      }
    }
  }
}
```

This means:
- ✅ Production builds ALWAYS use the deployed backend
- ✅ Preview builds ALWAYS use the deployed backend
- ✅ Local development uses your local backend
- ✅ No manual switching needed

---

## Quick Reference

| Command | Environment | API URL |
|---------|-------------|---------|
| `npx expo start` | Local | `http://192.168.152.95:8000/api` |
| `eas build --profile preview` | Preview | `https://inventory-application-xjc5.onrender.com/api` |
| `eas build --profile production` | Production | `https://inventory-application-xjc5.onrender.com/api` |

---

## Updating API URLs

### Change Local Development URL
Edit `.env.local`:
```bash
EXPO_PUBLIC_API_URL=http://YOUR_NEW_IP:8000/api
```

### Change Production URL
Edit `eas.json` (in the `production` and `preview` profiles):
```json
"env": {
  "EXPO_PUBLIC_API_URL": "https://your-new-backend.com/api"
}
```

---

## Troubleshooting

### Problem: "No network connection" in development
**Solution:** 
1. Check your local backend is running: `cd backend && npm start`
2. Verify your IP address hasn't changed
3. Update `.env.local` with correct IP

### Problem: "No network connection" in production APK
**Solution:**
1. Verify backend is deployed: `curl https://inventory-application-xjc5.onrender.com/api/health`
2. Check `eas.json` has correct production URL
3. Rebuild APK: `eas build --platform android --profile production`

### Problem: Changes not reflecting in app
**Solution:**
1. Stop Expo: `Ctrl+C`
2. Clear cache: `npx expo start --clear`
3. Restart app on device

---

## Best Practices

### ✅ DO:
- Use `npx expo start` for local development
- Use `eas build --profile production` for client builds
- Keep `.env.local` for your personal development settings
- Test production builds before sending to client

### ❌ DON'T:
- Don't commit `.env.local` or `.env.production` to git
- Don't manually edit `.env` for production URLs
- Don't use `expo build` (deprecated, use `eas build`)
- Don't send preview builds to clients (use production profile)

---

## Verification Checklist

Before sending APK to client:

- [ ] Built with production profile: `eas build --platform android --profile production`
- [ ] Verified backend is accessible: `curl https://inventory-application-xjc5.onrender.com/api/health`
- [ ] Tested APK on physical device
- [ ] Scanner works (tests network connection)
- [ ] Products load correctly
- [ ] All features functional

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API endpoint | `https://inventory-application-xjc5.onrender.com/api` |
| `EAS_SKIP_AUTO_FINGERPRINT` | Skip fingerprint generation | `1` |

---

## Additional Notes

### Why This Setup?

1. **Safety**: Impossible to accidentally deploy with local URL
2. **Convenience**: No manual switching between environments
3. **Clarity**: Clear separation between dev and prod
4. **Standard**: Follows Expo/EAS best practices

### How EAS Handles Environments

When you run `eas build`, it:
1. Ignores your local `.env` files
2. Uses environment variables from `eas.json`
3. Injects them during the build process
4. Creates APK with production configuration

This means your local `.env` files have **ZERO impact** on production builds!

---

## Quick Start Commands

```bash
# Local Development
npx expo start

# Build for Testing (Preview)
eas build --platform android --profile preview

# Build for Client (Production)
eas build --platform android --profile production

# Check Backend Status
curl https://inventory-application-xjc5.onrender.com/api/health
```

---

**Last Updated:** February 13, 2026  
**Status:** ✅ Production Ready
