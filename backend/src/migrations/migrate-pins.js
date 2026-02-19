/**
 * Migration Script: PIN Field Migration
 * 
 * This script migrates the existing 'pin' field to the new 'loginPin' and 'securityPin' fields.
 * 
 * For all users:
 * - Copy 'pin' to 'loginPin'
 * 
 * For admin users:
 * - Copy 'pin' to both 'loginPin' and 'securityPin'
 * 
 * Usage: node backend/src/migrations/migrate-pins.js
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory';

async function migratePins() {
  try {
    console.log('🔄 Starting PIN migration...');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the User model without the new schema validation
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find all users that have 'pin' but not 'loginPin'
    const usersToMigrate = await usersCollection.find({
      pin: { $exists: true },
      loginPin: { $exists: false }
    }).toArray();

    console.log(`📊 Found ${usersToMigrate.length} users to migrate`);

    let migratedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const user of usersToMigrate) {
      try {
        const updateData = {
          loginPin: user.pin
        };

        // For admin users, also set securityPin
        if (user.role === 'admin') {
          updateData.securityPin = user.pin;
        }

        await usersCollection.updateOne(
          { _id: user._id },
          { $set: updateData }
        );

        migratedCount++;
        console.log(`✅ Migrated user: ${user.name} (${user.role}) - ID: ${user._id}`);
      } catch (error) {
        errorCount++;
        const errorMsg = `Failed to migrate user ${user._id}: ${error.message}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   Total users found: ${usersToMigrate.length}`);
    console.log(`   Successfully migrated: ${migratedCount}`);
    console.log(`   Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n✅ Migration completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePins()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { migratePins };
