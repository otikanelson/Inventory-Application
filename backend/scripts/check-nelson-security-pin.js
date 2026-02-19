require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function checkNelsonSecurityPin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find Nelson
    const nelson = await User.findOne({ name: 'Nelson', role: 'admin' });
    
    if (!nelson) {
      console.log('❌ Nelson not found');
      process.exit(1);
    }

    console.log('\n👤 Nelson (Admin):');
    console.log('  ID:', nelson._id);
    console.log('  Name:', nelson.name);
    console.log('  Role:', nelson.role);
    console.log('  Store ID:', nelson.storeId);
    console.log('  Store Name:', nelson.storeName);
    console.log('  Login PIN:', nelson.loginPin || 'NOT SET');
    console.log('  Security PIN:', nelson.securityPin || 'NOT SET');
    console.log('  Is Active:', nelson.isActive);

    // Find Brown
    const brown = await User.findOne({ name: 'Brown', role: 'staff' });
    
    if (brown) {
      console.log('\n👤 Brown (Staff):');
      console.log('  ID:', brown._id);
      console.log('  Name:', brown.name);
      console.log('  Role:', brown.role);
      console.log('  Store ID:', brown.storeId);
      console.log('  Store Name:', brown.storeName);
      console.log('  Login PIN:', brown.loginPin || 'NOT SET');
      console.log('  Same store as Nelson:', brown.storeId?.toString() === nelson.storeId?.toString() ? '✅ YES' : '❌ NO');
    }

    await mongoose.connection.close();
    console.log('\n✅ Check complete');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNelsonSecurityPin();
