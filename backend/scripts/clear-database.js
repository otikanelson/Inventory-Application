const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Sale = require('../src/models/Sale');
const AlertSettings = require('../src/models/AlertSettings');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Clear all data
const clearDatabase = async () => {
  try {
    await connectDB();
    
    console.log('\n🗑️  Clearing all data from database...\n');
    
    // Delete all products
    const productsDeleted = await Product.deleteMany({});
    console.log(`✅ Deleted ${productsDeleted.deletedCount} products`);
    
    // Delete all sales
    const salesDeleted = await Sale.deleteMany({});
    console.log(`✅ Deleted ${salesDeleted.deletedCount} sales records`);
    
    // Delete all alert settings
    const alertsDeleted = await AlertSettings.deleteMany({});
    console.log(`✅ Deleted ${alertsDeleted.deletedCount} alert settings`);
    
    console.log('\n✅ Database cleared successfully!');
    console.log('📝 Your database is now empty and ready for fresh data.\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

// Run
clearDatabase();
