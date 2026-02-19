/**
 * Script to check and fix store IDs in the database
 * Run this with: node scripts/fix-store-id.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixStoreIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-app');
    console.log('✅ Connected to MongoDB');

    // Get all stores
    const Store = mongoose.model('Store', new mongoose.Schema({}, { strict: false }));
    const stores = await Store.find({});

    console.log(`\n📊 Found ${stores.length} stores\n`);

    stores.forEach((store, index) => {
      const idString = store._id.toString();
      console.log(`Store ${index + 1}:`);
      console.log(`  Name: ${store.name}`);
      console.log(`  ID: ${idString}`);
      console.log(`  Length: ${idString.length} characters`);
      console.log(`  Valid: ${idString.length === 24 ? '✅' : '❌'}`);
      console.log('');
    });

    // Get all users and check their storeId
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const users = await User.find({ storeId: { $exists: true } });

    console.log(`\n📊 Found ${users.length} users with storeId\n`);

    users.forEach((user, index) => {
      const storeIdString = user.storeId ? user.storeId.toString() : 'null';
      console.log(`User ${index + 1}:`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  StoreID: ${storeIdString}`);
      console.log(`  Length: ${storeIdString.length} characters`);
      console.log(`  Valid: ${storeIdString.length === 24 ? '✅' : '❌'}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixStoreIds();
