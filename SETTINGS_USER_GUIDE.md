# Settings User Guide

## How to Use the New Features

### 🚀 Rapid Scan Mode

**What it does**: Speeds up inventory scanning by skipping confirmation dialogs for known products.

**How to enable**:
1. Go to **Settings** (from main menu)
2. Find **"Rapid Scan Mode"** under SCANNER section
3. Toggle it ON (green)
4. You'll see a success message

**How it works**:
- **Normal Mode**: Scan → Confirm → Add Batch (3 steps)
- **Rapid Mode**: Scan → Add Batch (2 steps) ⚡
- Saves 33% of your time!

**Visual indicator**: When scanning in Registry mode, you'll see a green "RAPID SCAN" badge at the bottom.

**Note**: New products still require admin PIN for security, even in rapid mode.

---

### 💾 Auto Backup

**What it does**: Automatically creates a backup of your entire inventory when enabled.

**How to enable**:
1. Go to **Admin Dashboard** → **Settings**
2. Find **"Auto Backup"** under DATA MANAGEMENT
3. Toggle it ON
4. A backup will be created immediately
5. Last backup date shows in the description

**Backup format**: JSON file with timestamp
- Filename: `inventory_backup_2026-02-08.json`
- Contains: All products, batches, and metadata
- Location: App's document directory (mobile) or Downloads (web)

**Manual backup**:
- Tap **"Backup Now"** to create a backup anytime
- Useful before major changes or deletions

---

### 📊 Export Data

**What it does**: Exports your entire inventory to a CSV file for use in Excel, Google Sheets, or other tools.

**How to use**:
1. Go to **Admin Dashboard** → **Settings**
2. Tap **"Export Data"** under DATA MANAGEMENT
3. Wait for the export to complete (loading indicator shows)
4. **On mobile**: Share dialog opens - save or share the file
5. **On web**: File downloads automatically

**CSV includes**:
- Product name, category, barcode
- Total quantity, perishable status
- All batch details (number, quantity, expiry, price)

**Filename format**: `inventory_export_2026-02-08.csv`

**Use cases**:
- Create reports for management
- Analyze inventory trends in Excel
- Share data with accountants
- Backup in human-readable format

---

### 🔒 Require PIN for Delete

**What it does**: Adds extra security by requiring admin PIN before deleting products.

**How to enable**:
1. Go to **Admin Dashboard** → **Settings**
2. Find **"Require PIN for Delete"** under SECURITY
3. Toggle it ON
4. Must have admin PIN set first

**How it works**:
- When deleting a product, you'll be prompted for PIN
- Prevents accidental deletions
- Recommended for multi-user environments

---

### ⏱️ Auto-Logout

**What it does**: Automatically logs you out of admin dashboard after inactivity.

**How to configure**:
1. Go to **Admin Dashboard** → **Settings**
2. Toggle **"Auto-Logout"** ON
3. Choose timeout: 30, 45, or 60 minutes
4. Session ends after selected time of inactivity

**Why use it**: Security feature for shared devices or public locations.

---

### 🎨 Dark Mode

**What it does**: Switches between light and dark themes.

**How to toggle**:
- **From Settings**: Toggle "Dark Mode"
- **From Admin Settings**: Toggle "Dark Mode"
- Changes apply immediately

---

### ⚠️ Expiry Thresholds

**What it does**: Controls when products trigger alerts based on days until expiration.

**How to configure**:
1. Go to **Settings**
2. Scroll to **ALERTS CONFIGURATION**
3. Set three thresholds:
   - **Critical Alert** (default: 7 days) - Red, urgent
   - **High Urgency** (default: 14 days) - Orange, prioritize
   - **Early Warning** (default: 30 days) - Yellow, plan ahead
4. Tap **"SAVE THRESHOLDS"**

**Rules**:
- Critical < High Urgency < Early Warning
- App validates the order before saving

---

## Tips & Best Practices

### For Fast-Paced Environments
- ✅ Enable **Rapid Scan Mode**
- ✅ Enable **Auto Backup** (daily safety net)
- ✅ Disable **Require PIN for Delete** (if trusted users only)

### For Security-Focused Environments
- ✅ Set strong **Admin PIN**
- ✅ Enable **Require PIN for Delete**
- ✅ Enable **Auto-Logout** (30 minutes)
- ✅ Disable **Rapid Scan Mode** (more confirmations)

### For Data Management
- ✅ Enable **Auto Backup**
- ✅ Use **Backup Now** before major changes
- ✅ **Export Data** weekly for reports
- ✅ Keep backups in multiple locations

### For Inventory Alerts
- ✅ Adjust **Expiry Thresholds** based on your product types
- ✅ Shorter thresholds for fast-moving items
- ✅ Longer thresholds for slow-moving items

---

## Troubleshooting

### Rapid Scan not working?
- Check if toggle is ON in Settings
- Restart the app
- Only works for products already in registry

### Export/Backup not saving?
- Check storage permissions (mobile)
- Ensure enough storage space
- Try manual backup first

### Can't delete products?
- Check if "Require PIN for Delete" is enabled
- Verify you have the correct admin PIN
- Contact admin to reset PIN if forgotten

### Thresholds not saving?
- Check internet connection (saves to backend)
- Verify threshold order (Critical < High < Early)
- Try again after a few seconds

---

## Storage Locations

### Mobile (iOS/Android)
- **Backups**: App's document directory
- **Exports**: Shared via native share dialog
- **Settings**: Device storage (AsyncStorage)

### Web
- **Backups**: Downloads folder
- **Exports**: Downloads folder
- **Settings**: Browser storage (localStorage)

---

## Version Information

**Current Version**: v2.0.6
**Features Added**: Rapid Scan, Auto Backup, Export Data
**Platform Support**: iOS, Android, Web

---

## Need Help?

If you encounter any issues:
1. Check this guide first
2. Restart the app
3. Check your internet connection
4. Verify admin PIN is set (for admin features)
5. Contact support with error details

---

**Happy Scanning! 📦✨**
