import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { API_URL } from '../config/api';
import axios from '../utils/axiosConfig';
import { migrateAdminPins } from '../utils/pinMigration';

type UserRole = 'admin' | 'staff' | 'viewer' | null;

interface User {
  id: string;
  name: string;
  role: UserRole;
  storeId?: string;
  storeName?: string;
  isAuthor?: boolean;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  login: (pin: string, userRole: 'admin' | 'staff') => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (action: string) => boolean;
  checkAuth: () => Promise<void>;
  updateSession: () => Promise<void>;
  verifySecurityPIN: (pin: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  // Check authentication status on app load
  const checkAuth = async () => {
    try {
      // Run PIN migration before checking auth
      await migrateAdminPins();

      const [userRole, userId, userName, sessionToken, lastLogin, storeId, storeName] = await AsyncStorage.multiGet([
        'auth_user_role',
        'auth_user_id',
        'auth_user_name',
        'auth_session_token',
        'auth_last_login',
        'auth_store_id',
        'auth_store_name',
      ]);

      const roleValue = userRole[1] as UserRole;
      const idValue = userId[1];
      const nameValue = userName[1];
      const tokenValue = sessionToken[1];
      const lastLoginValue = lastLogin[1];
      const storeIdValue = storeId[1];
      const storeNameValue = storeName[1];

      if (roleValue && idValue && tokenValue) {
        // Check if session is still valid (30 minutes)
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes in ms
        const lastLoginTime = lastLoginValue ? parseInt(lastLoginValue) : 0;
        const elapsed = Date.now() - lastLoginTime;

        if (elapsed < sessionTimeout) {
          setUser({
            id: idValue,
            name: nameValue || 'User',
            role: roleValue,
            storeId: storeIdValue || undefined,
            storeName: storeNameValue || undefined,
            isAuthor: roleValue === 'admin' && idValue === 'author',
          });
          setRole(roleValue);
          setIsAuthenticated(true);
        } else {
          // Session expired
          await logout();
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update session timestamp (call this on user activity)
  const updateSession = async () => {
    try {
      await AsyncStorage.setItem('auth_last_login', Date.now().toString());
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Login function - now uses backend API with comprehensive error handling
  const login = async (pin: string, userRole: 'admin' | 'staff'): Promise<boolean> => {
    try {
      console.log('🔐 === LOGIN ATTEMPT START ===');
      console.log('🌐 API_URL:', API_URL);
      console.log('📍 Full endpoint:', `${API_URL}/auth/login`);
      console.log('🔢 PIN:', pin);
      console.log('👤 Role:', userRole);
      console.log('⏰ Timestamp:', new Date().toISOString());
      
      // Try backend API first
      try {
        console.log('📤 Sending login request to backend...');
        const response = await axios.post(`${API_URL}/auth/login`, {
          pin,
          role: userRole
        }, {
          timeout: 15000 // Increased to 15 second timeout to match global timeout
        });

        console.log('✅ Login response received!');
        console.log('📊 Response status:', response.status);
        console.log('✔️ Response success:', response.data.success);
        console.log('📦 Response data:', JSON.stringify(response.data, null, 2));

        if (response.data.success) {
          const { user: userData, sessionToken } = response.data.data;
          
          console.log('💾 Storing auth data in AsyncStorage...');
          console.log('👤 User data:', JSON.stringify(userData, null, 2));

          // Prepare storage items
          const storageItems: [string, string][] = [
            ['auth_session_token', sessionToken],
            ['auth_user_role', userData.role],
            ['auth_user_id', userData.id],
            ['auth_user_name', userData.name],
            ['auth_last_login', Date.now().toString()],
            ['auth_store_id', userData.storeId || ''],
            ['auth_store_name', userData.storeName || ''],
          ];

          // Store Security PIN for admin users if provided
          if (userData.role === 'admin' && userData.securityPin) {
            storageItems.push(['admin_security_pin', userData.securityPin]);
            console.log('🔐 Storing admin Security PIN');
          }

          // Store auth data including store information
          await AsyncStorage.multiSet(storageItems);

          console.log('✅ Auth data stored successfully');

          setUser({
            ...userData,
            isAuthor: userData.role === 'admin' && userData.id === 'author',
          });
          setRole(userData.role);
          setIsAuthenticated(true);

          Toast.show({
            type: 'success',
            text1: 'Welcome Back!',
            text2: `Logged in as ${userData.name}`,
          });

          console.log('🎉 LOGIN SUCCESS - User authenticated');
          return true;
        } else {
          // Backend returned unsuccessful response
          console.error('❌ Backend returned unsuccessful response');
          throw new Error(response.data.error || 'Login failed');
        }
      } catch (apiError: any) {
        // Comprehensive error handling for different failure types
        console.error('💥 API ERROR CAUGHT');
        console.error('🔍 Error type:', apiError.constructor.name);
        console.error('🔍 Error code:', apiError.code);
        console.error('🔍 Error message:', apiError.message);
        console.error('🔍 Full error object:', JSON.stringify(apiError, Object.getOwnPropertyNames(apiError), 2));
        
        // Log request config if available
        if (apiError.config) {
          console.error('🔍 Request config:', {
            url: apiError.config.url,
            method: apiError.config.method,
            headers: apiError.config.headers,
            timeout: apiError.config.timeout
          });
        }
        
        let errorMessage = 'Could not connect to server';
        let shouldFallbackToLocal = false;

        if (apiError.response) {
          // Server responded with error status
          const status = apiError.response.status;
          const serverError = apiError.response.data?.error;
          
          console.error(`📡 Server responded with status: ${status}`);
          console.error(`📡 Server error message:`, serverError);

          if (status === 401) {
            // Invalid credentials - don't fallback to local
            errorMessage = serverError || 'Invalid PIN';
            console.log('🔒 Invalid credentials - no fallback');
          } else if (status === 404) {
            // User not found - try local storage
            errorMessage = 'User not found';
            shouldFallbackToLocal = true;
            console.log('🔍 User not found on server, trying local storage');
          } else if (status >= 500) {
            // Server error - try local storage
            errorMessage = 'Server error, using offline mode';
            shouldFallbackToLocal = true;
            console.log('💥 Server error, falling back to local storage');
          } else {
            errorMessage = serverError || 'Login failed';
            shouldFallbackToLocal = true;
            console.log(`⚠️ Status ${status}, falling back to local storage`);
          }
        } else if (apiError.code === 'ECONNABORTED') {
          // Timeout - try local storage
          errorMessage = 'Connection timeout, using offline mode';
          shouldFallbackToLocal = true;
          console.log('⏱️ Request timeout, falling back to local storage');
        } else if (apiError.code === 'ERR_NETWORK' || !apiError.response) {
          // Network error - try local storage
          errorMessage = 'Network error, using offline mode';
          shouldFallbackToLocal = true;
          console.log('🌐 Network error, falling back to local storage');
        } else {
          // Unknown error - try local storage
          errorMessage = apiError.message || 'Unknown error occurred';
          shouldFallbackToLocal = true;
          console.log('❓ Unknown error:', apiError.message);
        }

        // Fallback to local storage if appropriate
        if (shouldFallbackToLocal) {
          console.log('💾 Attempting local storage authentication...');
          console.log('Attempting local storage authentication');
          
          let isValid = false;
          let userId = '';
          let userName = '';

          try {
            if (userRole === 'admin') {
              // Validate admin Login PIN
              const storedLoginPin = await AsyncStorage.getItem('admin_login_pin');
              if (pin === storedLoginPin) {
                isValid = true;
                userId = 'admin_001';
                const storedName = await AsyncStorage.getItem('auth_user_name');
                userName = storedName || 'Admin';
              }
            } else if (userRole === 'staff') {
              // Validate staff PIN
              const staffPin = await AsyncStorage.getItem('staff_login_pin');
              const staffId = await AsyncStorage.getItem('auth_staff_id');
              const staffName = await AsyncStorage.getItem('auth_staff_name');
              
              if (pin === staffPin && staffId) {
                isValid = true;
                userId = staffId;
                userName = staffName || 'Staff';
              }
            }

            if (isValid) {
              // Generate session token
              const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              
              // Get store info if available
              const storeId = await AsyncStorage.getItem('auth_store_id');
              const storeName = await AsyncStorage.getItem('auth_store_name');
              
              // Store auth data
              await AsyncStorage.multiSet([
                ['auth_session_token', sessionToken],
                ['auth_user_role', userRole],
                ['auth_user_id', userId],
                ['auth_user_name', userName],
                ['auth_last_login', Date.now().toString()],
              ]);

              setUser({ 
                id: userId, 
                name: userName, 
                role: userRole,
                storeId: storeId || undefined,
                storeName: storeName || undefined,
                isAuthor: false,
              });
              setRole(userRole);
              setIsAuthenticated(true);

              Toast.show({
                type: 'success',
                text1: 'Welcome Back!',
                text2: `Logged in as ${userName} (Offline)`,
              });

              return true;
            }
          } catch (localError) {
            console.error('Local storage authentication failed:', localError);
          }
        }

        // If we get here, authentication failed
        Toast.show({
          type: 'error',
          text1: 'Access Denied',
          text2: errorMessage,
        });
        return false;
      }
    } catch (error: any) {
      // Catch-all for any unexpected errors
      console.error('Unexpected login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'An unexpected error occurred',
      });
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'auth_session_token',
        'auth_last_login',
        'auth_user_role',
        'auth_user_id',
        'auth_user_name',
        'auth_store_id',
        'auth_store_name',
      ]);

      setUser(null);
      setRole(null);
      setIsAuthenticated(false);

      Toast.show({
        type: 'success',
        text1: 'Logged Out',
        text2: 'Session ended successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Could not end session',
      });
    }
  };

  // Check if user has permission for an action
  const hasPermission = (action: string): boolean => {
    const permissions: Record<string, string[]> = {
      admin: ['*'], // All permissions
      staff: ['view', 'add', 'edit', 'sell', 'scan'],
      viewer: ['view'],
    };

    if (!role) return false;
    
    const userPermissions = permissions[role] || [];
    return userPermissions.includes('*') || userPermissions.includes(action);
  };

  // Verify Security PIN for sensitive operations (product registration, deletion)
  const verifySecurityPIN = async (pin: string): Promise<boolean> => {
    try {
      if (!user) {
        console.error('No user logged in');
        return false;
      }

      // For admin users, verify against local admin_security_pin
      if (user.role === 'admin') {
        const storedSecurityPin = await AsyncStorage.getItem('admin_security_pin');
        if (pin === storedSecurityPin) {
          return true;
        } else {
          Toast.show({
            type: 'error',
            text1: 'Access Denied',
            text2: 'Incorrect Admin Security PIN',
          });
          return false;
        }
      }

      // For staff users, verify against admin's Security PIN via backend
      if (user.role === 'staff' && user.storeId) {
        try {
          const response = await axios.post(`${API_URL}/auth/verify-admin-security-pin`, {
            pin,
            storeId: user.storeId
          });

          if (response.data.success) {
            return true;
          } else {
            Toast.show({
              type: 'error',
              text1: 'Access Denied',
              text2: 'Incorrect Admin Security PIN',
            });
            return false;
          }
        } catch (error: any) {
          // Fallback to local storage if backend is unavailable
          console.log('Backend unavailable, trying local storage');
          const storedSecurityPin = await AsyncStorage.getItem('admin_security_pin');
          if (pin === storedSecurityPin) {
            return true;
          } else {
            Toast.show({
              type: 'error',
              text1: 'Access Denied',
              text2: 'Incorrect Admin Security PIN (Offline)',
            });
            return false;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error verifying Security PIN:', error);
      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: 'Could not verify Security PIN',
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        hasPermission,
        checkAuth,
        updateSession,
        verifySecurityPIN,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
