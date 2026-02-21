// Create test data for AI Insights and Alerts
// This script adds products with expiry dates that trigger alerts

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Sale = require('../src/models/Sale');
const { savePredictionToDatabase } = require('../src/services/predicitveAnalytics');

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

async function createExpiringProducts() {
  console.log('\n📦 Creating Expiring Products...');
  console.log('='.repeat(60));
  
  const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
  const now = new Date();
  
  const products = [
    {
      name: 'Fresh Milk (Critical)',
      category: 'Dairy',
      isPerishable: true,
      expiryDays: 4, // Critical alert (< 7 days)
      quantity: 15,
      price: 500
    },
    {
      name: 'Yogurt (Critical)',
      category: 'Dairy',
      isPerishable: true,
      expiryDays: 5, // Critical alert
      quantity: 20,
      price: 300
    },
    {
      name: 'Fresh Bread (High Urgency)',
      category: 'Bakery',
      isPerishable: true,
      expiryDays: 10, // High urgency alert (< 14 days)
      quantity: 25,
      price: 200
    },
    {
      name: 'Cheese (High Urgency)',
      category: 'Dairy',
      isPerishable: true,
      expiryDays: 12, // High urgency alert
      quantity: 10,
      price: 800
    },
    {
      name: 'Fresh Juice (Early Warning)',
      category: 'Beverages',
      isPerishable: true,
      expiryDays: 25, // Early warning (< 30 days)
      quantity: 30,
      price: 400
    }
  ];
  
  const createdProducts = [];
  
  for (const productData of products) {
    try {
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + productData.expiryDays);
      
      const product = await Product.create({
        storeId,
        name: productData.name,
        category: productData.category,
        isPerishable: productData.isPerishable,
        imageUrl: 'cube',
        batches: [{
          batchNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          quantity: productData.quantity,
          expiryDate: expiryDate,
          manufacturerDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          receivedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          price: productData.price
        }]
      });
      
      console.log(`✅ Created: ${product.name}`);
      console.log(`   Expires in: ${productData.expiryDays} days`);
      console.log(`   Quantity: ${productData.quantity}`);
      
      createdProducts.push(product);
      
    } catch (error) {
      console.error(`❌ Failed to create ${productData.name}:`, error.message);
    }
  }
  
  return createdProducts;
}

async function createSalesHistory(products) {
  console.log('\n💰 Creating Sales History...');
  console.log('='.repeat(60));
  
  const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
  const now = new Date();
  
  let totalSales = 0;
  
  for (const product of products) {
    try {
      // Create 5-10 sales over the past 30 days
      const salesCount = Math.floor(Math.random() * 6) + 5; // 5-10 sales
      
      for (let i = 0; i < salesCount; i++) {
        const daysAgo = Math.floor(Math.random() * 30); // Random day in past 30 days
        const saleDate = new Date(now);
        saleDate.setDate(saleDate.getDate() - daysAgo);
        
        const quantitySold = Math.floor(Math.random() * 3) + 1; // 1-3 units
        const priceAtSale = product.batches[0].price || 500;
        
        await Sale.create({
          storeId,
          productId: product._id,
          productName: product.name,
          category: product.category,
          quantitySold,
          priceAtSale,
          totalAmount: quantitySold * priceAtSale,
          paymentMethod: 'cash',
          saleDate,
          batchNumber: product.batches[0].batchNumber
        });
        
        totalSales++;
      }
      
      console.log(`✅ Created ${salesCount} sales for ${product.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to create sales for ${product.name}:`, error.message);
    }
  }
  
  console.log(`\n✅ Total sales created: ${totalSales}`);
  return totalSales;
}

async function generatePredictions(products) {
  console.log('\n🤖 Generating AI Predictions...');
  console.log('='.repeat(60));
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const product of products) {
    try {
      const prediction = await savePredictionToDatabase(product._id.toString());
      
      if (prediction) {
        console.log(`✅ Generated prediction for ${product.name}`);
        console.log(`   Risk Score: ${prediction.metrics.riskScore}/100`);
        console.log(`   Days Until Stockout: ${prediction.metrics.daysUntilStockout}`);
        successCount++;
      } else {
        console.log(`⚠️  Failed to generate prediction for ${product.name}`);
        errorCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error generating prediction for ${product.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n✅ Predictions generated: ${successCount} success, ${errorCount} errors`);
  return { successCount, errorCount };
}

async function verifyData() {
  console.log('\n🔍 Verifying Created Data...');
  console.log('='.repeat(60));
  
  const storeId = new mongoose.Types.ObjectId(TEMPLE_HILL_STORE_ID);
  
  // Check products
  const productCount = await Product.countDocuments({ storeId, isPerishable: true });
  console.log(`✅ Total perishable products: ${productCount}`);
  
  // Check expiring products
  const now = new Date();
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const products = await Product.find({
    storeId,
    isPerishable: true,
    'batches.expiryDate': { $lte: thirtyDaysFromNow }
  });
  
  console.log(`✅ Products expiring within 30 days: ${products.length}`);
  
  // Check sales
  const salesCount = await Sale.countDocuments({ storeId });
  console.log(`✅ Total sales: ${salesCount}`);
  
  // Check predictions
  const Prediction = require('../src/models/Prediction');
  const predictionCount = await Prediction.countDocuments({ storeId });
  const urgentCount = await Prediction.countDocuments({
    storeId,
    $or: [
      { 'metrics.riskScore': { $gte: 70 } },
      { 'metrics.daysUntilStockout': { $lte: 7 } }
    ]
  });
  
  console.log(`✅ Total predictions: ${predictionCount}`);
  console.log(`✅ Urgent predictions: ${urgentCount}`);
  
  return {
    products: productCount,
    expiring: products.length,
    sales: salesCount,
    predictions: predictionCount,
    urgent: urgentCount
  };
}

async function runScript() {
  console.log('\n🧪 Create Test Data for AI Insights and Alerts');
  console.log('='.repeat(60));
  console.log(`Target Store: Temple Hill (${TEMPLE_HILL_STORE_ID})`);
  
  await connectDB();
  
  // Create products
  const products = await createExpiringProducts();
  
  if (products.length === 0) {
    console.log('\n❌ No products created. Exiting...');
    await mongoose.connection.close();
    return;
  }
  
  // Create sales history
  await createSalesHistory(products);
  
  // Generate predictions
  await generatePredictions(products);
  
  // Verify data
  const stats = await verifyData();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test Data Creation Complete!');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Products Created: ${products.length}`);
  console.log(`   Products Expiring: ${stats.expiring}`);
  console.log(`   Sales Created: ${stats.sales}`);
  console.log(`   Predictions Generated: ${stats.predictions}`);
  console.log(`   Urgent Predictions: ${stats.urgent}`);
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Run: node backend/scripts/test-ai-insights-alerts.js');
  console.log('   2. Test AI Insights badge in app');
  console.log('   3. Test Alerts page in app');
  
  console.log('\n' + '='.repeat(60));
  
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Run script
runScript().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
