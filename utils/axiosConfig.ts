import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// CRITICAL: Set aggressive timeouts for mobile networks (especially iOS)
axios.defaults.timeout = 15000; // 15 seconds max wait
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['User-Agent'] = 'InventiEase-Mobile/1.0';

// Add retry configuration for network errors
axios.defaults.retry = 2;
axios.defaults.retryDelay = 1000;

// Configure axios to automatically add auth token to all requests
axios.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_session_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`🔐 [AUTH] Token added to ${config.method?.toUpperCase()} ${config.url}`);
      } else {
        console.warn(`⚠️ [AUTH] No token found for ${config.method?.toUpperCase()} ${config.url}`);
        console.warn(`   This request will likely return 401 Unauthorized`);
      }
      
      // Add request timestamp for debugging slow requests
      config.metadata = { startTime: new Date().getTime() };
      
      // Log request details (simplified for production)
      console.log(`📤 [REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
    } catch (error) {
      console.error('❌ [AUTH ERROR] Error getting auth token:', error);
      // Don't fail the request if we can't get the token
    }
    return config;
  },
  (error) => {
    console.error('❌ [REQUEST INTERCEPTOR ERROR]', error);
    return Promise.reject(error);
  }
);

// Handle responses and errors globally with comprehensive error handling
axios.interceptors.response.use(
  (response) => {
    // Log response details
    const duration = response.config.metadata 
      ? new Date().getTime() - response.config.metadata.startTime 
      : 0;
    
    const url = response.config.url || 'unknown';
    console.log(`✅ [${response.status}] ${url} (${duration}ms)`);
    
    // Log slow requests (over 3 seconds)
    if (duration > 3000) {
      console.warn(`⚠️ [SLOW] ${url} took ${duration}ms`);
    }
    
    return response;
  },
  async (error) => {
    // Comprehensive error handling to prevent crashes
    try {
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          console.error(`🔒 [401 UNAUTHORIZED] ${method} ${url}`);
          console.error(`   Authentication failed - token may be missing or invalid`);
          console.error(`   Error: ${data?.error || data?.message || 'Unauthorized'}`);
        } else if (status === 403) {
          console.error(`🚫 [403 FORBIDDEN] ${method} ${url}`);
          console.error(`   Access denied - insufficient permissions`);
        } else if (status === 404) {
          console.log(`🔍 [404 NOT FOUND] ${method} ${url}`);
        } else if (status === 400) {
          console.log(`⚠️ [400 BAD REQUEST] ${method} ${url} - ${data?.error || data?.message || 'Bad request'}`);
        } else if (status >= 500) {
          console.error(`💥 [${status} SERVER ERROR] ${method} ${url}`);
        } else {
          console.log(`⚠️ [${status}] ${method} ${url}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        console.error(`⏱️ [TIMEOUT] ${method} ${url} - Server took too long to respond`);
      } else if (error.code === 'ERR_NETWORK') {
        console.error(`🌐 [NETWORK ERROR] ${method} ${url}`);
        console.error(`   Check internet connection or server availability`);
      } else if (!error.response) {
        console.error(`📡 [NO RESPONSE] ${method} ${url} - Server didn't respond`);
      } else {
        console.error(`❓ [UNEXPECTED ERROR] ${method} ${url}:`, error.message);
      }
    } catch (loggingError) {
      // Even error logging shouldn't crash the app
      console.error('💀 [LOGGING ERROR] Error in error handler:', loggingError);
    }
    
    return Promise.reject(error);
  }
);

export default axios;
