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
    
    // Optimize for serverless with connection pooling
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // 30 seconds for Vercel cold starts
      connectTimeoutMS: 30000, // 30 seconds to establish connection
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Limit connection pool for serverless
      minPoolSize: 1,
      family: 4, // Use IPv4, skip trying IPv6
      // Serverless-specific optimizations
      bufferCommands: false, // Disable mongoose buffering
      autoIndex: false, // Don't build indexes in production
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
    console.error('Please check:');
    console.error('1. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for Vercel)');
    console.error('2. Network/firewall settings');
    console.error('3. Connection string format');
    console.error('4. Vercel environment variables are set');
    console.error('5. MongoDB Atlas cluster is running (not paused)');
    throw error; // Let caller handle the error
  }
};

module.exports = connectDB;