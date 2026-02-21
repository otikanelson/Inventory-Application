require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

async function fixNullInternalCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all products with null internalCode
    const productsWithNull = await Product.find({ internalCode: null });
    console.log(`Found ${productsWithNull.length} products with null internalCode`);

    // Update them to remove the internalCode field entirely
    const result = await Product.updateMany(
      { internalCode: null },
      { $unset: { internalCode: "" } }
    );

    console.log(`Updated ${result.modifiedCount} products`);
    console.log('Migration complete!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

fixNullInternalCodes();
