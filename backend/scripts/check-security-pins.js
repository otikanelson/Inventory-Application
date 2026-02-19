require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function checkSecurityPins() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully\n');

    // Find all admin users
    const admins = await User.find({ role: 'admin' });
    
    console.log(`Found ${admins.length} admin user(s):\n`);
    
    for (const admin of admins) {
      console.log('-----------------------------------');
      console.log(`Name: ${admin.name}`);
      console.log(`ID: ${admin._id}`);
      console.log(`Store Name: ${admin.storeName || 'N/A'}`);
      console.log(`Login PIN: ${admin.loginPin || 'NOT SET'}`);
      console.log(`Security PIN: ${admin.securityPin || 'NOT SET'}`);
      console.log(`Has old 'pin' field: ${admin.pin ? 'YES' : 'NO'}`);
      console.log('-----------------------------------\n');
    }

    // Find all staff users
    const staff = await User.find({ role: 'staff' });
    
    console.log(`\nFound ${staff.length} staff user(s):\n`);
    
    for (const member of staff) {
      console.log('-----------------------------------');
      console.log(`Name: ${member.name}`);
      console.log(`ID: ${member._id}`);
      console.log(`Store Name: ${member.storeName || 'N/A'}`);
      console.log(`Login PIN: ${member.loginPin || 'NOT SET'}`);
      console.log(`Security PIN: ${member.securityPin || 'NOT SET (expected for staff)'}`);
      console.log('-----------------------------------\n');
    }

    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSecurityPins();
