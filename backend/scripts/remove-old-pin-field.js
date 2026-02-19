/**
 * Migration Script: Remove Old PIN Field
 * 
 * This script removes the deprecated 'pin' field from all User documents.
 * The old 'pin' field has been replaced with 'loginPin' and 'securityPin'.
 * 
 * Run this script after all users have been migrated to the new PIN system.
 * 
 * Usage: node backend/scripts/remove-old-pin-field.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function removeOldPinField() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Use raw MongoDB collection to bypass Mongoose schema
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Count users with the old 'pin' field
    const usersWithOldPin = await usersCollection.countDocuments({ pin: { $exists: true } });
    console.log(`📊 Found ${usersWithOldPin} users with old 'pin' field\n`);

    if (usersWithOldPin === 0) {
      console.log('✅ No users have the old pin field. Migration not needed.');
      await mongoose.connection.close();
      return;
    }

    // Show users that will be affected
    const affectedUsers = await usersCollection.find({ pin: { $exists: true } }, { projection: { name: 1, role: 1, pin: 1 } }).toArray();
    console.log('👥 Users that will be affected:');
    affectedUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - PIN: ${user.pin ? '****' : 'none'}`);
    });
    console.log('');

    // Perform the migration using raw MongoDB
    console.log('🔄 Removing old pin field from all users...');
    const result = await usersCollection.updateMany(
      {},  // Update ALL users
      { $unset: { pin: "" } }
    );

    console.log(`✅ Successfully processed ${result.matchedCount} users (${result.modifiedCount} modified)\n`);

    // Verify the migration
    const remainingUsersWithOldPin = await User.countDocuments({ pin: { $exists: true, $ne: null } });
    if (remainingUsersWithOldPin === 0) {
      console.log('✅ Verification: All old pin fields have been removed successfully!');
    } else {
      console.log(`⚠️  Warning: ${remainingUsersWithOldPin} users still have the old pin field`);
      
      // Show which users still have it
      const stillHavePin = await User.find({ pin: { $exists: true, $ne: null } }, { name: 1, role: 1, pin: 1 });
      console.log('   Users still with pin field:');
      stillHavePin.forEach(user => {
        console.log(`   - ${user.name} (${user.role}) - PIN: ${user.pin || 'null'}`);
      });
    }

    // Show final state
    console.log('\n📊 Final User State:');
    const allUsers = await User.find({}, { name: 1, role: 1, loginPin: 1, securityPin: 1 });
    allUsers.forEach(user => {
      const hasLoginPin = user.loginPin ? '✓' : '✗';
      const hasSecurityPin = user.securityPin ? '✓' : '✗';
      console.log(`   - ${user.name} (${user.role}) - Login PIN: ${hasLoginPin}, Security PIN: ${hasSecurityPin}`);
    });

    console.log('\n✅ Migration completed successfully!');
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
removeOldPinField();
