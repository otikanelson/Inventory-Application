require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const GlobalProduct = require('../src/models/GlobalProduct');

const PRODUCT_ID = '6997665e8ec2c9515ee7f56a';

async function checkProductInventory() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the global product
    const globalProduct = await GlobalProduct.findById(PRODUCT_ID);
    
    if (!globalProduct) {
      console.log('❌ Global product not found');
      process.exit(1);
    }

    console.log('\n📦 Global Product:');
    console.log('  Name:', globalProduct.name);
    console.log('  Barcode:', globalProduct.barcode);
    console.log('  Category:', globalProduct.category);

    // Find all inventory items with this barcode
    const inventoryItems = await Product.find({ barcode: globalProduct.barcode });
    
    console.log('\n📊 Inventory Items with this barcode:', inventoryItems.length);
    
    if (inventoryItems.length === 0) {
      console.log('  ✅ No inventory items found - safe to delete');
    } else {
      inventoryItems.forEach((item, index) => {
        console.log(`\n  Item ${index + 1}:`);
        console.log('    ID:', item._id);
        console.log('    Name:', item.name);
        console.log('    Total Quantity:', item.totalQuantity);
        console.log('    Batches:', item.batches.length);
        console.log('    Store:', item.storeId);
        
        if (item.totalQuantity > 0) {
          console.log('    ⚠️  HAS STOCK - Cannot delete global product');
        } else {
          console.log('    ✅ No stock - can be cleaned up');
        }
      });
      
      const hasStock = inventoryItems.some(item => item.totalQuantity > 0);
      console.log('\n🔍 Summary:');
      console.log('  Has active stock:', hasStock ? '❌ YES' : '✅ NO');
      console.log('  Can delete global product:', hasStock ? '❌ NO' : '✅ YES');
    }

    await mongoose.connection.close();
    console.log('\n✅ Check complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProductInventory();
