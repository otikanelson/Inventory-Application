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
      }
      
      // Add request timestamp for debugging slow requests
      config.metadata = { startTime: new Date().getTime() };
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Don't fail the request if we can't get the token
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle responses and errors globally with comprehensive error handling
axios.interceptors.response.use(
  (response) => {
    // Log slow requests (over 3 seconds)
    if (response.config.metadata) {
      const duration = new Date().getTime() - response.config.metadata.startTime;
      if (duration > 3000) {
        console.warn(`Slow request: ${response.config.url} took ${duration}ms`);
      }
    }
    return response;
  },
  async (error) => {
    // Comprehensive error handling to prevent crashes
    try {
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const url = error.config?.url || 'unknown';
        
        // Don't log 400 errors (validation errors like duplicate PIN, invalid input)
        // These are expected user errors, not system errors
        if (status === 400) {
          // Silently pass through - the calling code will handle the error message
        } else if (status === 401) {
          console.log(`Authentication failed for ${url} - token may be invalid`);
        } else if (status === 403) {
          console.log(`Access forbidden for ${url} - insufficient permissions`);
        } else if (status === 404) {
          console.log(`Resource not found: ${url}`);
        } else if (status >= 500) {
          console.error(`Server error (${status}) for ${url}`);
        } else {
          console.log(`Request failed with status ${status} for ${url}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        console.error(`Request timeout for ${error.config?.url || 'unknown'} - server took too long to respond`);
      } else if (error.code === 'ERR_NETWORK') {
        console.error(`Network error for ${error.config?.url || 'unknown'} - check internet connection`);
      } else if (!error.response) {
        console.error(`Network error for ${error.config?.url || 'unknown'} - no response from server`);
      } else {
        console.error(`Unexpected error for ${error.config?.url || 'unknown'}:`, error.message);
      }
    } catch (loggingError) {
      // Even error logging shouldn't crash the app
      console.error('Error in error handler:', loggingError);
    }
    
    return Promise.reject(error);
  }
);

export default axios;
