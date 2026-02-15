require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function setupUsers() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('ERROR: MONGO_URI or MONGODB_URI not found in .env file');
      console.log('Please add one of these to your backend/.env file:');
      console.log('MONGO_URI=mongodb://localhost:27017/your-database');
      console.log('or');
      console.log('MONGODB_URI=mongodb://localhost:27017/your-database');
      process.exit(1);
    }
    
    console.log('Using MongoDB URI:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Drop existing indexes to recreate them
    console.log('\nDropping existing indexes...');
    try {
      await User.collection.dropIndexes();
      console.log('Indexes dropped');
    } catch (error) {
      console.log('No indexes to drop or error:', error.message);
    }

    // Create indexes
    console.log('\nCreating indexes...');
    await User.createIndexes();
    console.log('Indexes created successfully');

    // List all indexes
    console.log('\nCurrent indexes:');
    const indexes = await User.collection.getIndexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Count existing users
    const userCount = await User.countDocuments();
    console.log(`\nTotal users in database: ${userCount}`);

    if (userCount > 0) {
      console.log('\nExisting users:');
      const users = await User.find().select('-pin');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.role}) - ID: ${user._id} - Active: ${user.isActive}`);
      });
    }

    // Test creating a user
    console.log('\n--- Testing User Creation ---');
    const testUser = new User({
      name: 'Test Staff',
      pin: '9999',
      role: 'staff'
    });

    try {
      await testUser.save();
      console.log('✓ Test user created successfully:', testUser._id);
      
      // Clean up test user
      await User.deleteOne({ _id: testUser._id });
      console.log('✓ Test user deleted');
    } catch (error) {
      console.log('✗ Test user creation failed:', error.message);
    }

    console.log('\n✓ Setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
}

setupUsers();
