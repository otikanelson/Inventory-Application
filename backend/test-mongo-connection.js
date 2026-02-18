// Simple MongoDB connection test
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set (hidden)' : 'NOT SET');

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 60000, // 60 seconds
  connectTimeoutMS: 60000,
  socketTimeoutMS: 60000,
})
.then(() => {
  console.log('✅ SUCCESS! MongoDB connected');
  console.log('Host:', mongoose.connection.host);
  console.log('Database:', mongoose.connection.name);
  console.log('State:', mongoose.connection.readyState);
  process.exit(0);
})
.catch((error) => {
  console.error('❌ FAILED! MongoDB connection error:');
  console.error('Message:', error.message);
  console.error('Code:', error.code);
  console.error('Name:', error.name);
  
  if (error.message.includes('ETIMEOUT')) {
    console.error('\n🔥 TIMEOUT ERROR - Possible causes:');
    console.error('1. Windows Firewall blocking port 27017');
    console.error('2. Antivirus blocking the connection');
    console.error('3. ISP/Network blocking MongoDB Atlas');
    console.error('4. VPN or proxy interfering');
    console.error('\n💡 Try:');
    console.error('- Disable Windows Firewall temporarily');
    console.error('- Disable antivirus temporarily');
    console.error('- Use mobile hotspot');
    console.error('- Connect via VPN');
  }
  
  process.exit(1);
});
