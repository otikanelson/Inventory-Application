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
      }
      
      // Add request timestamp for debugging slow requests
      config.metadata = { startTime: new Date().getTime() };
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors globally with comprehensive error handling
axios.interceptors.response.use(
  (response) => {
    // Silently track response times for slow request warnings
    const duration = response.config.metadata 
      ? new Date().getTime() - response.config.metadata.startTime 
      : 0;
    
    // Only log slow requests (over 3 seconds)
    if (duration > 3000) {
      console.warn(`Slow request: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  async (error) => {
    // Comprehensive error handling to prevent crashes
    try {
      const url = error.config?.url || 'unknown';
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // Only log critical errors
        if (status === 401) {
          console.error(`[401] ${method} ${url} - Authentication failed`);
        } else if (status === 403) {
          console.error(`[403] ${method} ${url} - Access denied`);
        } else if (status >= 500) {
          console.error(`[${status}] ${method} ${url} - Server error`);
        }
        // Don't log 404s or 400s - they're often expected
      } else if (error.code === 'ECONNABORTED') {
        console.error(`[TIMEOUT] ${method} ${url}`);
      } else if (error.code === 'ERR_NETWORK') {
        console.error(`[NETWORK ERROR] ${method} ${url}`);
      }
    } catch (loggingError) {
      // Silently fail on logging errors
    }
    
    return Promise.reject(error);
  }
);

export default axios;
