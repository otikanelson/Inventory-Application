const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('Using MONGO_URI:', process.env.MONGO_URI ? 'Set (hidden)' : 'NOT SET');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database Name: ${conn.connection.name}`);
    console.log(`✅ Connection State: ${conn.connection.readyState}`); // 1 = connected
    
    // List all collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📦 Available collections:', collections.map(c => c.name).join(', '));
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    console.error('Please check:');
    console.error('1. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
    console.error('2. Network/firewall settings');
    console.error('3. Connection string format');
    throw error; // Let caller handle the error
  }
};

module.exports = connectDB;