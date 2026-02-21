require('dotenv').config();
const mongoose = require('mongoose');
const Sale = require('../src/models/Sale');
const Product = require('../src/models/Product');

async function addStoreIdToSales() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all sales without storeId
    const salesWithoutStore = await Sale.find({ 
      $or: [
        { storeId: null },
        { storeId: { $exists: false } }
      ]
    });

    console.log(`Found ${salesWithoutStore.length} sales without storeId`);

    if (salesWithoutStore.length === 0) {
      console.log('✅ All sales already have storeId');
      await mongoose.connection.close();
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;

    for (const sale of salesWithoutStore) {
      try {
        // Find the product to get its storeId
        const product = await Product.findById(sale.productId);
        
        if (product && product.storeId) {
          // Update the sale with the product's storeId
          await Sale.updateOne(
            { _id: sale._id },
            { $set: { storeId: product.storeId } }
          );
          updated++;
          
          if (updated % 10 === 0) {
            console.log(`Updated ${updated} sales...`);
          }
        } else {
          console.log(`⚠️  Could not find product or storeId for sale ${sale._id}`);
          failed++;
        }
      } catch (error) {
        console.error(`Error updating sale ${sale._id}:`, error.message);
        failed++;
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`✅ Updated: ${updated} sales`);
    if (failed > 0) {
      console.log(`⚠️  Failed: ${failed} sales`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addStoreIdToSales();
