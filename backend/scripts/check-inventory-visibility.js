require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Store = require('../src/models/Store');
const User = require('../src/models/User');

async function checkInventoryVisibility() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the inventory item
    const inventoryItem = await Product.findById('699767e1d8d6849ad7de78fd');
    
    if (!inventoryItem) {
      console.log('❌ Inventory item not found');
      process.exit(1);
    }

    console.log('\n📦 Inventory Item:');
    console.log('  ID:', inventoryItem._id);
    console.log('  Name:', inventoryItem.name);
    console.log('  Barcode:', inventoryItem.barcode);
    console.log('  Total Quantity:', inventoryItem.totalQuantity);
    console.log('  Store ID:', inventoryItem.storeId);

    // Find the store
    const store = await Store.findById(inventoryItem.storeId);
    console.log('\n🏪 Store:');
    if (store) {
      console.log('  ID:', store._id);
      console.log('  Name:', store.name);
      console.log('  Owner:', store.ownerId);
    } else {
      console.log('  ❌ Store not found!');
    }

    // Find all users
    const users = await User.find();
    console.log('\n👥 Users:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role})`);
      console.log(`    ID: ${user._id}`);
      console.log(`    Store: ${user.storeId}`);
      console.log(`    Matches inventory store: ${user.storeId?.toString() === inventoryItem.storeId?.toString() ? '✅ YES' : '❌ NO'}`);
    });

    // Check if the product would be returned by the inventory query
    console.log('\n🔍 Query Test:');
    const testQuery = {
      storeId: inventoryItem.storeId
    };
    const foundProducts = await Product.find(testQuery);
    console.log(`  Products with storeId ${inventoryItem.storeId}:`, foundProducts.length);
    
    const isIncluded = foundProducts.some(p => p._id.toString() === inventoryItem._id.toString());
    console.log(`  Inventory item included: ${isIncluded ? '✅ YES' : '❌ NO'}`);

    await mongoose.connection.close();
    console.log('\n✅ Check complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkInventoryVisibility();
