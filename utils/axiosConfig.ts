import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// CRITICAL: Set aggressive timeouts for mobile networks (especially iOS)
axios.defaults.timeout = 15000; // 15 seconds max wait
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Configure axios to automatically add auth token to all requests
axios.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_session_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log(`🔐 [REQUEST] Adding auth token to ${config.url}`);
      } else {
        console.log(`📭 [REQUEST] No auth token for ${config.url}`);
      }
      
      // Add request timestamp for debugging slow requests
      config.metadata = { startTime: new Date().getTime() };
      
      // Log full request details
      console.log(`📤 [REQUEST] ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log(`📦 [REQUEST BODY]`, JSON.stringify(config.data, null, 2));
      }
    } catch (error) {
      console.error('❌ [REQUEST ERROR] Error getting auth token:', error);
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
    
    console.log(`✅ [RESPONSE] ${response.config.url} - Status: ${response.status} - Duration: ${duration}ms`);
    
    if (response.data) {
      console.log(`📥 [RESPONSE DATA]`, JSON.stringify(response.data, null, 2));
    }
    
    // Log slow requests (over 3 seconds)
    if (duration > 3000) {
      console.warn(`⚠️ [SLOW REQUEST] ${response.config.url} took ${duration}ms`);
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
        
        console.error(`❌ [${status}] ${method} ${url}`);
        console.error(`📥 [ERROR RESPONSE]`, JSON.stringify(data, null, 2));
        
        // Don't log 400 errors (validation errors like duplicate PIN, invalid input)
        // These are expected user errors, not system errors
        if (status === 400) {
          console.log(`⚠️ [VALIDATION ERROR] ${url} - ${data?.error || data?.message || 'Bad request'}`);
        } else if (status === 401) {
          console.log(`🔒 [AUTH ERROR] ${url} - Authentication failed, token may be invalid`);
        } else if (status === 403) {
          console.log(`🚫 [FORBIDDEN] ${url} - Access denied, insufficient permissions`);
        } else if (status === 404) {
          console.log(`🔍 [NOT FOUND] ${url} - Resource not found`);
        } else if (status >= 500) {
          console.error(`💥 [SERVER ERROR] ${status} for ${url}`);
        } else {
          console.log(`⚠️ [HTTP ${status}] ${url}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        console.error(`⏱️ [TIMEOUT] ${url} - Server took too long to respond (>15s)`);
      } else if (error.code === 'ERR_NETWORK') {
        console.error(`🌐 [NETWORK ERROR] ${url} - Check internet connection or server availability`);
        console.error(`🔍 [DEBUG] Error details:`, {
          code: error.code,
          message: error.message,
          url: url,
        });
      } else if (!error.response) {
        console.error(`📡 [NO RESPONSE] ${url} - Server didn't respond`);
        console.error(`🔍 [DEBUG] Error details:`, {
          code: error.code,
          message: error.message,
          url: url,
        });
      } else {
        console.error(`❓ [UNEXPECTED ERROR] ${url}:`, error.message);
      }
    } catch (loggingError) {
      // Even error logging shouldn't crash the app
      console.error('💀 [LOGGING ERROR] Error in error handler:', loggingError);
    }
    
    return Promise.reject(error);
  }
);

export default axios;
