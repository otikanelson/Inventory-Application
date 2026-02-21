// Test script for AI Insights and Alerts diagnosis
// This script identifies why AI Insights badge and Alerts page show empty states

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Sale = require('../src/models/Sale');
const Prediction = require('../src/models/Prediction');
const AlertSettings = require('../src/models/AlertSettings');
const User = require('../src/models/User');

// Test store ID
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

async function testPredictionsExist() {
  console.log('\n🤖 Testing AI Predictions Data...');
  console.log('='.repeat(60));
  
  try {
    const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
    
    // Test 1: Check if predictions exist
    const predictionsCount = await Prediction.countDocuments({ storeId });
    console.log(`✅ Found ${predictionsCount} predictions for Temple Hill store`);
    
    if (predictionsCount === 0) {
      console.log('❌ ISSUE: No predictions exist for Temple Hill store');
      console.log('💡 RECOMMENDATION: Run generate-predictions.js script');
      return { hasPredictions: false, hasUrgent: false };
    }
    
    // Test 2: Check urgent predictions (risk > 70 or stockout < 7)
    const urgentPredictions = await Prediction.find({
      storeId,
      $or: [
        { 'metrics.riskScore': { $gte: 70 } },
        { 'metrics.daysUntilStockout': { $lte: 7 } }
      ]
    }).populate('productId', 'name');
    
    console.log(`✅ Found ${urgentPredictions.length} urgent predictions`);
    
    if (urgentPredictions.length === 0) {
      console.log('⚠️  WARNING: No predictions meet urgency criteria');
      console.log('   This means AI Insights badge will show "All Clear"');
      
      // Show risk score distribution
      const allPredictions = await Prediction.find({ storeId }).select('metrics.riskScore metrics.daysUntilStockout');
      const riskScores = allPredictions.map(p => p.metrics.riskScore);
      const stockoutDays = allPredictions.map(p => p.metrics.daysUntilStockout);
      
      console.log('\n📊 Risk Score Distribution:');
      console.log(`   Max: ${Math.max(...riskScores)}`);
      console.log(`   Min: ${Math.min(...riskScores)}`);
      console.log(`   Avg: ${Math.round(riskScores.reduce((a, b) => a + b, 0) / riskScores.length)}`);
      
      console.log('\n📊 Days Until Stockout Distribution:');
      console.log(`   Min: ${Math.min(...stockoutDays)}`);
      console.log(`   Max: ${Math.max(...stockoutDays)}`);
      
      console.log('\n💡 RECOMMENDATION: Add products with shorter expiry dates or higher sales velocity');
      return { hasPredictions: true, hasUrgent: false };
    }
    
    // Show urgent predictions
    console.log('\n⚠️  Urgent Products:');
    urgentPredictions.slice(0, 5).forEach((pred, idx) => {
      console.log(`   ${idx + 1}. ${pred.productId?.name || 'Unknown'}`);
      console.log(`      Risk Score: ${pred.metrics.riskScore}/100`);
      console.log(`      Days Until Stockout: ${pred.metrics.daysUntilStockout}`);
    });
    
    return { hasPredictions: true, hasUrgent: true };
    
  } catch (error) {
    console.error('❌ Error testing predictions:', error.message);
    return { hasPredictions: false, hasUrgent: false };
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
      isPerishable: true
    });
    
    console.log(`✅ Found ${perishableCount} perishable products`);
    
    if (perishableCount === 0) {
      console.log('❌ ISSUE: No perishable products exist');
      console.log('💡 RECOMMENDATION: Add perishable products or run create-test-data-for-alerts.js');
      return { hasPerishable: false, hasExpiring: false };
    }
    
    // Test 2: Check products with batches
    const withBatches = await Product.countDocuments({
      storeId,
      isPerishable: true,
      'batches.0': { $exists: true }
    });
    
    console.log(`✅ Found ${withBatches} perishable products with batches`);
    
    if (withBatches === 0) {
      console.log('❌ ISSUE: Perishable products have no batches');
      console.log('💡 RECOMMENDATION: Add batches to perishable products');
      return { hasPerishable: true, hasExpiring: false };
    }
    
    // Test 3: Check products with expiry dates
    const products = await Product.find({
      storeId,
      isPerishable: true,
      'batches.0': { $exists: true }
    });
    
    let productsWithExpiry = 0;
    let expiringProducts = [];
    const now = new Date();
    
    for (const product of products) {
      for (const batch of product.batches) {
        if (batch.expiryDate) {
          productsWithExpiry++;
          const daysLeft = Math.ceil((new Date(batch.expiryDate) - now) / (1000 * 60 * 60 * 24));
          
          if (daysLeft <= 30 || daysLeft < 0) {
            expiringProducts.push({
              name: product.name,
              batchNumber: batch.batchNumber,
              daysLeft,
              quantity: batch.quantity
            });
          }
        }
      }
    }
    
    console.log(`✅ Found ${productsWithExpiry} batches with expiry dates`);
    
    if (productsWithExpiry === 0) {
      console.log('❌ ISSUE: No batches have expiry dates');
      console.log('💡 RECOMMENDATION: Add expiry dates to batches or run create-test-data-for-alerts.js');
      return { hasPerishable: true, hasExpiring: false };
    }
    
    console.log(`✅ Found ${expiringProducts.length} products expiring within 30 days`);
    
    if (expiringProducts.length === 0) {
      console.log('⚠️  WARNING: No products expiring within 30 days');
      console.log('   This means Alerts page will show 0 alerts');
      console.log('💡 RECOMMENDATION: Add products with shorter expiry dates');
      return { hasPerishable: true, hasExpiring: false };
    }
    
    // Show expiring products
    console.log('\n⚠️  Expiring Products:');
    expiringProducts.slice(0, 5).forEach((prod, idx) => {
      const status = prod.daysLeft < 0 ? 'EXPIRED' : 
                     prod.daysLeft <= 7 ? 'CRITICAL' :
                     prod.daysLeft <= 14 ? 'HIGH' : 'EARLY';
      console.log(`   ${idx + 1}. ${prod.name} (${prod.batchNumber})`);
      console.log(`      Days Left: ${prod.daysLeft} [${status}]`);
      console.log(`      Quantity: ${prod.quantity}`);
    });
    
    // Test 4: Check alert settings
    const settings = await AlertSettings.findOne({ storeId });
    if (settings) {
      console.log('\n⚙️  Alert Settings:');
      console.log(`   Critical: ${settings.thresholds.critical} days`);
      console.log(`   High Urgency: ${settings.thresholds.highUrgency} days`);
      console.log(`   Early Warning: ${settings.thresholds.earlyWarning} days`);
    } else {
      console.log('\n⚙️  Alert Settings: Using defaults (7/14/30 days)');
    }
    
    return { hasPerishable: true, hasExpiring: true };
    
  } catch (error) {
    console.error('❌ Error testing alerts:', error.message);
    return { hasPerishable: false, hasExpiring: false };
  }
}

