require('dotenv').config();
const mongoose = require('mongoose');
const Sale = require('../src/models/Sale');
const Product = require('../src/models/Product');
const Prediction = require('../src/models/Prediction');
const Notification = require('../src/models/Notification');
const AlertSettings = require('../src/models/AlertSettings');
const Store = require('../src/models/Store');

async function addStoreIdToAllCollections() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all stores (in case there are multiple)
    const stores = await Store.find({});
    console.log(`Found ${stores.length} store(s) in database`);
    
    if (stores.length === 0) {
      console.log('❌ No stores found. Please create a store first.');
      await mongoose.connection.close();
      process.exit(1);
    }

    // Use the first store as default for orphaned records
    const defaultStore = stores[0];
    console.log(`Using default store: ${defaultStore.name} (${defaultStore._id})\n`);

    let totalUpdated = 0;

    // ============================================================================
    // 1. SALES COLLECTION
    // ============================================================================
    console.log('📊 Processing Sales...');
    const salesWithoutStore = await Sale.find({ 
      $or: [
        { storeId: null },
        { storeId: { $exists: false } }
      ]
    });

    console.log(`Found ${salesWithoutStore.length} sales without storeId`);

    let salesUpdated = 0;
    for (const sale of salesWithoutStore) {
      try {
        const product = await Product.findById(sale.productId);
        const storeId = product?.storeId || defaultStore._id;
        
        await Sale.updateOne(
          { _id: sale._id },
          { $set: { storeId } }
        );
        salesUpdated++;
      } catch (error) {
        console.error(`  ⚠️  Error updating sale ${sale._id}:`, error.message);
      }
    }
    console.log(`✅ Updated ${salesUpdated} sales\n`);
    totalUpdated += salesUpdated;

    // ============================================================================
    // 2. PREDICTIONS COLLECTION
    // ============================================================================
    console.log('🤖 Processing Predictions...');
    const predictionsWithoutStore = await Prediction.find({ 
      $or: [
        { storeId: null },
        { storeId: { $exists: false } }
      ]
    });

    console.log(`Found ${predictionsWithoutStore.length} predictions without storeId`);

    let predictionsUpdated = 0;
    for (const prediction of predictionsWithoutStore) {
      try {
        const product = await Product.findById(prediction.productId);
        const storeId = product?.storeId || defaultStore._id;
        
        await Prediction.updateOne(
          { _id: prediction._id },
          { $set: { storeId } }
        );
        predictionsUpdated++;
      } catch (error) {
        console.error(`  ⚠️  Error updating prediction ${prediction._id}:`, error.message);
      }
    }
    console.log(`✅ Updated ${predictionsUpdated} predictions\n`);
    totalUpdated += predictionsUpdated;

    // ============================================================================
    // 3. NOTIFICATIONS COLLECTION
    // ============================================================================
    console.log('🔔 Processing Notifications...');
    const notificationsWithoutStore = await Notification.find({ 
      $or: [
        { storeId: null },
        { storeId: { $exists: false } }
      ]
    });

    console.log(`Found ${notificationsWithoutStore.length} notifications without storeId`);

    let notificationsUpdated = 0;
    for (const notification of notificationsWithoutStore) {
      try {
        let storeId = defaultStore._id;
        
        // Try to get storeId from product if productId exists
        if (notification.productId) {
          const product = await Product.findById(notification.productId);
          if (product?.storeId) {
            storeId = product.storeId;
          }
        }
        
        await Notification.updateOne(
          { _id: notification._id },
          { $set: { storeId } }
        );
        notificationsUpdated++;
      } catch (error) {
        console.error(`  ⚠️  Error updating notification ${notification._id}:`, error.message);
      }
    }
    console.log(`✅ Updated ${notificationsUpdated} notifications\n`);
    totalUpdated += notificationsUpdated;

    // ============================================================================
    // 4. ALERT SETTINGS COLLECTION
    // ============================================================================
    console.log('⚙️  Processing Alert Settings...');
    const alertSettingsWithoutStore = await AlertSettings.find({ 
      $or: [
        { storeId: null },
        { storeId: { $exists: false } }
      ]
    });

    console.log(`Found ${alertSettingsWithoutStore.length} alert settings without storeId`);

    let alertSettingsUpdated = 0;
    for (const alertSetting of alertSettingsWithoutStore) {
      try {
        await AlertSettings.updateOne(
          { _id: alertSetting._id },
          { $set: { storeId: defaultStore._id } }
        );
        alertSettingsUpdated++;
      } catch (error) {
        console.error(`  ⚠️  Error updating alert setting ${alertSetting._id}:`, error.message);
      }
    }
    console.log(`✅ Updated ${alertSettingsUpdated} alert settings\n`);
    totalUpdated += alertSettingsUpdated;

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ Migration Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total records updated: ${totalUpdated}`);
    console.log(`  - Sales: ${salesUpdated}`);
    console.log(`  - Predictions: ${predictionsUpdated}`);
    console.log(`  - Notifications: ${notificationsUpdated}`);
    console.log(`  - Alert Settings: ${alertSettingsUpdated}`);
    console.log('═══════════════════════════════════════════════════════\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

addStoreIdToAllCollections();
