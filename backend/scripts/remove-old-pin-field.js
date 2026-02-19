const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config({ path: '.env' });

/**
 * Migration Script: Remove Old 'pin' Field from User Documents
 * 
 * This script removes the deprecated 'pin' field from all user documents.
 * The app now uses 'loginPin' and 'securityPin' fields instead.
 * 
 * Usage: node backend/scripts/remove-old-pin-field.js
 */

async function removePinField() {
  try {
    console.log('🔄 Starting migration: Remove old pin field...');
    console.log('📡 Connecting to MongoDB...');
    
    // Connect to MongoDB (without deprecated options)
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ Connected to MongoDB');
    console.log('🔍 Finding users with old pin field...');
    
    // Find users that have the old 'pin' field
    const usersWithPin = await User.find({ pin: { $exists: true } });
    console.log(`📊 Found ${usersWithPin.length} users with old pin field`);
    
    if (usersWithPin.length === 0) {
      console.log('✨ No users found with old pin field. Migration not needed.');
      await mongoose.connection.close();
      return;
    }
    
    // Step 1: Drop old indexes that reference the 'pin' field
    console.log('🗑️ Dropping old indexes on pin field...');
    try {
      await mongoose.connection.db.collection('users').dropIndex('pin_1_role_1');
      console.log('✅ Dropped index: pin_1_role_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Index pin_1_role_1 does not exist (already dropped)');
      } else {
        console.warn('⚠️ Could not drop index pin_1_role_1:', error.message);
      }
    }
    
    try {
      await mongoose.connection.db.collection('users').dropIndex('pin_1_role_1_storeId_1');
      console.log('✅ Dropped index: pin_1_role_1_storeId_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Index pin_1_role_1_storeId_1 does not exist (already dropped)');
      } else {
        console.warn('⚠️ Could not drop index pin_1_role_1_storeId_1:', error.message);
      }
    }
    
    try {
      await mongoose.connection.db.collection('users').dropIndex('pin_1');
      console.log('✅ Dropped index: pin_1');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️ Index pin_1 does not exist (already dropped)');
      } else {
        console.warn('⚠️ Could not drop index pin_1:', error.message);
      }
    }
    
    // Step 2: Remove the 'pin' field from all user documents using direct MongoDB operation
    console.log('🔄 Removing pin field from user documents...');
    const result = await mongoose.connection.db.collection('users').updateMany(
      { pin: { $exists: true } },
      { $unset: { pin: "" } }
    );
    
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Modified ${result.modifiedCount} user documents`);
    console.log(`📊 Matched ${result.matchedCount} user documents`);
    
    // Verify the migration using direct MongoDB query
    const remainingUsers = await mongoose.connection.db.collection('users').find({ pin: { $exists: true } }).toArray();
    if (remainingUsers.length === 0) {
      console.log('✅ Verification passed: No users have old pin field');
    } else {
      console.warn(`⚠️ Warning: ${remainingUsers.length} users still have old pin field`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
removePinField()
  .then(() => {
    console.log('🎉 Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
