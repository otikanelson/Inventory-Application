require('dotenv').config();
const mongoose = require('mongoose');

async function fixInternalCodeIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('products');

    // Step 1: Drop the old index
    try {
      await collection.dropIndex('storeId_1_internalCode_1');
      console.log('✅ Dropped old storeId_1_internalCode_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('⚠️  Index does not exist, skipping drop');
      } else {
        throw error;
      }
    }

    // Step 2: Remove null internalCode values
    const updateResult = await collection.updateMany(
      { internalCode: null },
      { $unset: { internalCode: "" } }
    );
    console.log(`✅ Removed internalCode field from ${updateResult.modifiedCount} products`);

    // Step 3: Create new index with partialFilterExpression
    await collection.createIndex(
      { storeId: 1, internalCode: 1 },
      { 
        unique: true, 
        sparse: true,
        partialFilterExpression: { internalCode: { $type: "string" } }
      }
    );
    console.log('✅ Created new storeId_1_internalCode_1 index with partialFilterExpression');

    console.log('\n✨ Migration complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixInternalCodeIndex();
