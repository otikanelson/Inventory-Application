/**
 * MongoDB Connection String Validator
 * Parses and validates MongoDB connection strings
 */

function validateConnectionString(connectionString) {
  const result = {
    isValid: true,
    protocol: null,
    credentials: {
      username: null,
      password: false
    },
    hosts: [],
    database: null,
    options: {},
    errors: []
  };

  if (!connectionString || typeof connectionString !== 'string') {
    result.isValid = false;
    result.errors.push('Connection string is required and must be a string');
    return result;
  }

  try {
    // 1. Validate and extract protocol
    if (connectionString.startsWith('mongodb+srv://')) {
      result.protocol = 'mongodb+srv';
    } else if (connectionString.startsWith('mongodb://')) {
      result.protocol = 'mongodb';
    } else {
      result.isValid = false;
      result.errors.push('Invalid protocol. Must be "mongodb://" or "mongodb+srv://"');
      return result;
    }

    // Remove protocol for further parsing
    let remaining = connectionString.substring(result.protocol === 'mongodb+srv' ? 14 : 10);

    // 2. Extract credentials if present
    const atIndex = remaining.indexOf('@');
    if (atIndex > 0) {
      const credentialsPart = remaining.substring(0, atIndex);
      const colonIndex = credentialsPart.indexOf(':');
      
      if (colonIndex > 0) {
        result.credentials.username = credentialsPart.substring(0, colonIndex);
        result.credentials.password = true; // Don't store actual password
      } else {
        result.isValid = false;
        result.errors.push('Invalid credentials format. Expected "username:password@"');
      }
      
      remaining = remaining.substring(atIndex + 1);
    }

    // 3. Extract hosts, database, and options
    const slashIndex = remaining.indexOf('/');
    const questionIndex = remaining.indexOf('?');
    
    let hostsString;
    if (slashIndex > 0) {
      hostsString = remaining.substring(0, slashIndex);
      remaining = remaining.substring(slashIndex + 1);
      
      // Extract database name
      const dbEnd = remaining.indexOf('?');
      if (dbEnd > 0) {
        result.database = remaining.substring(0, dbEnd);
        remaining = remaining.substring(dbEnd + 1);
      } else {
        result.database = remaining;
        remaining = '';
      }
    } else if (questionIndex > 0) {
      hostsString = remaining.substring(0, questionIndex);
      remaining = remaining.substring(questionIndex + 1);
    } else {
      hostsString = remaining;
      remaining = '';
    }

    // Parse hosts
    if (hostsString) {
      const hostParts = hostsString.split(',');
      for (const hostPart of hostParts) {
        const trimmed = hostPart.trim();
        if (trimmed) {
          result.hosts.push(trimmed);
        }
      }
    }

    if (result.hosts.length === 0) {
      result.isValid = false;
      result.errors.push('No valid hosts found in connection string');
    }

    // 4. Parse query parameters
    if (remaining) {
      const params = remaining.split('&');
      for (const param of params) {
        const [key, value] = param.split('=');
        if (key) {
          result.options[key] = value || true;
        }
      }
    }

    // Additional validations
    if (!result.database) {
      result.errors.push('Warning: No database name specified in connection string');
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Parsing error: ${error.message}`);
  }

  return result;
}

module.exports = {
  validateConnectionString
};
