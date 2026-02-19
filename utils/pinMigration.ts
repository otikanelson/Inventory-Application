/**
 * PIN Migration Utility
 * 
 * Migrates the old 'admin_pin' AsyncStorage key to the new 'admin_login_pin' and 'admin_security_pin' keys.
 * This ensures backward compatibility when updating from the old PIN system to the new dual-PIN system.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface MigrationResult {
  success: boolean;
  migrated: boolean;
  message: string;
  details?: {
    oldPinFound: boolean;
    loginPinCreated: boolean;
    securityPinCreated: boolean;
  };
}

/**
 * Migrates old admin_pin to new admin_login_pin and admin_security_pin
 * 
 * @returns Promise<MigrationResult> - Result of the migration operation
 */
export async function migrateAdminPins(): Promise<MigrationResult> {
  try {
    console.log('🔄 Starting PIN migration...');

    // Check if migration has already been completed
    const migrationCompleted = await AsyncStorage.getItem('pin_migration_completed');
    if (migrationCompleted === 'true') {
      console.log('✅ Migration already completed, skipping');
      return {
        success: true,
        migrated: false,
        message: 'Migration already completed'
      };
    }

    // Check if old admin_pin exists
    const oldPin = await AsyncStorage.getItem('admin_pin');
    
    if (!oldPin) {
      console.log('ℹ️  No old admin_pin found, marking migration as complete');
      await AsyncStorage.setItem('pin_migration_completed', 'true');
      return {
        success: true,
        migrated: false,
        message: 'No old PIN found to migrate',
        details: {
          oldPinFound: false,
          loginPinCreated: false,
          securityPinCreated: false
        }
      };
    }

    console.log('📌 Old admin_pin found, starting migration...');

    // Check if new PINs already exist
    const existingLoginPin = await AsyncStorage.getItem('admin_login_pin');
    const existingSecurityPin = await AsyncStorage.getItem('admin_security_pin');

    let loginPinCreated = false;
    let securityPinCreated = false;

    // Migrate to admin_login_pin if it doesn't exist
    if (!existingLoginPin) {
      await AsyncStorage.setItem('admin_login_pin', oldPin);
      loginPinCreated = true;
      console.log('✅ Created admin_login_pin from old PIN');
    } else {
      console.log('ℹ️  admin_login_pin already exists, skipping');
    }

    // Migrate to admin_security_pin if it doesn't exist
    if (!existingSecurityPin) {
      await AsyncStorage.setItem('admin_security_pin', oldPin);
      securityPinCreated = true;
      console.log('✅ Created admin_security_pin from old PIN');
    } else {
      console.log('ℹ️  admin_security_pin already exists, skipping');
    }

    // Mark migration as completed
    await AsyncStorage.setItem('pin_migration_completed', 'true');
    await AsyncStorage.setItem('pin_migration_timestamp', Date.now().toString());

    console.log('✅ PIN migration completed successfully');

    return {
      success: true,
      migrated: true,
      message: 'PIN migration completed successfully',
      details: {
        oldPinFound: true,
        loginPinCreated,
        securityPinCreated
      }
    };

  } catch (error) {
    console.error('❌ PIN migration failed:', error);
    return {
      success: false,
      migrated: false,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Resets the migration flag (for testing purposes)
 */
export async function resetMigration(): Promise<void> {
  try {
    await AsyncStorage.removeItem('pin_migration_completed');
    await AsyncStorage.removeItem('pin_migration_timestamp');
    console.log('✅ Migration flag reset');
  } catch (error) {
    console.error('❌ Failed to reset migration flag:', error);
  }
}

/**
 * Gets the migration status
 */
export async function getMigrationStatus(): Promise<{
  completed: boolean;
  timestamp: number | null;
}> {
  try {
    const completed = await AsyncStorage.getItem('pin_migration_completed');
    const timestamp = await AsyncStorage.getItem('pin_migration_timestamp');

    return {
      completed: completed === 'true',
      timestamp: timestamp ? parseInt(timestamp) : null
    };
  } catch (error) {
    console.error('❌ Failed to get migration status:', error);
    return {
      completed: false,
      timestamp: null
    };
  }
}
