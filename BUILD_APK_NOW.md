# 🔨 Build APK Now - Quick Guide

## ⚡ Fast Track to Production APK

**Time Required:** 20-30 minutes  
**Prerequisites:** EAS CLI installed, Expo account

---

## 🚀 3-Step Build Process

### Step 1: Install EAS CLI (if not installed)
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo
```bash
eas login
```
Enter your Expo credentials when prompted.

### Step 3: Build Production APK
```bash
eas build --platform android --profile production
```

**What happens:**
- Build starts on Expo servers
- Takes 15-25 minutes
- You'll get a download link when complete

---

## 📥 After Build Completes

### 1. Download APK
- Click the link provided in terminal
- Or visit: https://expo.dev/accounts/[your-account]/projects/inventory/builds
- Download the APK file

### 2. Test APK
```bash
# Install on Android device
# Enable "Install from Unknown Sources" in device settings
# Transfer APK to device
# Tap to install
# Open InventEase app
```

### 3. Verify Everything Works
- [ ] App launches successfully
- [ ] Dashboard loads
- [ ] Can add products
- [ ] Scanner works
- [ ] AI predictions show
- [ ] Admin panel accessible

---

## ✅ Quick Test Checklist

After installing APK:
1. **Launch** - App opens in < 3 seconds
2. **Dashboard** - Shows metrics and AI insights
3. **Scanner** - Camera opens and scans barcodes
4. **Add Product** - Can add new product manually
5. **Inventory** - Products list displays correctly
6. **FEFO** - Expiry sorting works
7. **AI** - Predictions show on products
8. **Admin** - Can access with PIN
9. **Settings** - Dark/light mode toggles
10. **Performance** - Smooth navigation

---

## 🎯 If Build Fails

### Common Issues:

**Error: "Not logged in"**
```bash
eas login
```

**Error: "Project not configured"**
```bash
eas build:configure
```

**Error: "Build failed"**
- Check eas.json syntax
- Verify all dependencies are compatible
- Try with cache clear:
```bash
eas build --platform android --profile production --clear-cache
```

---

## 📱 Alternative: Preview Build

For faster testing (not for production):
```bash
eas build --platform android --profile preview
```

This is faster but use `production` profile for client delivery.

---

## 🎉 Success!

Once you have the APK:
1. ✅ Test thoroughly (see TESTING_GUIDE.md)
2. ✅ Prepare demo device
3. ✅ Schedule client meeting
4. ✅ Present with confidence!

---

## 📞 Need Help?

- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **Expo Forums**: https://forums.expo.dev/
- **Full Guide**: See BUILD_AND_DEPLOY.md

---

**Ready? Let's build!** 🚀

```bash
eas build --platform android --profile production
```

---

*Quick Build Guide*  
*For: InventEase v2.0.5*  
*Last Updated: February 8, 2026*
