# EAS Build Walkthrough - Production APK with Render Backend

## Why Your Previous APK Didn't Work

### The Problem
Your old APK was configured to use:
- `http://192.168.1.5:8000/api` (local development IP)
- This only works when your phone and computer are on the same WiFi
- Once you leave that network, the app can't reach the backend

### The Solution
Configure the APK to use your Render backend URL:
- `https://your-app.onrender.com/api` (accessible from anywhere)
- Works on any network, anywhere in the world

---

## Prerequisites Checklist

Before building, ensure you have:

- [ ] Expo account (sign up at https://expo.dev)
- [ ] EAS CLI installed globally
- [ ] Backend deployed on Render and working
- [ ] Render backend URL (e.g., `https://inventory-backend-xyz.onrender.com`)
- [ ] MongoDB Atlas configured and accessible from Render

---

## Step 1: Verify Your Render Backend

### 1.1 Get Your Render Backend URL

1. Go to https://dashboard.render.com
2. Find your backend service
3. Copy the URL (looks like: `https://inventory-backend-xyz.onrender.com`)

### 1.2 Test Your Render Backend

Open your browser or use curl:
```bash
curl https://your-backend-url.onrender.com
```

Should return:
```json
{
  "message": "InventiEase API is running...",
  "status": "healthy",
  ...
}
```

### 1.3 Test API Endpoints

```bash
# Test products endpoint
curl https://your-backend-url.onrender.com/api/products

# Test analytics endpoint
curl https://your-backend-url.onrender.com/api/analytics/dashboard
```

If these return 404 or errors, your backend isn't fully deployed yet.

---

## Step 2: Configure Environment Variables for Production

### 2.1 Create Production Environment File

Create a new file: `.env.production`

```env
# Production API URL - Your Render Backend
EXPO_PUBLIC_API_URL=https://your-backend-url.onrender.com/api

# EAS Build Configuration
EAS_SKIP_AUTO_FINGERPRINT=1
```

**IMPORTANT**: Replace `your-backend-url.onrender.com` with your actual Render URL!

### 2.2 Update Your Current .env for Development

Keep your `.env` file for local development:

```env
# Local development API URL
EXPO_PUBLIC_API_URL=http://192.168.1.5:8000/api

# EAS Build Configuration
EAS_SKIP_AUTO_FINGERPRINT=1
```

### 2.3 Add .env.production to .gitignore

Make sure `.env.production` is in your `.gitignore`:

```
.env
.env.production
.env.local
```

---

## Step 3: Configure EAS Build

### 3.1 Check Your eas.json

Open `eas.json` and verify/update it:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_URL": "http://192.168.1.5:8000/api"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend-url.onrender.com/api"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend-url.onrender.com/api"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

**IMPORTANT**: Replace `your-backend-url.onrender.com` with your actual Render URL in both `preview` and `production` profiles!

### 3.2 Verify app.json Configuration

Open `app.json` and check:

```json
{
  "expo": {
    "name": "InventiEase",
    "slug": "inventiease",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "inventiease",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "package": "com.yourname.inventiease",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#ffffff"
      },
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-camera",
        {
          "cameraPermission": "Allow InventiEase to access your camera for scanning barcodes"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Allow InventiEase to access your photos for product images"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

**IMPORTANT**: Change `com.yourname.inventiease` to your actual package name!

---

## Step 4: Install and Configure EAS CLI

### 4.1 Install EAS CLI Globally

```bash
npm install -g eas-cli
```

### 4.2 Login to Expo

```bash
eas login
```

Enter your Expo account credentials.

### 4.3 Configure EAS for Your Project

```bash
eas build:configure
```

This will:
- Link your project to your Expo account
- Create/update `eas.json`
- Set up build profiles

---

## Step 5: Build the APK

### 5.1 Build for Preview (Testing)

First, build a preview APK to test:

```bash
eas build --platform android --profile preview
```

This will:
1. Upload your code to EAS servers
2. Build the APK with your Render backend URL
3. Take 10-20 minutes
4. Give you a download link when done

### 5.2 Monitor the Build

You can monitor progress at:
- https://expo.dev/accounts/[your-username]/projects/inventiease/builds

Or in the terminal output.

### 5.3 Download and Test the APK

1. Once build completes, you'll get a download link
2. Download the APK to your phone
3. Install it (you may need to enable "Install from Unknown Sources")
4. Test the app:
   - [ ] App opens successfully
   - [ ] Products load from Render backend
   - [ ] Can add new products
   - [ ] Scanner works
   - [ ] Images upload successfully
   - [ ] All features work on mobile data (not just WiFi)

### 5.4 Build for Production (Final Release)

Once preview works, build production APK:

```bash
eas build --platform android --profile production
```

---

## Step 6: Verify Backend Configuration on Render

### 6.1 Check Render Environment Variables

Go to your Render dashboard → Your service → Environment

Ensure these are set:

```
PORT=8000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 6.2 Check Render CORS Configuration

Your backend should allow requests from anywhere in production.

In `backend/src/server.js`, verify CORS is configured:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow all origins in production
    : true,
  credentials: true
}));
```

### 6.3 Verify MongoDB Atlas IP Whitelist

1. Go to MongoDB Atlas
2. Network Access → IP Access List
3. Ensure `0.0.0.0/0` is added (allows access from anywhere)
4. Or add Render's IP addresses

---

## Step 7: Common Issues and Solutions

### Issue 1: "Network Error" in APK

**Cause**: Backend URL is wrong or backend is down

**Solution**:
1. Verify Render backend is running
2. Check the URL in `eas.json` matches your Render URL exactly
3. Rebuild the APK with correct URL

### Issue 2: "Cannot connect to server"

**Cause**: HTTPS/HTTP mismatch

**Solution**:
- Render provides HTTPS by default
- Make sure your URL starts with `https://` not `http://`
- Update `eas.json` and rebuild

