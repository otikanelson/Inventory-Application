/**
 * Utility functions for sanitizing sensitive information in connection strings and reports
 */

/**
 * Sanitize a MongoDB connection string by masking the password
 * @param {string} connectionString - The MongoDB connection string
 * @returns {string} - Sanitized connection string with password masked
 */
function sanitizeConnectionString(connectionString) {
  if (!connectionString) return '';
  
  // Replace password in connection string with ****
  return connectionString.replace(/:([^@:]+)@/, ':****@');
}

/**
 * Sanitize credentials object by masking password
 * @param {Object} credentials - Credentials object with username and password
 * @returns {Object} - Sanitized credentials with password masked
 */
function sanitizeCredentials(credentials) {
  if (!credentials) return null;
  
  return {
    username: credentials.username || null,
    password: credentials.password ? '****' : null
  };
}

module.exports = {
  sanitizeConnectionString,
  sanitizeCredentials
};
