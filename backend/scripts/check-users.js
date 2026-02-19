/**
 * Check Users Script
 * 
 * This script checks the current state of users in the database
 * to understand what fields they have.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory';

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find all users
    const users = await usersCollection.find({}).toArray();

    console.log(`\n📊 Found ${users.length} users in database\n`);

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Has 'pin': ${user.pin !== undefined ? 'YES (' + user.pin + ')' : 'NO'}`);
      console.log(`  Has 'loginPin': ${user.loginPin !== undefined ? 'YES (' + user.loginPin + ')' : 'NO'}`);
      console.log(`  Has 'securityPin': ${user.securityPin !== undefined ? 'YES (' + user.securityPin + ')' : 'NO'}`);
      console.log(`  StoreId: ${user.storeId || 'N/A'}`);
      console.log(`  StoreName: ${user.storeName || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed');
  }
}

// Run check if called directly
if (require.main === module) {
  checkUsers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { checkUsers };
