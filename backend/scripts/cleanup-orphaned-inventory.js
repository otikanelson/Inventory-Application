require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const INVENTORY_ID = '699767e1d8d6849ad7de78fd';

async function cleanupOrphanedInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const inventoryItem = await Product.findById(INVENTORY_ID);
    
    if (!inventoryItem) {
      console.log('❌ Inventory item not found');
      process.exit(1);
    }

    console.log('\n📦 Inventory Item to Delete:');
    console.log('  ID:', inventoryItem._id);
    console.log('  Name:', inventoryItem.name);
    console.log('  Barcode:', inventoryItem.barcode);
    console.log('  Total Quantity:', inventoryItem.totalQuantity);
    console.log('  Store ID:', inventoryItem.storeId);

    console.log('\n⚠️  WARNING: This will permanently delete this inventory record!');
    console.log('Proceeding with deletion in 2 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));

    await Product.findByIdAndDelete(INVENTORY_ID);
    
    console.log('\n✅ Inventory item deleted successfully');
    console.log('You can now delete the global registry product.');

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanupOrphanedInventory();
