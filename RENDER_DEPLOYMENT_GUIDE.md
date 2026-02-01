# Render.com Deployment Guide - Fix Image Disappearing Issue

## 🚨 Why Your Images Disappear on Render

**Root Cause:** Render.com uses **ephemeral storage** - any files saved locally get deleted on every deployment or server restart.

**Current Problem:** Your app saves images to `/uploads` folder locally, which gets wiped clean every time Render restarts your service.

**Solution:** Use Cloudinary for persistent cloud storage.

## 🛠️ Complete Render Configuration

### Step 1: Update Render Service Settings

Go to your Render dashboard and update these settings:

#### **Build & Deploy:**
```
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

#### **Environment Variables:**
Add these in your Render dashboard (Environment tab):

```
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://otikanelson29:RADson29@inventicluster.evstzpk.mongodb.net/?appName=InventiCluster
CLOUDINARY_CLOUD_NAME=dqwa8w9wb
CLOUDINARY_API_KEY=549813351582393
CLOUDINARY_API_SECRET=fJ7vajUs2OXUuguNpX3U69F2f34
```

### Step 2: Deploy Your Updated Code

1. Commit and push your changes:
```bash
git add .
git commit -m "Fix: Configure Cloudinary for Render deployment"
git push origin main
```

2. Render will automatically redeploy

### Step 3: Verify Deployment

1. Check your service URL: `https://inventory-application-xjc5.onrender.com`
2. Look for these in the logs:
   - ✅ `Cloudinary Status: ✅ Configured`
   - ✅ `Storage: Cloudinary (Production Ready)`

### Step 4: Test Image Upload

1. Add a new product with an image
2. Check Render logs for: `Cloudinary upload successful`
3. Restart your service - images should persist!

## 🔧 What We Fixed

### Before (Broken):
```
Image Upload → Local Storage (/uploads) → Render Restart → Images Lost ❌
```

### After (Fixed):
```
Image Upload → Cloudinary Cloud Storage → Always Available ✅
```

## 📊 Render vs Local Storage

| Feature | Local Storage (Render) | Cloudinary |
|---------|----------------------|------------|
| **Persistence** | ❌ Lost on restart | ✅ Permanent |
| **Deployment** | ❌ Lost on deploy | ✅ Survives deploys |
| **Scaling** | ❌ Not shared across instances | ✅ Shared globally |
| **Performance** | 🐌 Server dependent | ⚡ Global CDN |
| **Cost** | 💰 Uses server resources | 🆓 25GB free tier |

## 🚀 Production Checklist

- [ ] ✅ Cloudinary credentials added to Render environment variables
- [ ] ✅ NODE_ENV set to "production" 
- [ ] ✅ Build command: `npm install`
- [ ] ✅ Start command: `npm start`
- [ ] ✅ Root directory: `backend`
- [ ] ✅ Code deployed and service restarted
- [ ] ✅ Test image upload works
- [ ] ✅ Images persist after service restart

## 🔍 Troubleshooting

### Issue: Images still disappearing
**Check:** Render logs for "Cloudinary upload successful"
**Fix:** Verify environment variables are set correctly

### Issue: Upload fails with 500 error
**Check:** Cloudinary credentials in Render dashboard
**Fix:** Copy exact values from your Cloudinary console

### Issue: Service won't start
**Check:** Build logs for errors
**Fix:** Ensure all dependencies are in package.json

## 📱 Frontend Configuration

Update your frontend API URL to point to Render:

```javascript
// In your React Native app
const API_URL = 'https://inventory-application-xjc5.onrender.com';
```

## 🎯 Expected Results

After following this guide:
- ✅ Images upload to Cloudinary (permanent storage)
- ✅ Images survive service restarts and deployments  
- ✅ Fast image loading via Cloudinary CDN
- ✅ No more disappearing images!

---

**Need Help?** Check Render logs and Cloudinary dashboard for detailed error messages.