async function testQuickInsightsEndpoint() {
  console.log('\n🔍 Testing Quick Insights Endpoint Logic...');
  console.log('='.repeat(60));
  
  try {
    const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
    
    // Simulate the endpoint query
    const query = {
      storeId,
      $or: [
        { 'metrics.riskScore': { $gte: 70 } },
        { 'metrics.daysUntilStockout': { $lte: 7 } }
      ]
    };
    
    const urgentPredictions = await Prediction.find(query)
      .populate('productId', 'name category imageUrl')
      .sort({ 'metrics.riskScore': -1 })
      .limit(10)
      .lean();
    
    console.log(`✅ Query returned ${urgentPredictions.length} urgent predictions`);
    
    // Format response like the endpoint does
    const criticalItems = urgentPredictions.map(p => ({
      productId: p.productId?._id,
      productName: p.productId?.name,
      riskScore: p.metrics.riskScore,
      daysUntilStockout: p.metrics.daysUntilStockout,
      recommendation: p.recommendations[0]?.message || 'Review product status'
    }));
    
    const response = {
      urgentCount: urgentPredictions.length,
      criticalItems,
      lastUpdate: new Date()
    };
    
    console.log('\n📦 Endpoint Response:');
    console.log(JSON.stringify(response, null, 2));
    
    if (response.urgentCount === 0) {
      console.log('\n⚠️  RESULT: AI Insights badge will show "All Clear"');
    } else {
      console.log(`\n✅ RESULT: AI Insights badge will show ${response.urgentCount} urgent items`);
    }
    
    return response;
    
  } catch (error) {
    console.error('❌ Error testing quick insights endpoint:', error.message);
    return null;
  }
}

