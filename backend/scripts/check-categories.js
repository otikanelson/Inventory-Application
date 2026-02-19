// Script to check if categories exist in the database
// Run with: node backend/scripts/check-categories.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');

async function checkCategories() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Fetch all categories
    const categories = await Category.find().sort({ name: 1 });
    
    console.log('='.repeat(50));
    console.log('CATEGORY CHECK RESULTS');
    console.log('='.repeat(50));
    console.log(`Total Categories: ${categories.length}\n`);
    
    if (categories.length === 0) {
      console.log('⚠️  NO CATEGORIES FOUND');
      console.log('\nThis is why categories are not showing in the add-products page.');
      console.log('\nTo fix this:');
      console.log('1. Log in as admin (Nelson)');
      console.log('2. Go to Admin Dashboard > Settings > Store Settings');
      console.log('3. Create some categories (e.g., "Beverages", "Snacks", "Dairy", etc.)');
      console.log('4. Categories will then appear in the add-products page\n');
    } else {
      console.log('✓ Categories found:\n');
      categories.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat.name}`);
        console.log(`   - Product Count: ${cat.productCount}`);
        console.log(`   - Created: ${cat.createdAt.toLocaleDateString()}`);
        console.log(`   - ID: ${cat._id}\n`);
      });
    }
    
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

checkCategories();
