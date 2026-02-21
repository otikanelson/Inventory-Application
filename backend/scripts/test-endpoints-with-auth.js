// Test endpoints with authentication simulation
// This script tests the endpoints as if they were called by an authenticated user

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Sale = require('../src/models/Sale');

// Test store IDs
const TEMPLE_HILL_STORE_ID = '69921ce87d826e56d4743867';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function testAuthenticatedUser() {
  console.log('\n👤 Testing User Authentication...');
  console.log('='.repeat(60));
  
  try {
    const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
    
    // Find a user for Temple Hill store
    const user = await User.findOne({ storeId });
    
    if (!user) {
      console.log('❌ No user found for Temple Hill store');
      console.log('   This is why requests are returning 401');
      console.log('   You need to create a user account for this store');
      return null;
    }
    
    console.log(`✅ Found user: ${user.username || user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Store ID: ${user.storeId}`);
    console.log(`   Is Author: ${user.isAuthor || false}`);
    
    return user;
    
  } catch (error) {
    console.error('❌ Error testing authentication:', error.message);
    return null;
  }
}

async function simulateRecentlySoldRequest(user) {
  console.log('\n📊 Simulating Recently Sold Request...');
  console.log('='.repeat(60));
  
  if (!user) {
    console.log('❌ Cannot simulate request without user');
    return;
  }
  
  try {
    const storeId = user.storeId;
    
    // Simulate the tenant filter middleware
    const tenantFilter = user.isAuthor ? {} : { storeId };
    
    console.log(`🔒 Tenant Filter:`, JSON.stringify(tenantFilter));
    
    // Simulate the aggregation pipeline from getRecentlySold
    const pipeline = [];
    
    if (tenantFilter.storeId) {
      const storeIdFilter = mongoose.Types.ObjectId.isValid(tenantFilter.storeId)
        ? new mongoose.Types.ObjectId(tenantFilter.storeId)
        : tenantFilter.storeId;
      
      pipeline.push({ $match: { storeId: storeIdFilter } });
      console.log(`✅ Applied storeId filter: ${storeIdFilter}`);
    }
    
    pipeline.push(
      { $sort: { saleDate: -1 } },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          category: { $first: '$category' },
          lastSaleDate: { $first: '$saleDate' },
          totalSold: { $sum: '$quantitySold' },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { lastSaleDate: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    );
    
    const recentSales = await Sale.aggregate(pipeline);
    
    console.log(`✅ Query returned ${recentSales.length} products`);
    
    if (recentSales.length > 0) {
      console.log('\n📦 Recently Sold Products:');
      recentSales.forEach((sale, idx) => {
        console.log(`   ${idx + 1}. ${sale.productName} - ${sale.totalSold} units - ₦${sale.totalRevenue}`);
      });
    } else {
      console.log('⚠️  No sales found for this store');
    }
    
    // Format response like the controller does
    const formattedData = recentSales
      .filter(sale => sale.productDetails)
      .map(sale => ({
        _id: sale._id,
        name: sale.productName,
        category: sale.category,
        lastSaleDate: sale.lastSaleDate,
        totalSold: sale.totalSold,
        totalRevenue: sale.totalRevenue,
        imageUrl: sale.productDetails?.imageUrl || 'cube',
        totalQuantity: sale.productDetails?.totalQuantity || 0,
        isPerishable: sale.productDetails?.isPerishable || false,
        batches: sale.productDetails?.batches || []
      }));
    
    console.log(`\n✅ Formatted response: ${formattedData.length} products`);
    
    return {
      success: true,
      data: formattedData
    };
    
  } catch (error) {
    console.error('❌ Error simulating request:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function checkFrontendIssues() {
  console.log('\n🔍 Checking Potential Frontend Issues...');
  console.log('='.repeat(60));
  
  console.log('\n1. Authentication Token:');
  console.log('   - Frontend must store token in AsyncStorage as "auth_session_token"');
  console.log('   - Axios interceptor adds token to all requests');
  console.log('   - Check if user is logged in and token is valid');
  
  console.log('\n2. API URL Configuration:');
  console.log('   - EXPO_PUBLIC_API_URL must point to backend server');
  console.log('   - Check .env file has correct backend URL');
  console.log('   - For local testing: http://localhost:8000/api');
  console.log('   - For production: https://your-backend.vercel.app/api');
  
  console.log('\n3. Network Connectivity:');
  console.log('   - Emulator must be able to reach backend server');
  console.log('   - For Android emulator, use 10.0.2.2 instead of localhost');
  console.log('   - For iOS simulator, localhost should work');
  
  console.log('\n4. CORS Configuration:');
  console.log('   - Backend must allow requests from frontend origin');
  console.log('   - Check backend CORS settings');
}

async function runAllTests() {
  console.log('\n🧪 Multi-Tenancy Authentication Debug Report');
  console.log('='.repeat(60));
  console.log(`Testing Store: Temple Hill (${TEMPLE_HILL_STORE_ID})`);
  
  await connectDB();
  
  const user = await testAuthenticatedUser();
  const response = await simulateRecentlySoldRequest(user);
  
  if (response && response.success) {
    console.log('\n✅ Backend is working correctly!');
    console.log('   The issue is likely in the frontend:');
    console.log('   - User not logged in');
    console.log('   - Auth token not being sent');
    console.log('   - Token expired or invalid');
  } else {
    console.log('\n❌ Backend has issues that need to be fixed');
  }
  
  await checkFrontendIssues();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Debug report complete!');
  console.log('='.repeat(60));
  
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
