import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Checks if the Admin Security PIN is set
 * @returns Promise<boolean> - true if PIN is set, false otherwise
 */
export const hasSecurityPIN = async (): Promise<boolean> => {
  try {
    const pin = await AsyncStorage.getItem('admin_security_pin');
    return pin !== null && pin.length === 4;
  } catch (error) {
    console.error('Error checking security PIN:', error);
    return false;
  }
};
