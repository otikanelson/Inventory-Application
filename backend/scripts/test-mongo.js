const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('Testing MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set (hidden for security)' : 'NOT SET');

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000, // 10 second timeout
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  process.exit(0);
})
.catch((error) => {
  console.error('❌ MongoDB Connection Failed:', error.message);
  process.exit(1);
});
