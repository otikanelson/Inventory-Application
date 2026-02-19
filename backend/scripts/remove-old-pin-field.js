const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config({ path: '../.env' });

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
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
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
    
    // Remove the 'pin' field from all user documents
    const result = await User.updateMany(
      { pin: { $exists: true } },
      { $unset: { pin: "" } }
    );
    
    console.log('✅ Migration completed successfully!');
    console.log(`📊 Modified ${result.modifiedCount} user documents`);
    console.log(`📊 Matched ${result.matchedCount} user documents`);
    
    // Verify the migration
    const remainingUsers = await User.find({ pin: { $exists: true } });
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
