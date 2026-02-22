import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

/**
 * Checks if the Admin Security PIN is set
 * Checks local storage first, then queries backend if needed
 * @returns Promise<boolean> - true if PIN is set, false otherwise
 */
export const hasSecurityPIN = async (): Promise<boolean> => {
  try {
    // First check local storage (works for admin users who have logged in)
    const localPin = await AsyncStorage.getItem('admin_security_pin');
    console.log('🔍 hasSecurityPIN - Local PIN check:', localPin ? `Found (${localPin.length} chars)` : 'Not found');
    
    if (localPin !== null && localPin.length === 4) {
      console.log('✅ hasSecurityPIN - Local PIN valid, returning true');
      return true;
    }

    // If not in local storage, query backend for ALL users (admin and staff)
    const storeId = await AsyncStorage.getItem('auth_store_id');
    console.log('🔍 hasSecurityPIN - Store ID:', storeId);
    
    if (storeId) {
      try {
        console.log('🌐 hasSecurityPIN - Querying backend...');
        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/auth/check-admin-security-pin/${storeId}`
        );
        
        console.log('📥 hasSecurityPIN - Backend response:', response.data);
        
        if (response.data.success && response.data.data.hasSecurityPin) {
          // Cache the security PIN locally
          if (response.data.data.securityPin) {
            await AsyncStorage.setItem('admin_security_pin', response.data.data.securityPin);
            console.log('💾 hasSecurityPIN - Cached PIN locally');
          }
          console.log('✅ hasSecurityPIN - Backend confirms PIN exists, returning true');
          return true;
        } else {
          console.log('❌ hasSecurityPIN - Backend says no PIN set');
        }
      } catch (error) {
        console.error('❌ hasSecurityPIN - Error checking admin security PIN from backend:', error);
        // If backend fails, assume PIN is not set to be safe
        return false;
      }
    }

    console.log('❌ hasSecurityPIN - No PIN found, returning false');
    return false;
  } catch (error) {
    console.error('❌ hasSecurityPIN - Error checking security PIN:', error);
    return false;
  }
};
