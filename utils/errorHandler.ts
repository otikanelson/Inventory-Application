import Toast from 'react-native-toast-message';

/**
 * Centralized error handling utility
 * Extracts user-friendly error messages and displays them via Toast
 * Prevents raw error objects from being shown to users
 */

interface ErrorResponse {
  response?: {
    data?: {
      error?: string;
      message?: string;
      details?: string;
    };
    status?: number;
  };
  code?: string;
  message?: string;
}

/**
 * Extract a user-friendly error message from an error object
 */
export function getErrorMessage(error: any): string {
  // Handle axios errors
  if (error.response) {
    const data = error.response.data;
    const status = error.response.status;
    
    // Extract error message from response
    const errorMsg = data?.error || data?.message || data?.details;
    
    if (errorMsg) {
      return errorMsg;
    }
    
    // Fallback messages based on status code
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'Access denied. You don\'t have permission.';
      case 404:
        return 'Resource not found.';
      case 409:
        return 'Conflict. This item may already exist.';
      case 422:
        return 'Validation error. Please check your input.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `Request failed with status ${status}`;
    }
  }
  
  // Handle network errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please check your connection.';
  }
  
  if (error.code === 'ERR_NETWORK') {
    return 'Network error. Please check your internet connection.';
  }
  
  // Handle generic errors
  if (error.message) {
    // Don't show technical error messages to users
    if (error.message.includes('Network request failed')) {
      return 'Connection failed. Please check your internet.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }
    // For other messages, return as-is if they seem user-friendly
    if (error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }
  }
  
  // Ultimate fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Show an error toast with a user-friendly message
 */
export function showErrorToast(error: any, title: string = 'Error') {
  const message = getErrorMessage(error);
  
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: 4000,
    position: 'top',
  });
}

/**
 * Show a success toast
 */
export function showSuccessToast(title: string, message?: string) {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    position: 'top',
  });
}

/**
 * Show an info toast
 */
export function showInfoToast(title: string, message?: string) {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    visibilityTime: 3000,
    position: 'top',
  });
}

/**
 * Wrap an async function with error handling
 * Automatically shows error toast if the function throws
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorTitle: string = 'Error'
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.error(`[${errorTitle}]`, error);
      showErrorToast(error, errorTitle);
      throw error; // Re-throw so caller can handle if needed
    }
  }) as T;
}
