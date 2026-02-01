# Render Deployment Guide for InventiEase Backend

## Current Issue
Render is trying to deploy the frontend instead of the backend, causing the error:
```
Error: Cannot find module '/opt/render/project/src/backend/expo-router/entry'
```

## Solution Options

### Option 1: Use render.yaml (Recommended)
1. The `render.yaml` file has been created in your project root
2. Commit and push to your repository
3. Render will automatically use this configuration

### Option 2: Manual Configuration in Render Dashboard

#### Step 1: Create New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository

#### Step 2: Configure Build Settings
```
Name: inventiease-backend
Environment: Node
Region: Oregon (or your preferred region)
Branch: main (or your main branch)
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

#### Step 3: Set Environment Variables
Add these in the Render dashboard:
```
NODE_ENV=production
MONGO_URI=mongodb+srv://otikanelson29:RADson29@inventicluster.evstzpk.mongodb.net/?appName=InventiCluster
CLOUDINARY_CLOUD_NAME=dqwa8w9wb
CLOUDINARY_API_KEY=549813351582393
CLOUDINARY_API_SECRET=fJ7vajUs2OXUuguNpX3U69F2f34
```

#### Step 4: Advanced Settings
```
Auto-Deploy: Yes
Health Check Path: /
```

## Important Notes

### 🔒 Security
- Never commit `.env` files to your repository
- Set environment variables in Render dashboard for security
- Use Render's environment variable sync feature

### 📁 Project Structure
Your project structure should be:
```
your-repo/
├── backend/           # Backend API (deploy this)
│   ├── src/
│   ├── package.json
│   └── .env (don't commit)
├── app/              # Frontend (don't deploy to Render)
├── components/
└── package.json      # Frontend package.json
```

### 🚀 Deployment Process
1. **Backend**: Deploy to Render (web service)
2. **Frontend**: Deploy to Expo/Vercel/Netlify (separate deployment)

## Troubleshooting

### If deployment still fails:
1. Check the build logs in Render dashboard
2. Ensure `backend/package.json` exists
3. Verify environment variables are set
4. Check that `backend/src/server.js` exists

### Common Issues:
- **Wrong root directory**: Must be `backend`
- **Missing dependencies**: Run `npm install` in backend folder
- **Port configuration**: Render provides PORT automatically
- **Environment variables**: Must be set in Render dashboard

## Testing Deployment
After successful deployment:
1. Visit your Render URL
2. Should see: `{"message": "InventiEase API is running...", "status": "healthy"}`
3. Test API endpoints: `https://your-app.onrender.com/api/products`

## Frontend Configuration
Update your frontend `.env` to use the Render URL:
```
EXPO_PUBLIC_API_URL=https://your-app-name.onrender.com
```

---

**Need Help?**
- Render Documentation: https://render.com/docs
- Check build logs in Render dashboard for specific errors