### Issue 3: "MongoDB connection failed"

**Cause**: MongoDB Atlas not accessible from Render

**Solution**:
1. Check MongoDB Atlas IP whitelist
2. Verify MONGO_URI in Render environment variables
3. Check Render logs for connection errors

### Issue 4: "Image upload fails"

**Cause**: Cloudinary not configured

**Solution**:
1. Verify Cloudinary credentials in Render environment
2. Check backend logs for upload errors
3. Test upload endpoint directly

### Issue 5: APK works on WiFi but not mobile data

**Cause**: Using local IP instead of Render URL

**Solution**:
1. Check `eas.json` has Render URL, not local IP
2. Rebuild APK
3. Test on mobile data

---

## Step 8: Testing Checklist

After installing the APK, test these features:

### Basic Functionality
- [ ] App opens without crashing
- [ ] Dashboard loads
- [ ] Products display correctly
- [ ] Can navigate between tabs

### Network Features (Test on Mobile Data!)
- [ ] Products load from backend
- [ ] Can add new products
- [ ] Images upload successfully
- [ ] Scanner works
- [ ] Product details load
- [ ] Inventory updates sync

### Offline Behavior
- [ ] App doesn't crash when offline
- [ ] Shows appropriate error messages
- [ ] Recovers when connection restored

---

## Step 9: Distribution

### Option 1: Direct APK Distribution

1. Download APK from EAS build
2. Share via:
   - Google Drive
   - Dropbox
   - Email
   - USB transfer

Users need to:
- Enable "Install from Unknown Sources"
- Download and install APK

### Option 2: Internal Testing (Google Play)

1. Create Google Play Developer account ($25 one-time fee)
2. Create app in Play Console
3. Upload APK to Internal Testing track
4. Share testing link with users

### Option 3: Public Release (Google Play)

1. Complete Play Console setup
2. Prepare store listing (screenshots, description)
3. Upload production APK
4. Submit for review
5. Publish to Play Store

---

## Quick Reference Commands

```bash
# Login to EAS
eas login

# Configure EAS
eas build:configure

# Build preview APK (for testing)
eas build --platform android --profile preview

# Build production APK (for release)
eas build --platform android --profile production

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

---

## Environment Variables Summary

### Development (.env)
```env
EXPO_PUBLIC_API_URL=http://192.168.1.5:8000/api
```

### Production (eas.json)
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-backend.onrender.com/api"
      }
    }
  }
}
```

### Render Backend
```env
PORT=8000
MONGO_URI=mongodb+srv://...
NODE_ENV=production
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

---

## Troubleshooting Build Errors

### Error: "Build failed"

Check build logs:
```bash
eas build:view [build-id]
```

Common causes:
- Missing dependencies
- TypeScript errors
- Invalid configuration

### Error: "Invalid credentials"

```bash
eas logout
eas login
```

### Error: "Project not configured"

```bash
eas build:configure
```

---

## Final Checklist Before Building

- [ ] Render backend is deployed and working
- [ ] Tested Render backend URL in browser
- [ ] Updated `eas.json` with Render URL
- [ ] Verified `app.json` package name
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Cloudinary credentials set in Render
- [ ] EAS CLI installed and logged in
- [ ] All TypeScript errors fixed
- [ ] Tested app locally first

---

## Expected Timeline

- **Build Time**: 10-20 minutes per build
- **Download**: 2-5 minutes (depending on connection)
- **Installation**: 1-2 minutes
- **Testing**: 15-30 minutes

**Total**: ~30-60 minutes from start to tested APK

---

## Cost

- **EAS Build**: Free tier includes limited builds per month
- **Render**: Free tier available (may sleep after inactivity)
- **MongoDB Atlas**: Free tier (512MB storage)
- **Cloudinary**: Free tier (25GB storage, 25GB bandwidth)

**Total Cost**: $0 for testing and small-scale use

---

## Next Steps After Successful Build

1. **Test thoroughly** on multiple devices
2. **Gather feedback** from test users
3. **Fix any bugs** found
4. **Rebuild** with fixes
5. **Prepare for Play Store** (if desired)
6. **Set up analytics** (optional)
7. **Plan updates** and new features

---

## Support Resources

- **EAS Documentation**: https://docs.expo.dev/build/introduction/
- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Expo Forums**: https://forums.expo.dev/

---

## Pro Tips

1. **Always test preview builds first** before production
2. **Keep your Render backend awake** (free tier sleeps after 15 min inactivity)
3. **Monitor Render logs** during testing
4. **Use semantic versioning** (1.0.0, 1.0.1, etc.)
5. **Document changes** in each build
6. **Keep old APKs** for rollback if needed
7. **Test on different Android versions** if possible

---

## Success Criteria

Your APK is ready for distribution when:

✅ Installs without errors
✅ Connects to Render backend on any network
✅ All features work as expected
✅ No crashes during normal use
✅ Images upload successfully
✅ Data syncs correctly
✅ Works on mobile data and WiFi
✅ Handles offline gracefully

---

## Remember

- **Development**: Use local backend (192.168.1.5:8000)
- **Production APK**: Use Render backend (https://your-app.onrender.com)
- **Always rebuild** after changing backend URL
- **Test on mobile data** to ensure it works everywhere

Good luck with your build! 🚀
