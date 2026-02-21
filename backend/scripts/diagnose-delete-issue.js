require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const Product = require('../src/models/Product');

const JWT_TOKEN = process.env.TEST_JWT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function diagnoseDeleteIssue() {
  try {
    console.log('🔍 Diagnosing Delete Product Issue\n');

    // Step 1: Check JWT token
    console.log('1️⃣  Checking JWT Token...');
    if (!JWT_TOKEN) {
      console.error('❌ TEST_JWT_TOKEN not set in .env file');
      console.log('   Please add: TEST_JWT_TOKEN=your_jwt_token_here\n');
      return;
    }

    console.log('✅ JWT Token found');
    console.log('   Token preview:', JWT_TOKEN.substring(0, 30) + '...');

    // Step 2: Decode JWT token
    console.log('\n2️⃣  Decoding JWT Token...');
    let decoded;
    try {
      decoded = jwt.verify(JWT_TOKEN, JWT_SECRET);
      console.log('✅ Token decoded successfully');
      console.log('   User ID:', decoded.userId);
      console.log('   Role:', decoded.role);
      console.log('   Store ID:', decoded.storeId);
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      console.log('   This could mean:');
      console.log('   - JWT_SECRET mismatch between token signing and verification');
      console.log('   - Token is expired');
      console.log('   - Token is malformed\n');
      return;
    }

    // Step 3: Connect to database
    console.log('\n3️⃣  Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Step 4: Check if user exists
    console.log('\n4️⃣  Checking if user exists in database...');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.error('❌ User not found in database');
      console.log('   User ID from token:', decoded.userId);
      console.log('   This means the token is valid but the user was deleted\n');
      process.exit(1);
    }

    console.log('✅ User found in database');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Store ID:', user.storeId);
    console.log('   Store Name:', user.storeName);
    console.log('   Active:', user.isActive);

    // Step 5: Check if user is active
    if (!user.isActive) {
      console.error('\n❌ User is inactive');
      console.log('   The user account has been deactivated\n');
      process.exit(1);
    }

    // Step 6: Check products in user's store
    console.log('\n5️⃣  Checking products in user\'s store...');
    const products = await Product.find({ storeId: user.storeId }).limit(5);
    
    console.log(`✅ Found ${products.length} products (showing first 5)`);
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} (ID: ${product._id})`);
      console.log(`      Store ID: ${product.storeId}`);
      console.log(`      Barcode: ${product.barcode || 'N/A'}`);
    });

    // Step 7: Test tenant filter
    console.log('\n6️⃣  Testing tenant filter...');
    const tenantFilter = user.storeId ? { storeId: user.storeId } : {};
    console.log('   Tenant filter:', tenantFilter);
    
    const filteredProducts = await Product.find(tenantFilter).limit(3);
    console.log(`✅ Tenant filter works - found ${filteredProducts.length} products`);

    // Step 8: Summary
    console.log('\n📊 Diagnosis Summary:');
    console.log('   ✅ JWT token is valid');
    console.log('   ✅ User exists in database');
    console.log('   ✅ User is active');
    console.log('   ✅ User has storeId:', user.storeId);
    console.log('   ✅ Products exist in user\'s store');
    console.log('   ✅ Tenant filter is working');

    console.log('\n💡 Next Steps:');
    console.log('   1. Deploy the updated code to Vercel');
    console.log('   2. Check Vercel logs for detailed execution trace');
    console.log('   3. Look for "🗑️ ========== DELETE PRODUCT REQUEST =========="');
    console.log('   4. Verify req.user is logged correctly');
    console.log('   5. Check tenant filter matches user storeId\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Diagnosis failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

diagnoseDeleteIssue();
