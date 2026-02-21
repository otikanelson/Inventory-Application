require('dotenv').config();
const mongoose = require('mongoose');
const Prediction = require('../src/models/Prediction');
const Product = require('../src/models/Product');

async function addStoreIdToPredictions() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all predictions without storeId
    const predictionsWithoutStore = await Prediction.find({ 
      $or: [
        { storeId: null },
        { storeId: { $exists: false } }
      ]
    });

    console.log(`Found ${predictionsWithoutStore.length} predictions without storeId`);

    if (predictionsWithoutStore.length === 0) {
      console.log('✅ All predictions already have storeId');
      await mongoose.connection.close();
      process.exit(0);
    }

    let updated = 0;
    let failed = 0;

    for (const prediction of predictionsWithoutStore) {
      try {
        // Find the product to get its storeId
        const product = await Product.findById(prediction.productId);
        
        if (product && product.storeId) {
          // Update the prediction with the product's storeId
          await Prediction.updateOne(
            { _id: prediction._id },
            { $set: { storeId: product.storeId } }
          );
          updated++;
          
          if (updated % 10 === 0) {
            console.log(`Updated ${updated} predictions...`);
          }
        } else {
          console.log(`⚠️  Could not find product or storeId for prediction ${prediction._id}`);
          failed++;
        }
      } catch (error) {
        console.error(`Error updating prediction ${prediction._id}:`, error.message);
        failed++;
      }
    }

    console.log('\n✨ Migration complete!');
    console.log(`✅ Updated: ${updated} predictions`);
    if (failed > 0) {
      console.log(`⚠️  Failed: ${failed} predictions`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addStoreIdToPredictions();
