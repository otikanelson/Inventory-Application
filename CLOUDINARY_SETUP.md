# Cloudinary Setup Guide

## Why Your Images Are Disappearing

Currently, your images are being stored locally on your server. This means:
- ❌ Images disappear when the server restarts
- ❌ Images are lost if you deploy to a new server
- ❌ Images take up server storage space
- ❌ No image optimization or CDN benefits

## Solution: Set Up Cloudinary (Free)

Cloudinary provides free cloud image storage and optimization.

### Step 1: Create Cloudinary Account
1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Sign up for a free account
3. Verify your email

### Step 2: Get Your Credentials
1. Go to your [Cloudinary Console](https://cloudinary.com/console)
2. Copy your credentials from the dashboard:
   - **Cloud Name** (e.g., `dxyz123abc`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### Step 3: Update Your .env File
Replace the placeholder values in `backend/.env`:

```env
# Replace these with your actual Cloudinary credentials
CLOUDINARY_CLOUD_NAME=dxyz123abc
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### Step 4: Restart Your Server
```bash
cd backend
npm start
```

### Step 5: Test Image Upload
1. Add a new product with an image
2. Check the server logs - you should see "Cloudinary upload successful"
3. Your images will now be permanently stored in the cloud!

## Benefits After Setup
- ✅ Images never disappear
- ✅ Automatic image optimization
- ✅ Fast CDN delivery worldwide
- ✅ No server storage used
- ✅ Professional image URLs

## Current Status
- **Storage**: Local (temporary)
- **Cloudinary**: Not configured
- **Images**: Will disappear on server restart

## After Cloudinary Setup
- **Storage**: Cloudinary (permanent)
- **Cloudinary**: Configured ✅
- **Images**: Permanently stored in cloud ✅

---

**Need Help?** 
- Cloudinary Documentation: https://cloudinary.com/documentation
- Free tier includes: 25GB storage, 25GB bandwidth/month