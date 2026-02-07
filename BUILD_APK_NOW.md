# Build Your APK Right Now - Quick Guide

## Your Configuration is Ready! ✅

Your `eas.json` is already configured with:
- **Render Backend**: `https://inventory-application-xjc5.onrender.com/api`
- **Build Type**: APK (ready for direct installation)
- **Profiles**: Preview (testing) and Production (release)

---

## Before You Build - 5 Minute Checklist

### 1. Verify Your Render Backend is Working

Open this URL in your browser:
```
https://inventory-application-xjc5.onrender.com
```

You should see:
```json
{
  "message": "InventiEase API is running...",
  "status": "healthy"
}
```

✅ If you see this, your backend is working!
❌ If you get an error, your backend needs to be redeployed

### 2. Test Your API Endpoints

```
https://inventory-application-xjc5.onrender.com/api/products
```

Should return products data (or empty array if no products yet).

### 3. Check MongoDB Connection

Make sure your Render backend has these environment variables set:
- `MONGO_URI` - Your MongoDB Atlas connection string
- `PORT` - Set to 8000
- `NODE_ENV` - Set to production
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary name
- `CLOUDINARY_API_KEY` - Your Cloudinary key
- `CLOUDINARY_API_SECRET` - Your Cloudinary secret

---

## Build Commands (Choose One)

### Option 1: Preview Build (Recommended for Testing)

```bash
eas build --platform android --profile preview
```

**Use this when:**
- Testing the app before final release
- Want to verify backend connection works
- Need to test on real devices

### Option 2: Production Build (For Final Release)

```bash
eas build --platform android --profile production
```

**Use this when:**
- Preview build tested and working
- Ready for distribution
- Preparing for Play Store

---

## Step-by-Step Build Process

### Step 1: Install EAS CLI (if not installed)

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

Enter your Expo credentials.

### Step 3: Start the Build

```bash
eas build --platform android --profile preview
```

### Step 4: Wait for Build

- Build takes 10-20 minutes
- You'll see progress in terminal
- Or check: https://expo.dev

### Step 5: Download APK

When build completes:
1. You'll get a download link
2. Click the link or scan QR code
3. Download APK to your phone

### Step 6: Install and Test

1. Enable "Install from Unknown Sources" on your phone
2. Install the APK
3. Open the app
4. **Test on mobile data** (not WiFi) to verify backend works

---

## What Will Happen

### During Build:
1. ✅ EAS uploads your code
2. ✅ Installs dependencies
3. ✅ Compiles TypeScript
4. ✅ Bundles JavaScript
5. ✅ Creates APK with Render backend URL
6. ✅ Signs the APK
7. ✅ Provides download link

### In the APK:
- ✅ Backend URL: `https://inventory-application-xjc5.onrender.com/api`
- ✅ Works on any network (WiFi or mobile data)
- ✅ Works anywhere in the world
- ✅ No need for local backend

---

## Testing Your APK

After installing, test these:

### Critical Tests (Must Work):
- [ ] App opens without crashing
- [ ] Dashboard loads
- [ ] Products load from Render backend
- [ ] Can add new products
- [ ] Images upload to Cloudinary
- [ ] Scanner works

### Network Tests (Very Important):
- [ ] Works on WiFi
- [ ] **Works on mobile data** (turn off WiFi and test)
- [ ] Works on different WiFi networks
- [ ] Shows error message when offline

### Feature Tests:
- [ ] Add product with image
- [ ] Scan barcode
- [ ] View product details
- [ ] Update inventory
- [ ] FEFO sorting works
- [ ] Alerts display

---

## Common Issues and Quick Fixes

### Issue: "Network Error" in APK

**Cause**: Render backend is sleeping (free tier)

**Fix**: 
1. Open `https://inventory-application-xjc5.onrender.com` in browser
2. Wait 30 seconds for backend to wake up
3. Try app again

### Issue: "Cannot connect to server"

**Cause**: Backend URL wrong or backend down

**Fix**:
1. Check Render dashboard - is service running?
2. Test URL in browser
3. Check Render logs for errors

### Issue: "MongoDB connection failed"

**Cause**: MongoDB Atlas not accessible

**Fix**:
1. Go to MongoDB Atlas
2. Network Access → Add `0.0.0.0/0` to IP whitelist
3. Restart Render service

### Issue: Build fails with errors

**Cause**: TypeScript errors or missing dependencies

**Fix**:
1. Run `npm install` locally
2. Fix any TypeScript errors
3. Try build again

---

## Pro Tips

### Keep Render Backend Awake

Free tier sleeps after 15 minutes of inactivity. To keep it awake:

1. Use a service like UptimeRobot (free)
2. Ping your backend every 10 minutes
3. Or upgrade to paid Render plan ($7/month)

### Test Before Distributing

1. Build preview APK first
2. Test thoroughly for 1-2 days
3. Fix any bugs
4. Then build production APK

### Version Your Builds

Update version in `app.json` before each build:
```json
{
  "expo": {
    "version": "1.0.1"  // Increment this
  }
}
```

---

## Your Build Command (Copy & Paste)

```bash
# For testing
eas build --platform android --profile preview

# For production
eas build --platform android --profile production
```

---

## Expected Results

### If Everything Works:

✅ Build completes in 10-20 minutes
✅ Download link provided
✅ APK installs on phone
✅ App connects to Render backend
✅ All features work on mobile data
✅ Images upload successfully

### If Something Fails:

❌ Check Render backend is running
❌ Verify MongoDB Atlas IP whitelist
❌ Check Cloudinary credentials
❌ Review build logs for errors
❌ Test backend URL in browser

---

## Quick Verification Script

Run this to verify everything before building:

```bash
# Test backend health
curl https://inventory-application-xjc5.onrender.com

# Test products endpoint
curl https://inventory-application-xjc5.onrender.com/api/products

# Test analytics endpoint
curl https://inventory-application-xjc5.onrender.com/api/analytics/dashboard
```

All should return JSON responses (not 404 or errors).

---

## Ready to Build?

If all checks pass:

```bash
eas build --platform android --profile preview
```

Then wait for the magic to happen! ✨

---

## After Successful Build

1. Download APK
2. Install on your phone
3. **Turn off WiFi** and test on mobile data
4. If it works → Build production APK
5. If it doesn't → Check troubleshooting section

---

## Need Help?

- Check `EAS_BUILD_WALKTHROUGH.md` for detailed guide
- Review Render logs: https://dashboard.render.com
- Check EAS build logs: https://expo.dev
- Test backend URL in browser first

---

## Remember

Your APK will use:
- **Backend**: `https://inventory-application-xjc5.onrender.com/api`
- **NOT**: `http://192.168.1.5:8000/api` (local development)

This means it will work **anywhere**, not just on your home WiFi! 🌍

Good luck! 🚀
