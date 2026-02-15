import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Configure axios to automatically add auth token to all requests
axios.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_session_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses globally
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - could trigger logout here
      console.log('Authentication failed - token may be invalid');
    }
    return Promise.reject(error);
  }
);

export default axios;
