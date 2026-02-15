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
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses globally and log slow requests
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
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Authentication failed - token may be invalid');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - server took too long to respond');
    } else if (!error.response) {
      console.error('Network error - check internet connection');
    }
    return Promise.reject(error);
  }
);

export default axios;
