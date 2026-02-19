const mongoose = require('mongoose');

// Cache the connection to reuse across serverless function invocations
let cachedConnection = null;

const connectDB = async () => {
  // If we have a cached connection and it's still connected, reuse it
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('♻️  Reusing existing MongoDB connection');
    return cachedConnection;
  }

  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('Using MONGO_URI:', process.env.MONGO_URI ? 'Set (hidden)' : 'NOT SET');
    
    // Optimize for faster initial connection
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Reduced from 30s to 10s for faster failure detection
      connectTimeoutMS: 10000, // Reduced from 30s to 10s
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
      autoIndex: false, // Don't build indexes in production
      retryWrites: true,
      retryReads: true,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`✅ Database Name: ${conn.connection.name}`);
    console.log(`✅ Connection State: ${conn.connection.readyState}`); // 1 = connected
    
    // Cache the connection for reuse
    cachedConnection = conn;
    
    // List all collections (only on first connection)
    if (!cachedConnection) {
      const collections = await conn.connection.db.listCollections().toArray();
      console.log('📦 Available collections:', collections.map(c => c.name).join(', '));
    }
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    
    // More specific error messages
    if (error.name === 'MongooseServerSelectionError') {
      console.error('💡 Connection timeout - possible causes:');
      console.error('   1. Network latency or firewall blocking connection');
      console.error('   2. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Vercel)');
      console.error('   3. MongoDB Atlas cluster is paused or unavailable');
      console.error('   4. DNS resolution issues with connection string');
    }
    
    throw error; // Let caller handle the error
  }
};

module.exports = connectDB;