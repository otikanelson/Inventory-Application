const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
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