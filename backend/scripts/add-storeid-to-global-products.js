require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const GlobalProduct = require('../src/models/GlobalProduct');
const Product = require('../src/models/Product');

async function addStoreIdToGlobalProducts() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get all global products without storeId
    const globalProductsWithoutStore = await GlobalProduct.find({ 
      $or: [
        { storeId: { $exists: false } },
        { storeId: null }
      ]
    });

    console.log(`\n📦 Found ${globalProductsWithoutStore.length} global products without storeId`);

    if (globalProductsWithoutStore.length === 0) {
      console.log('✅ All global products already have storeId');
      process.exit(0);
    }

    let updated = 0;
    let skipped = 0;

    for (const globalProduct of globalProductsWithoutStore) {
      console.log(`\n🔍 Processing: ${globalProduct.name} (${globalProduct.barcode})`);

      // Find inventory products with this barcode
      const inventoryProducts = await Product.find({ barcode: globalProduct.barcode });

      if (inventoryProducts.length === 0) {
        console.log(`  ⚠️  No inventory products found - skipping`);
        skipped++;
        continue;
      }

      // Get the storeId from the first inventory product
      const storeId = inventoryProducts[0].storeId;

      if (!storeId) {
        console.log(`  ⚠️  Inventory product has no storeId - skipping`);
        skipped++;
        continue;
      }

      // Update the global product
      globalProduct.storeId = storeId;
      await globalProduct.save();

      console.log(`  ✅ Updated with storeId: ${storeId}`);
      updated++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ⚠️  Skipped: ${skipped}`);
    console.log(`  📦 Total: ${globalProductsWithoutStore.length}`);

    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addStoreIdToGlobalProducts();
