# 🔧 Install MongoDB Locally - Step by Step

## Why Local MongoDB?

Your network is blocking MongoDB Atlas. A local MongoDB will:
- ✅ Work immediately (no network issues)
- ✅ Faster development
- ✅ No internet required
- ✅ Free and easy

## Installation (5 minutes)

### Step 1: Download MongoDB

1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - **Version**: 8.0.4 (current)
   - **Platform**: Windows
   - **Package**: MSI
3. Click **Download**

### Step 2: Install MongoDB

1. Run the downloaded `.msi` file
2. Choose **Complete** installation
3. **IMPORTANT**: Check "Install MongoDB as a Service"
4. **IMPORTANT**: Check "Install MongoDB Compass" (GUI tool)
5. Click **Next** → **Install**
6. Wait for installation to complete
7. Click **Finish**

### Step 3: Verify Installation

Open a new Command Prompt and run:
```cmd
mongod --version
```

Should show: `db version v8.0.4` or similar

### Step 4: Update Backend Configuration

Open `backend/.env` and change the MONGO_URI line to:
```
MONGO_URI=mongodb://localhost:27017/inventiease
```

Your complete `backend/.env` should look like:
```
PORT=8000
MONGO_URI=mongodb://localhost:27017/inventiease
NODE_ENV=development

CLOUDINARY_CLOUD_NAME=dqwa8w9wb
CLOUDINARY_API_KEY=549813351582393
CLOUDINARY_API_SECRET=fJ7vajUs2OXUuguNpX3U69F2f34
```

### Step 5: Restart Backend Server

1. Stop the current backend server (Ctrl+C in the terminal)
2. Start it again:
```cmd
cd backend
node src/server.js
```

You should see:
```
✅ MongoDB Connected: localhost
Server running on port 8000
```

### Step 6: Seed the Database

```cmd
cd backend
node scripts/seed-sample-data.js
```

Should create 6 products and 100+ sales records.

### Step 7: Test It Works

```cmd
curl http://localhost:8000/api/products
```

Should return JSON array of products.

## Alternative: Quick Install with Chocolatey

If you have Chocolatey package manager:
```cmd
choco install mongodb
```

Then follow steps 4-7 above.

## Troubleshooting

### "mongod not found" after installation
- Close and reopen Command Prompt
- Or add to PATH: `C:\Program Files\MongoDB\Server\8.0\bin`

### "MongoDB service not starting"
```cmd
net start MongoDB
```

### "Connection refused"
Check if MongoDB is running:
```cmd
sc query MongoDB
```

Should show: `STATE: RUNNING`

If not running:
```cmd
net start MongoDB
```

## Using MongoDB Compass (GUI)

MongoDB Compass was installed with MongoDB:
1. Open MongoDB Compass
2. Connection string: `mongodb://localhost:27017`
3. Click **Connect**
4. You'll see your `inventiease` database
5. Browse collections: products, sales, alertsettings

## That's It!

Once MongoDB is installed and backend is restarted, everything will work! 🎉

## Need Help?

Run the diagnostic after installation:
```cmd
cd backend
node scripts/diagnose-mongo.js
```

Should show all green checkmarks ✅
