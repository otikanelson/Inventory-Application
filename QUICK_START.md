# 🚀 Quick Start Guide

## Development vs Production - No More Confusion!

---

## 🛠️ Local Development

```bash
# Start development server (uses local backend)
npm start

# Or with cache clearing
npm run start:clear
```

**What happens:**
- ✅ Uses your local backend: `http://192.168.152.95:8000/api`
- ✅ See changes immediately
- ✅ Fast iteration
- ✅ No risk of affecting production

---

## 📦 Building for Client

```bash
# Check environment configuration first
npm run check-env

# Build production APK (uses deployed backend)
npm run build:production
```

**What happens:**
- ✅ Uses production backend: `https://inventory-application-xjc5.onrender.com/api`
- ✅ IMPOSSIBLE to use local URL
- ✅ Safe to send to client
- ✅ Works on any network

---

## 🧪 Testing Builds

```bash
# Build preview APK for testing
npm run build:preview
```

**What happens:**
- ✅ Uses production backend
- ✅ Good for testing before final build
- ✅ Faster than production build

---

## ✅ Pre-Build Checklist

Before building for client:

```bash
# 1. Check environment configuration
npm run check-env

# 2. Verify backend is accessible
curl https://inventory-application-xjc5.onrender.com/api/health

# 3. Build production APK
npm run build:production
```

---

## 🔧 Troubleshooting

### Scanner says "No network connection" in development
```bash
# 1. Check backend is running
cd backend
npm start

# 2. Verify IP address in .env.local
# Should match your machine's IP
```

### Need to change local IP address
```bash
# Edit .env.local
EXPO_PUBLIC_API_URL=http://YOUR_NEW_IP:8000/api

# Restart Expo
npm run start:clear
```

---

## 📋 Command Reference

| Command | Purpose | Backend Used |
|---------|---------|--------------|
| `npm start` | Local development | Local (192.168.x.x) |
| `npm run start:clear` | Dev with cache clear | Local (192.168.x.x) |
| `npm run check-env` | Verify configuration | N/A |
| `npm run build:preview` | Test build | Production (Render) |
| `npm run build:production` | Client build | Production (Render) |

---

## 🎯 Key Points

1. **Development**: Always uses local backend automatically
2. **Production Builds**: Always uses deployed backend automatically
3. **No Manual Switching**: Environment is determined by command
4. **Safe by Design**: Can't accidentally deploy with wrong URL

---

## 📖 More Information

- Full details: `ENVIRONMENT_SETUP.md`
- Build guide: `BUILD_AND_DEPLOY.md`
- Testing: `TESTING_GUIDE.md`

---

**Last Updated:** February 13, 2026
