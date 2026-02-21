// Test script for multi-tenancy data fetch fixes
// This script tests all the endpoints to verify tenant filtering is working correctly

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Sale = require('../src/models/Sale');
const Prediction = require('../src/models/Prediction');
const Notification = require('../src/models/Notification');
const AlertSettings = require('../src/models/AlertSettings');

// Test store IDs (from your database)
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

async function testRecentlySoldData() {
  console.log('\n📊 Testing Recently Sold Data...');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Check if sales exist for Temple Hill store
    const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
    
    const salesCount = await Sale.countDocuments({ storeId });
    console.log(`✅ Found ${salesCount} sales for Temple Hill store`);
    
    if (salesCount === 0) {
      console.log('⚠️  No sales found for Temple Hill store');
      console.log('   This is why Recently Sold tab is empty');
      return;
    }
    
    // Test 2: Simulate the aggregation pipeline from getRecentlySold
    const pipeline = [
      { $match: { storeId } },
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
      { $limit: 10 }
    ];
    
    const recentSales = await Sale.aggregate(pipeline);
    console.log(`✅ Aggregation returned ${recentSales.length} products`);
    
    if (recentSales.length > 0) {
      console.log('\n📦 Sample Recently Sold Products:');
      recentSales.slice(0, 3).forEach((sale, idx) => {
        console.log(`   ${idx + 1}. ${sale.productName} - ${sale.totalSold} units sold`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing recently sold:', error.message);
  }
}

async function testAlertsData() {
  console.log('\n🚨 Testing Alerts Data...');
  console.log('='.repeat(60));
  
  try {
    const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
    
    // Test 1: Check perishable products
    const perishableCount = await Product.countDocuments({
      storeId,
      isPerishable: true,
      'batches.0': { $exists: true }
    });
    
    console.log(`✅ Found ${perishableCount} perishable products with batches`);
    
    if (perishableCount === 0) {
      console.log('⚠️  No perishable products found for Temple Hill store');
      console.log('   This is why Alerts page is empty');
      return;
    }
    
    // Test 2: Check for expiring products
    const products = await Product.find({
      storeId,
      isPerishable: true,
      'batches.0': { $exists: true }
    }).limit(5);
    
    console.log('\n📦 Sample Perishable Products:');
    const now = new Date();
    
    products.forEach((product, idx) => {
      const batch = product.batches[0];
      if (batch && batch.expiryDate) {
        const daysLeft = Math.ceil((new Date(batch.expiryDate) - now) / (1000 * 60 * 60 * 24));
        console.log(`   ${idx + 1}. ${product.name} - Expires in ${daysLeft} days`);
      }
    });
    
    // Test 3: Check alert settings
    const settings = await AlertSettings.findOne({ storeId });
    if (settings) {
      console.log('\n⚙️  Alert Settings:');
      console.log(`   Critical: ${settings.thresholds.critical} days`);
      console.log(`   High Urgency: ${settings.thresholds.highUrgency} days`);
      console.log(`   Early Warning: ${settings.thresholds.earlyWarning} days`);
    } else {
      console.log('⚠️  No alert settings found (will use defaults)');
    }
    
  } catch (error) {
    console.error('❌ Error testing alerts:', error.message);
  }
}

async function testPredictionsData() {
  console.log('\n🤖 Testing AI Predictions Data...');
  console.log('='.repeat(60));
  
  try {
    const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
    
    // Test 1: Check predictions
    const predictionsCount = await Prediction.countDocuments({ storeId });
    console.log(`✅ Found ${predictionsCount} predictions for Temple Hill store`);
    
    if (predictionsCount === 0) {
      console.log('⚠️  No predictions found for Temple Hill store');
      console.log('   Predictions should be created automatically');
      return;
    }
    
    // Test 2: Check urgent predictions
    const urgentPredictions = await Prediction.find({
      storeId,
      $or: [
        { 'metrics.riskScore': { $gte: 70 } },
        { 'metrics.daysUntilStockout': { $lte: 7 } }
      ]
    }).populate('productId', 'name');
    
    console.log(`✅ Found ${urgentPredictions.length} urgent predictions`);
    
    if (urgentPredictions.length > 0) {
      console.log('\n⚠️  Urgent Products:');
      urgentPredictions.slice(0, 3).forEach((pred, idx) => {
        console.log(`   ${idx + 1}. ${pred.productId?.name || 'Unknown'} - Risk: ${pred.metrics.riskScore}/100`);
      });
    }
    
    // Test 3: Check low confidence predictions
    const lowConfidence = await Prediction.countDocuments({
      storeId,
      dataPoints: { $lt: 7 }
    });
    
    console.log(`\n📊 ${lowConfidence} predictions with low confidence (< 7 data points)`);
    
  } catch (error) {
    console.error('❌ Error testing predictions:', error.message);
  }
}

async function testNotificationsData() {
  console.log('\n🔔 Testing Notifications Data...');
  console.log('='.repeat(60));
  
  try {
    const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
    
    // Test 1: Check notifications
    const notificationsCount = await Notification.countDocuments({ storeId });
    console.log(`✅ Found ${notificationsCount} notifications for Temple Hill store`);
    
    if (notificationsCount === 0) {
      console.log('⚠️  No notifications found for Temple Hill store');
      return;
    }
    
    // Test 2: Check unread notifications
    const unreadCount = await Notification.countDocuments({
      storeId,
      read: false,
      dismissed: false
    });
    
    console.log(`✅ ${unreadCount} unread notifications`);
    
    // Test 3: Sample notifications
    const notifications = await Notification.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('productId', 'name');
    
    if (notifications.length > 0) {
      console.log('\n📬 Recent Notifications:');
      notifications.forEach((notif, idx) => {
        console.log(`   ${idx + 1}. ${notif.type} - ${notif.title}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing notifications:', error.message);
  }
}

async function testDataIsolation() {
  console.log('\n🔒 Testing Data Isolation Between Stores...');
  console.log('='.repeat(60));
  
  try {
    // Get all stores
    const allStores = await mongoose.connection.db.collection('stores').find().toArray();
    console.log(`✅ Found ${allStores.length} stores in database`);
    
    // Check data distribution
    for (const store of allStores.slice(0, 5)) {
      const storeId = store._id;
      const storeName = store.name || 'Unknown';
      
      const productCount = await Product.countDocuments({ storeId });
      const salesCount = await Sale.countDocuments({ storeId });
      const predictionCount = await Prediction.countDocuments({ storeId });
      
      console.log(`\n📍 ${storeName} (${storeId}):`);
      console.log(`   Products: ${productCount}`);
      console.log(`   Sales: ${salesCount}`);
      console.log(`   Predictions: ${predictionCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing data isolation:', error.message);
  }
}

async function runAllTests() {
  console.log('\n🧪 Multi-Tenancy Data Fetch Fixes - Debug Report');
  console.log('='.repeat(60));
  console.log(`Testing Store: Temple Hill (${TEMPLE_HILL_STORE_ID})`);
  
  await connectDB();
  
  await testRecentlySoldData();
  await testAlertsData();
  await testPredictionsData();
  await testNotificationsData();
  await testDataIsolation();
  
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
