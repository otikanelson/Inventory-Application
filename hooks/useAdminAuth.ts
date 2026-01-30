import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

/**
 * Custom hook for admin authentication management
 * Handles PIN setup, validation, and first-time setup flow
 */
export const useAdminAuth = () => {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [requirePinForDelete, setRequirePinForDelete] = useState(true);
  const [autoLogoutTime, setAutoLogoutTime] = useState(30); // in minutes

  useEffect(() => {
    checkPinStatus();
    loadSettings();
  }, []);

  /**
   * Check if admin PIN has been set
   */
  const checkPinStatus = async () => {
    try {
      const pin = await AsyncStorage.getItem('admin_pin');
      const firstTimeFlag = await AsyncStorage.getItem('admin_first_setup');
      
      if (!pin && firstTimeFlag !== 'completed') {
        setIsFirstTime(true);
        setHasPin(false);
      } else {
        setIsFirstTime(false);
        setHasPin(!!pin);
      }
    } catch (error) {
      console.error('Error checking PIN status:', error);
      setHasPin(false);
    }
  };

  /**
   * Load admin settings from storage
   */
  const loadSettings = async () => {
    try {
      const pinRequired = await AsyncStorage.getItem('admin_require_pin_delete');
      const logoutTime = await AsyncStorage.getItem('admin_auto_logout_time');
      
      if (pinRequired !== null) {
        setRequirePinForDelete(pinRequired === 'true');
      }
      if (logoutTime !== null) {
        setAutoLogoutTime(parseInt(logoutTime));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  /**
   * Set up initial admin PIN (first-time setup)
   */
  const setupFirstTimePin = async (pin: string, confirmPin: string): Promise<boolean> => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid PIN',
        text2: 'PIN must be exactly 4 digits'
      });
      return false;
    }

    if (pin !== confirmPin) {
      Toast.show({
        type: 'error',
        text1: 'PIN Mismatch',
        text2: 'PINs do not match'
      });
      return false;
    }

    try {
      await AsyncStorage.setItem('admin_pin', pin);
      await AsyncStorage.setItem('admin_first_setup', 'completed');
      setHasPin(true);
      setIsFirstTime(false);
      
      Toast.show({
        type: 'success',
        text1: 'PIN Created',
        text2: 'Admin PIN has been set successfully'
      });
      
      return true;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Setup Failed',
        text2: 'Could not save PIN'
      });
      return false;
    }
  };

  /**
   * Validate admin PIN
   */
  const validatePin = async (inputPin: string): Promise<boolean> => {
    try {
      const storedPin = await AsyncStorage.getItem('admin_pin');
      
      if (!storedPin) {
        Toast.show({
          type: 'error',
          text1: 'PIN Not Set',
          text2: 'Please set up admin PIN in settings first'
        });
        return false;
      }

      if (inputPin === storedPin) {
        // Update last auth time for session management
        await AsyncStorage.setItem('admin_last_auth', Date.now().toString());
        return true;
      } else {
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: 'Incorrect PIN'
        });
        return false;
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Authentication Error',
        text2: 'Could not verify PIN'
      });
      return false;
    }
  };

  /**
   * Update admin PIN (requires old PIN verification)
   */
  const updatePin = async (oldPin: string, newPin: string, confirmPin: string): Promise<boolean> => {
    try {
      const storedPin = await AsyncStorage.getItem('admin_pin');
      
      if (oldPin !== storedPin) {
        Toast.show({
          type: 'error',
          text1: 'Authentication Failed',
          text2: 'Current PIN is incorrect'
        });
        return false;
      }

      if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid PIN',
          text2: 'PIN must be exactly 4 digits'
        });
        return false;
      }

      if (newPin !== confirmPin) {
        Toast.show({
          type: 'error',
          text1: 'PIN Mismatch',
          text2: 'New PIN and confirmation do not match'
        });
        return false;
      }

      await AsyncStorage.setItem('admin_pin', newPin);
      
      Toast.show({
        type: 'success',
        text1: 'PIN Updated',
        text2: 'Admin PIN has been changed successfully'
      });

      return true;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not update PIN'
      });
      return false;
    }
  };

  /**
   * Check if session is still valid (for auto-logout)
   */
  const isSessionValid = async (): Promise<boolean> => {
    try {
      const lastAuth = await AsyncStorage.getItem('admin_last_auth');
      if (!lastAuth) return false;

      const elapsed = Date.now() - parseInt(lastAuth);
      const timeoutMs = autoLogoutTime * 60 * 1000;

      return elapsed < timeoutMs;
    } catch (error) {
      return false;
    }
  };

  /**
   * Update require PIN for delete setting
   */
  const updateRequirePinForDelete = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('admin_require_pin_delete', value.toString());
      setRequirePinForDelete(value);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  /**
   * Update auto-logout time setting
   */
  const updateAutoLogoutTime = async (minutes: number) => {
    try {
      await AsyncStorage.setItem('admin_auto_logout_time', minutes.toString());
      setAutoLogoutTime(minutes);
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  /**
   * Logout admin (clear session)
   */
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('admin_last_auth');
      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'Admin session ended'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Could not end session'
      });
    }
  };

  return {
    hasPin,
    isFirstTime,
    requirePinForDelete,
    autoLogoutTime,
    setupFirstTimePin,
    validatePin,
    updatePin,
    isSessionValid,
    updateRequirePinForDelete,
    updateAutoLogoutTime,
    logout,
    refreshStatus: checkPinStatus,
  };
};