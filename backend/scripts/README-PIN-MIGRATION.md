# PIN Field Migration Guide

## Overview

This guide explains the migration from the old single `pin` field to the new dual PIN system (`loginPin` and `securityPin`).

## Migration Steps

### Step 1: Migrate Existing PINs (COMPLETED)

The first migration script (`migrate-pins.js`) has already been run to copy the old `pin` values to the new `loginPin` and `securityPin` fields.

**Status**: ✅ Completed

### Step 2: Remove Old PIN Field (CURRENT STEP)

Now that all users have been migrated to the new PIN system, we need to remove the deprecated `pin` field from the database.

#### Prerequisites

- All users must have `loginPin` set
- Admin users must have `securityPin` set
- The app must be using the new PIN system (frontend updated)

#### Running the Migration

From the backend directory, run:

```bash
npm run migrate:remove-old-pin
```

Or directly:

```bash
node scripts/remove-old-pin-field.js
```

#### What This Script Does

1. Connects to MongoDB
2. Counts users with the old `pin` field
3. Shows affected users (without revealing actual PINs)
4. Removes the `pin` field from all user documents
5. Verifies the migration was successful
6. Shows final state of all users

#### Expected Output

```
🔄 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found 4 users with old 'pin' field

👥 Users that will be affected:
   - Nelson (admin) - PIN: ****
   - Brown (staff) - PIN: ****
   - John (staff) - PIN: ****
   - Jane (staff) - PIN: ****

🔄 Removing old pin field from all users...
✅ Successfully removed old pin field from 4 users

✅ Verification: All old pin fields have been removed successfully!

📊 Final User State:
   - Nelson (admin) - Login PIN: ✓, Security PIN: ✓
   - Brown (staff) - Login PIN: ✓, Security PIN: ✗
   - John (staff) - Login PIN: ✓, Security PIN: ✗
   - Jane (staff) - Login PIN: ✓, Security PIN: ✗

✅ Migration completed successfully!
🔌 Database connection closed
```

## Database Schema Changes

### Before Migration

```javascript
{
  name: String,
  pin: String,           // ❌ DEPRECATED
  loginPin: String,      // ✅ NEW
  securityPin: String,   // ✅ NEW
  role: String,
  // ... other fields
}
```

### After Migration

```javascript
{
  name: String,
  loginPin: String,      // ✅ Used for authentication
  securityPin: String,   // ✅ Used for sensitive operations (admin only)
  role: String,
  // ... other fields
}
```

## Frontend Changes

### AsyncStorage Keys

**Old System:**
- `admin_pin` - Single PIN for everything

**New System:**
- `admin_login_pin` - Used for login authentication
- `admin_security_pin` - Used for sensitive operations (product deletion, registration)
- `staff_login_pin` - Used for staff login

### Setup Flow Updates

The initial setup flow (`app/auth/setup.tsx`) now stores both PINs:

```javascript
await AsyncStorage.multiSet([
  ['admin_login_pin', pin],
  ['admin_security_pin', pin],  // Same value initially
  // ... other keys
]);
```

## Rollback Plan

If you need to rollback this migration:

1. The old `pin` field has been removed from documents
2. You would need to restore from a database backup
3. Or manually recreate the `pin` field by copying from `loginPin`

**Note**: It's recommended to backup your database before running this migration.

## Verification

After running the migration, verify:

1. ✅ No users have the old `pin` field
2. ✅ All users have `loginPin` set
3. ✅ Admin users have `securityPin` set
4. ✅ App login works correctly
5. ✅ Admin security operations work correctly
6. ✅ No security PIN warnings appear in the app

## Troubleshooting

### Issue: Users still have old `pin` field

**Solution**: Run the migration script again. It's idempotent and safe to run multiple times.

### Issue: App shows "PIN not set" warnings

**Cause**: Frontend AsyncStorage might still have old keys.

**Solution**: 
1. Clear app data/cache
2. Log out and log back in
3. The PIN migration utility in `utils/pinMigration.ts` should handle this automatically

### Issue: Login fails after migration

**Cause**: User might not have `loginPin` set.

**Solution**: Check the database and ensure the first migration (`migrate-pins.js`) was run successfully.

## Support

If you encounter any issues during migration, check:

1. MongoDB connection string is correct
2. All environment variables are set
3. Database backup exists
4. Previous migration (`migrate-pins.js`) was completed successfully
