require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function updateGlobalProductIndexes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('globalproducts');

    console.log('\n📋 Current indexes:');
    const existingIndexes = await collection.indexes();
    existingIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Drop the old unique barcode index if it exists
    try {
      console.log('\n🗑️  Attempting to drop old barcode index...');
      await collection.dropIndex('barcode_1');
      console.log('✅ Dropped old barcode_1 index');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️  barcode_1 index does not exist (already dropped or never created)');
      } else {
        throw error;
      }
    }

    // Create the new compound index
    console.log('\n➕ Creating new compound index (barcode + storeId)...');
    await collection.createIndex(
      { barcode: 1, storeId: 1 },
      { unique: true, name: 'barcode_1_storeId_1' }
    );
    console.log('✅ Created compound index: barcode_1_storeId_1');

    // Create storeId index for faster queries
    console.log('\n➕ Creating storeId index...');
    await collection.createIndex(
      { storeId: 1 },
      { name: 'storeId_1' }
    );
    console.log('✅ Created storeId_1 index');

    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n✅ Index update complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateGlobalProductIndexes();
