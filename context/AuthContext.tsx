import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

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

  // Login function - now uses backend API
  const login = async (pin: string, userRole: 'admin' | 'staff'): Promise<boolean> => {
    try {
      // Try backend API first
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          pin,
          role: userRole
        }, {
          timeout: 5000 // 5 second timeout
        });

        if (response.data.success) {
          const { user: userData, sessionToken } = response.data.data;

          // Store auth data including store information
          await AsyncStorage.multiSet([
            ['auth_session_token', sessionToken],
            ['auth_user_role', userData.role],
            ['auth_user_id', userData.id],
            ['auth_user_name', userData.name],
            ['auth_last_login', Date.now().toString()],
            ['auth_store_id', userData.storeId || ''],
            ['auth_store_name', userData.storeName || ''],
          ]);

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

          return true;
        }
      } catch (apiError: any) {
        // If API fails (network error, timeout, or 401), fall back to local storage
        console.log('API login failed, using local storage authentication');
        console.log('API Error:', apiError.message);
        console.log('API URL:', `${API_URL}/auth/login`);
        console.log('Is backend running at this URL?');
        
        let isValid = false;
        let userId = '';
        let userName = '';

        if (userRole === 'admin') {
          // Validate admin PIN
          const storedPin = await AsyncStorage.getItem('admin_pin');
          if (pin === storedPin) {
            isValid = true;
            userId = 'admin_001';
            const storedName = await AsyncStorage.getItem('auth_user_name');
            userName = storedName || 'Admin';
          }
        } else if (userRole === 'staff') {
          // Validate staff PIN
          const staffPin = await AsyncStorage.getItem('auth_staff_pin');
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
            text2: `Logged in as ${userName}`,
          });

          return true;
        }
      }

      Toast.show({
        type: 'error',
        text1: 'Access Denied',
        text2: 'Incorrect PIN',
      });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: 'An error occurred',
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
