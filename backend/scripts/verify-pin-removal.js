/**
 * Verification Script: Check PIN Field Status
 * 
 * This script directly queries MongoDB to check the actual state of the pin field
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function verifyPinRemoval() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the raw collection (bypass Mongoose schema)
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Count documents with pin field (including null)
    const withPinField = await usersCollection.countDocuments({ pin: { $exists: true } });
    console.log(`📊 Documents with 'pin' field (including null): ${withPinField}`);

    // Count documents with non-null pin
    const withNonNullPin = await usersCollection.countDocuments({ pin: { $exists: true, $ne: null } });
    console.log(`📊 Documents with non-null 'pin' value: ${withNonNullPin}\n`);

    // Show all users with their pin field status
    const allUsers = await usersCollection.find({}).toArray();
    console.log('👥 All Users:');
    allUsers.forEach(user => {
      const hasPinField = 'pin' in user;
      const pinValue = user.pin;
      console.log(`   - ${user.name} (${user.role})`);
      console.log(`     Has 'pin' field: ${hasPinField}`);
      console.log(`     PIN value: ${pinValue === null ? 'null' : pinValue === undefined ? 'undefined' : '****'}`);
      console.log(`     loginPin: ${user.loginPin ? '✓' : '✗'}`);
      console.log(`     securityPin: ${user.securityPin ? '✓' : '✗'}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

verifyPinRemoval();