async function testAlertsEndpoint() {
  console.log('\n🔍 Testing Alerts Endpoint Logic...');
  console.log('='.repeat(60));
  
  try {
    const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
    
    // Get alert settings
    let settings = await AlertSettings.findOne({ storeId });
    if (!settings) {
      settings = {
        thresholds: { critical: 7, highUrgency: 14, earlyWarning: 30 }
      };
    }
    
    const thresholds = settings.thresholds;
    const now = new Date();
    
    // Get perishable products
    const products = await Product.find({
      storeId,
      isPerishable: true,
      'batches.0': { $exists: true }
    });
    
    const alerts = [];
    
    // Generate alerts from batches
    for (const product of products) {
      for (const batch of product.batches) {
        if (!batch.expiryDate) continue;
        
        const expiryDate = new Date(batch.expiryDate);
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        // Only include items within earlyWarning threshold or expired
        if (daysLeft <= thresholds.earlyWarning || daysLeft < 0) {
          let level, priority;
          if (daysLeft < 0) {
            level = 'expired';
            priority = 4;
          } else if (daysLeft <= thresholds.critical) {
            level = 'critical';
            priority = 3;
          } else if (daysLeft <= thresholds.highUrgency) {
            level = 'high';
            priority = 2;
          } else {
            level = 'early';
            priority = 1;
          }
          
          alerts.push({
            alertId: `${product._id}_${batch.batchNumber}`,
            productName: product.name,
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            daysLeft,
            level,
            priority
          });
        }
      }
    }
    
    // Sort by priority
    alerts.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.daysLeft - b.daysLeft;
    });
    
    const summary = {
      total: alerts.length,
      expired: alerts.filter(a => a.level === 'expired').length,
      critical: alerts.filter(a => a.level === 'critical').length,
      high: alerts.filter(a => a.level === 'high').length,
      early: alerts.filter(a => a.level === 'early').length
    };
    
    console.log(`✅ Query returned ${alerts.length} alerts`);
    console.log('\n📊 Alert Summary:');
    console.log(`   Expired: ${summary.expired}`);
    console.log(`   Critical: ${summary.critical}`);
    console.log(`   High: ${summary.high}`);
    console.log(`   Early: ${summary.early}`);
    
    if (alerts.length > 0) {
      console.log('\n⚠️  Sample Alerts:');
      alerts.slice(0, 3).forEach((alert, idx) => {
        console.log(`   ${idx + 1}. ${alert.productName} (${alert.batchNumber})`);
        console.log(`      Level: ${alert.level.toUpperCase()}`);
        console.log(`      Days Left: ${alert.daysLeft}`);
        console.log(`      Quantity: ${alert.quantity}`);
      });
    }
    
    if (alerts.length === 0) {
      console.log('\n⚠️  RESULT: Alerts page will show 0 alerts');
    } else {
      console.log(`\n✅ RESULT: Alerts page will show ${alerts.length} alerts`);
    }
    
    return { alerts, summary };
    
  } catch (error) {
    console.error('❌ Error testing alerts endpoint:', error.message);
    return null;
  }
}

async function testAuthentication() {
  console.log('\n👤 Testing User Authentication...');
  console.log('='.repeat(60));
  
  try {
    const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
    
    // Find user for Temple Hill store
    const user = await User.findOne({ storeId });
    
    if (!user) {
      console.log('❌ ISSUE: No user found for Temple Hill store');
      console.log('💡 RECOMMENDATION: Create user account for Temple Hill store');
      return false;
    }
    
    console.log(`✅ Found user: ${user.username || user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Store ID: ${user.storeId}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing authentication:', error.message);
    return false;
  }
}

async function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSTIC REPORT SUMMARY');
  console.log('='.repeat(60));
  
  const issues = [];
  const recommendations = [];
  
  // Check predictions
  if (!results.predictions.hasPredictions) {
    issues.push('❌ No predictions exist');
    recommendations.push('Run: node backend/scripts/generate-predictions.js');
  } else if (!results.predictions.hasUrgent) {
    issues.push('⚠️  No urgent predictions (AI Insights will show "All Clear")');
    recommendations.push('This may be expected if products are not at risk');
  } else {
    console.log('✅ AI Insights: Working correctly');
  }
  
  // Check alerts
  if (!results.alerts.hasPerishable) {
    issues.push('❌ No perishable products exist');
    recommendations.push('Add perishable products or run: node backend/scripts/create-test-data-for-alerts.js');
  } else if (!results.alerts.hasExpiring) {
    issues.push('⚠️  No expiring products (Alerts will show 0 alerts)');
    recommendations.push('Add products with shorter expiry dates or run: node backend/scripts/create-test-data-for-alerts.js');
  } else {
    console.log('✅ Alerts: Working correctly');
  }
  
  // Check authentication
  if (!results.hasUser) {
    issues.push('❌ No user account for Temple Hill store');
    recommendations.push('Create user account for authentication');
  } else {
    console.log('✅ Authentication: User exists');
  }
  
  // Print issues
  if (issues.length > 0) {
    console.log('\n🔴 ISSUES FOUND:');
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  // Print recommendations
  if (recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    recommendations.forEach((rec, idx) => console.log(`   ${idx + 1}. ${rec}`));
  }
  
  if (issues.length === 0) {
    console.log('\n🎉 All checks passed! Both endpoints should work correctly.');
  }
  
  console.log('\n' + '='.repeat(60));
}

async function runAllTests() {
  console.log('\n🧪 AI Insights and Alerts Diagnostic Report');
  console.log('='.repeat(60));
  console.log(`Testing Store: Temple Hill (${TEMPLE_HILL_STORE_ID})`);
  
  await connectDB();
  
  const results = {
    predictions: await testPredictionsExist(),
    alerts: await testAlertsData(),
    hasUser: await testAuthentication()
  };
  
  await testQuickInsightsEndpoint();
  await testAlertsEndpoint();
  
  await generateReport(results);
  
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
