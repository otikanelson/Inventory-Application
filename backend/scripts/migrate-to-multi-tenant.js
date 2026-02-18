/**
 * Multi-Tenant Migration Script
 * 
 * This script migrates the existing single-tenant database to a multi-tenant architecture.
 * It creates a default store and associates all existing data with it.
 * 
 * Usage:
 *   node backend/scripts/migrate-to-multi-tenant.js [--dry-run] [--rollback]
 * 
 * Options:
 *   --dry-run   : Preview changes without applying them
 *   --rollback  : Revert the migration (removes storeId fields)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// Import models
const Store = require('../src/models/Store');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Sale = require('../src/models/Sale');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isRollback = args.includes('--rollback');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[STEP ${step}] ${message}`, colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    logSuccess('Connected to MongoDB');
  } catch (error) {
    logError(`Failed to connect to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  logSuccess('Disconnected from MongoDB');
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

async function createDefaultStore() {
  logStep(1, 'Creating default store');
  
  try {
    // Check if default store already exists
    const existingStore = await Store.findOne({ name: 'Default Store' });
    
    if (existingStore) {
      logWarning('Default store already exists');
      return existingStore;
    }
    
    // Find the first admin user to be the owner
    const firstAdmin = await User.findOne({ role: 'admin' });
    
    if (!firstAdmin) {
      logWarning('No admin user found. Creating store without owner (will need to be assigned later)');
      // Create a temporary ObjectId for the owner
      const tempOwnerId = new mongoose.Types.ObjectId();
      
      if (isDryRun) {
        log('  [DRY RUN] Would create store: Default Store with temporary owner');
        return { _id: new mongoose.Types.ObjectId(), name: 'Default Store', ownerId: tempOwnerId };
      }
      
      const defaultStore = new Store({
        name: 'Default Store',
        ownerId: tempOwnerId,
        isActive: true,
      });
      
      await defaultStore.save();
      logSuccess(`Created default store with ID: ${defaultStore._id}`);
      logWarning(`Store created with temporary owner ID: ${tempOwnerId}. Please assign a real owner.`);
      return defaultStore;
    }
    
    if (isDryRun) {
      log(`  [DRY RUN] Would create store: Default Store with owner: ${firstAdmin.name} (${firstAdmin._id})`);
      return { _id: new mongoose.Types.ObjectId(), name: 'Default Store', ownerId: firstAdmin._id };
    }
    
    const defaultStore = new Store({
      name: 'Default Store',
      ownerId: firstAdmin._id,
      isActive: true,
    });
    
    await defaultStore.save();
    logSuccess(`Created default store with ID: ${defaultStore._id}`);
    logSuccess(`Store owner: ${firstAdmin.name} (${firstAdmin._id})`);
    return defaultStore;
  } catch (error) {
    logError(`Failed to create default store: ${error.message}`);
    throw error;
  }
}

async function migrateUsers(storeId) {
  logStep(2, 'Migrating users');
  
  try {
    // Find users without storeId
    const usersToMigrate = await User.find({ storeId: { $exists: false } });
    
    log(`  Found ${usersToMigrate.length} users to migrate`);
    
    if (usersToMigrate.length === 0) {
      logWarning('No users to migrate');
      return { migrated: 0, skipped: 0 };
    }
    
    if (isDryRun) {
      log(`  [DRY RUN] Would update ${usersToMigrate.length} users with storeId: ${storeId}`);
      return { migrated: usersToMigrate.length, skipped: 0 };
    }
    
    const result = await User.updateMany(
      { storeId: { $exists: false } },
      { 
        $set: { 
          storeId: storeId,
          storeName: 'Default Store'
        } 
      }
    );
    
    logSuccess(`Migrated ${result.modifiedCount} users`);
    return { migrated: result.modifiedCount, skipped: usersToMigrate.length - result.modifiedCount };
  } catch (error) {
    logError(`Failed to migrate users: ${error.message}`);
    throw error;
  }
}

async function migrateProducts(storeId) {
  logStep(3, 'Migrating products');
  
  try {
    // Find products without storeId
    const productsToMigrate = await Product.find({ storeId: { $exists: false } });
    
    log(`  Found ${productsToMigrate.length} products to migrate`);
    
    if (productsToMigrate.length === 0) {
      logWarning('No products to migrate');
      return { migrated: 0, skipped: 0 };
    }
    
    if (isDryRun) {
      log(`  [DRY RUN] Would update ${productsToMigrate.length} products with storeId: ${storeId}`);
      return { migrated: productsToMigrate.length, skipped: 0 };
    }
    
    // Drop the compound indexes temporarily to avoid conflicts
    try {
      await Product.collection.dropIndex('storeId_1_barcode_1');
      log('  Dropped storeId_1_barcode_1 index');
    } catch (e) {
      // Index might not exist yet
    }
    
    try {
      await Product.collection.dropIndex('storeId_1_internalCode_1');
      log('  Dropped storeId_1_internalCode_1 index');
    } catch (e) {
      // Index might not exist yet
    }
    
    // Update products one by one
    let migrated = 0;
    for (const product of productsToMigrate) {
      product.storeId = storeId;
      await product.save({ validateBeforeSave: false }); // Skip validation to avoid index issues
      migrated++;
    }
    
    logSuccess(`Migrated ${migrated} products`);
    return { migrated, skipped: 0 };
  } catch (error) {
    logError(`Failed to migrate products: ${error.message}`);
    throw error;
  }
}

async function migrateSales(storeId) {
  logStep(4, 'Migrating sales');
  
  try {
    // Find sales without storeId
    const salesToMigrate = await Sale.find({ storeId: { $exists: false } });
    
    log(`  Found ${salesToMigrate.length} sales to migrate`);
    
    if (salesToMigrate.length === 0) {
      logWarning('No sales to migrate');
      return { migrated: 0, skipped: 0 };
    }
    
    if (isDryRun) {
      log(`  [DRY RUN] Would update ${salesToMigrate.length} sales with storeId: ${storeId}`);
      return { migrated: salesToMigrate.length, skipped: 0 };
    }
    
    const result = await Sale.updateMany(
      { storeId: { $exists: false } },
      { $set: { storeId: storeId } }
    );
    
    logSuccess(`Migrated ${result.modifiedCount} sales`);
    return { migrated: result.modifiedCount, skipped: salesToMigrate.length - result.modifiedCount };
  } catch (error) {
    logError(`Failed to migrate sales: ${error.message}`);
    throw error;
  }
}

async function createIndexes() {
  logStep(5, 'Creating indexes');
  
  try {
    if (isDryRun) {
      log('  [DRY RUN] Would create indexes on storeId fields');
      return;
    }
    
    // Drop old single-field indexes that conflict with compound indexes
    try {
      await Product.collection.dropIndex('barcode_1');
      log('  Dropped old barcode_1 index');
    } catch (e) {
      // Index might not exist
    }
    
    try {
      await Product.collection.dropIndex('internalCode_1');
      log('  Dropped old internalCode_1 index');
    } catch (e) {
      // Index might not exist
    }
    
    // Create indexes for each model
    try {
      await User.createIndexes();
      logSuccess('Created User indexes');
    } catch (error) {
      logWarning(`User indexes: ${error.message}`);
    }
    
    try {
      await Product.createIndexes();
      logSuccess('Created Product indexes');
    } catch (error) {
      logWarning(`Product indexes: ${error.message}`);
      log('  Note: You may need to manually fix duplicate internalCode values');
    }
    
    try {
      await Sale.createIndexes();
      logSuccess('Created Sale indexes');
    } catch (error) {
      logWarning(`Sale indexes: ${error.message}`);
    }
    
    try {
      await Store.createIndexes();
      logSuccess('Created Store indexes');
    } catch (error) {
      logWarning(`Store indexes: ${error.message}`);
    }
  } catch (error) {
    logError(`Failed to create indexes: ${error.message}`);
    // Don't throw - allow migration to continue
  }
}

async function verifyMigration(storeId) {
  logStep(6, 'Verifying migration');
  
  try {
    // Check users
    const usersWithoutStore = await User.countDocuments({ 
      storeId: { $exists: false },
      role: { $ne: 'author' } // Exclude author users
    });
    
    if (usersWithoutStore > 0) {
      logWarning(`Found ${usersWithoutStore} users without storeId`);
    } else {
      logSuccess('All users have storeId');
    }
    
    // Check products
    const productsWithoutStore = await Product.countDocuments({ storeId: { $exists: false } });
    
    if (productsWithoutStore > 0) {
      logWarning(`Found ${productsWithoutStore} products without storeId`);
    } else {
      logSuccess('All products have storeId');
    }
    
    // Check sales
    const salesWithoutStore = await Sale.countDocuments({ storeId: { $exists: false } });
    
    if (salesWithoutStore > 0) {
      logWarning(`Found ${salesWithoutStore} sales without storeId`);
    } else {
      logSuccess('All sales have storeId');
    }
    
    return {
      usersWithoutStore,
      productsWithoutStore,
      salesWithoutStore,
      isComplete: usersWithoutStore === 0 && productsWithoutStore === 0 && salesWithoutStore === 0
    };
  } catch (error) {
    logError(`Failed to verify migration: ${error.message}`);
    throw error;
  }
}

async function verifyReferentialIntegrity(storeId) {
  logStep(7, 'Verifying referential integrity');
  
  try {
    // Check that all products reference valid stores
    const productsWithInvalidStore = await Product.countDocuments({
      storeId: { $exists: true },
      $expr: {
        $not: {
          $in: ['$storeId', await Store.distinct('_id')]
        }
      }
    });
    
    if (productsWithInvalidStore > 0) {
      logWarning(`Found ${productsWithInvalidStore} products with invalid storeId`);
    } else {
      logSuccess('All products reference valid stores');
    }
    
    // Check that all sales reference valid stores
    const salesWithInvalidStore = await Sale.countDocuments({
      storeId: { $exists: true },
      $expr: {
        $not: {
          $in: ['$storeId', await Store.distinct('_id')]
        }
      }
    });
    
    if (salesWithInvalidStore > 0) {
      logWarning(`Found ${salesWithInvalidStore} sales with invalid storeId`);
    } else {
      logSuccess('All sales reference valid stores');
    }
    
    // Check that all users (except author) reference valid stores
    const usersWithInvalidStore = await User.countDocuments({
      role: { $ne: 'author' },
      storeId: { $exists: true },
      $expr: {
        $not: {
          $in: ['$storeId', await Store.distinct('_id')]
        }
      }
    });
    
    if (usersWithInvalidStore > 0) {
      logWarning(`Found ${usersWithInvalidStore} users with invalid storeId`);
    } else {
      logSuccess('All users reference valid stores');
    }
    
    return {
      productsWithInvalidStore,
      salesWithInvalidStore,
      usersWithInvalidStore,
      isValid: productsWithInvalidStore === 0 && salesWithInvalidStore === 0 && usersWithInvalidStore === 0
    };
  } catch (error) {
    logError(`Failed to verify referential integrity: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// ROLLBACK FUNCTIONS
// ============================================================================

async function rollbackMigration() {
  log('\n' + '='.repeat(60), colors.bright);
  log('ROLLBACK MODE - Reverting Multi-Tenant Migration', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);
  
  if (isDryRun) {
    logWarning('DRY RUN MODE - No changes will be made\n');
  }
  
  try {
    // Remove storeId from users
    logStep(1, 'Removing storeId from users');
    if (isDryRun) {
      const count = await User.countDocuments({ storeId: { $exists: true } });
      log(`  [DRY RUN] Would remove storeId from ${count} users`);
    } else {
      const result = await User.updateMany(
        { storeId: { $exists: true } },
        { $unset: { storeId: '', storeName: '' } }
      );
      logSuccess(`Removed storeId from ${result.modifiedCount} users`);
    }
    
    // Remove storeId from products
    logStep(2, 'Removing storeId from products');
    if (isDryRun) {
      const count = await Product.countDocuments({ storeId: { $exists: true } });
      log(`  [DRY RUN] Would remove storeId from ${count} products`);
    } else {
      const result = await Product.updateMany(
        { storeId: { $exists: true } },
        { $unset: { storeId: '' } }
      );
      logSuccess(`Removed storeId from ${result.modifiedCount} products`);
    }
    
    // Remove storeId from sales
    logStep(3, 'Removing storeId from sales');
    if (isDryRun) {
      const count = await Sale.countDocuments({ storeId: { $exists: true } });
      log(`  [DRY RUN] Would remove storeId from ${count} sales`);
    } else {
      const result = await Sale.updateMany(
        { storeId: { $exists: true } },
        { $unset: { storeId: '' } }
      );
      logSuccess(`Removed storeId from ${result.modifiedCount} sales`);
    }
    
    // Delete all stores
    logStep(4, 'Deleting stores');
    if (isDryRun) {
      const count = await Store.countDocuments();
      log(`  [DRY RUN] Would delete ${count} stores`);
    } else {
      const result = await Store.deleteMany({});
      logSuccess(`Deleted ${result.deletedCount} stores`);
    }
    
    log('\n' + '='.repeat(60), colors.bright);
    log('ROLLBACK COMPLETE', colors.green);
    log('='.repeat(60) + '\n', colors.bright);
  } catch (error) {
    logError(`Rollback failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

async function runMigration() {
  log('\n' + '='.repeat(60), colors.bright);
  log('Multi-Tenant Migration Script', colors.bright);
  log('='.repeat(60) + '\n', colors.bright);
  
  if (isDryRun) {
    logWarning('DRY RUN MODE - No changes will be made\n');
  }
  
  if (isRollback) {
    logWarning('ROLLBACK MODE - Migration will be reverted\n');
  }
  
  try {
    await connectDB();
    
    if (isRollback) {
      await rollbackMigration();
    } else {
      // Step 1: Create default store
      const defaultStore = await createDefaultStore();
      const storeId = defaultStore._id;
      
      // Step 2: Migrate users
      const userResults = await migrateUsers(storeId);
      
      // Step 3: Migrate products
      const productResults = await migrateProducts(storeId);
      
      // Step 4: Migrate sales
      const saleResults = await migrateSales(storeId);
      
      // Step 5: Create indexes
      await createIndexes();
      
      // Step 6: Verify migration
      const verificationResults = await verifyMigration(storeId);
      
      // Step 7: Verify referential integrity
      const integrityResults = await verifyReferentialIntegrity(storeId);
      
      // Summary
      log('\n' + '='.repeat(60), colors.bright);
      log('MIGRATION SUMMARY', colors.bright);
      log('='.repeat(60), colors.bright);
      log(`Store ID: ${storeId}`);
      log(`Users migrated: ${userResults.migrated}`);
      log(`Products migrated: ${productResults.migrated}`);
      log(`Sales migrated: ${saleResults.migrated}`);
      log(`Migration complete: ${verificationResults.isComplete ? 'YES' : 'NO'}`);
      log(`Referential integrity: ${integrityResults.isValid ? 'VALID' : 'INVALID'}`);
      log('='.repeat(60) + '\n', colors.bright);
      
      if (verificationResults.isComplete && integrityResults.isValid) {
        logSuccess('Migration completed successfully!');
      } else {
        logWarning('Migration completed with warnings. Please review the output above.');
      }
      
      if (isDryRun) {
        log('\nThis was a dry run. Run without --dry-run to apply changes.', colors.yellow);
      }
    }
    
    await disconnectDB();
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    console.error(error);
    await disconnectDB();
    process.exit(1);
  }
}

// Run the migration
runMigration();
