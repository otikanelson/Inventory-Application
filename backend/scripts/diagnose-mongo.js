const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns').promises;

dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔍 MongoDB Connection Diagnostics\n');
console.log('=' .repeat(50));

// Step 1: Check environment variable
console.log('\n1️⃣  Checking Environment Variables...');
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is not set in .env file');
  process.exit(1);
}
console.log('✅ MONGO_URI is set');

// Step 2: Parse connection string
console.log('\n2️⃣  Parsing Connection String...');
try {
  const uri = process.env.MONGO_URI;
  const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)/);
  
  if (match) {
    console.log('✅ Connection string format is valid');
    console.log(`   Username: ${match[1]}`);
    console.log(`   Password: ${'*'.repeat(match[2].length)}`);
    console.log(`   Cluster: ${match[3]}`);
  } else {
    console.log('⚠️  Could not parse connection string');
  }
} catch (error) {
  console.error('❌ Error parsing connection string:', error.message);
}

// Step 3: DNS Resolution
console.log('\n3️⃣  Testing DNS Resolution...');
const clusterHost = 'inventicluster.evstzpk.mongodb.net';
dns.resolve4(clusterHost)
  .then(addresses => {
    console.log('✅ DNS resolution successful');
    console.log(`   Resolved to: ${addresses.join(', ')}`);
  })
  .catch(error => {
    console.error('❌ DNS resolution failed:', error.message);
    console.error('   This could indicate network/firewall issues');
  })
  .finally(() => {
    // Step 4: Attempt MongoDB connection
    console.log('\n4️⃣  Attempting MongoDB Connection...');
    console.log('   (This may take up to 10 seconds)');
    
    const startTime = Date.now();
    
    mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    })
    .then(() => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ MongoDB Connected Successfully! (${duration}s)`);
      console.log(`   Host: ${mongoose.connection.host}`);
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log('\n✅ All diagnostics passed!');
      process.exit(0);
    })
    .catch((error) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`\n❌ MongoDB Connection Failed (${duration}s)`);
      console.error(`   Error: ${error.message}`);
      
      console.log('\n🔧 Troubleshooting Steps:');
      console.log('   1. Check MongoDB Atlas IP Whitelist:');
      console.log('      → Go to: https://cloud.mongodb.com');
      console.log('      → Network Access → IP Access List');
      console.log('      → Add 0.0.0.0/0 (for testing) or your IP');
      console.log('   2. Verify your network connection');
      console.log('   3. Check if VPN/proxy is blocking connection');
      console.log('   4. Verify username and password are correct');
      console.log('   5. Check if firewall is blocking port 27017');
      
      process.exit(1);
    });
  });
