const mongoose = require('mongoose');
require('dotenv').config();

async function dropOldIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get the Product collection
    const db = mongoose.connection.db;
    const productsCollection = db.collection('products');

    // List all indexes
    console.log('\nCurrent indexes on products collection:');
    const indexes = await productsCollection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the problematic productId index if it exists
    try {
      await productsCollection.dropIndex('productId_1');
      console.log('\n✅ Successfully dropped productId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('\n⚠️  productId_1 index does not exist (already dropped or never existed)');
      } else {
        throw error;
      }
    }

    // List indexes after dropping
    console.log('\nIndexes after cleanup:');
    const indexesAfter = await productsCollection.indexes();
    indexesAfter.forEach(index => {
      console.log(`- ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Index cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropOldIndexes();
