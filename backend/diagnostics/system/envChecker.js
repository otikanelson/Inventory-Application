/**
 * Environment Variable Checker
 * Verifies environment variables are properly loaded
 */

const fs = require('fs');
const path = require('path');

function checkEnvironmentVariables() {
  const result = {
    envFileExists: false,
    envFileLoaded: false,
    variables: {
      MONGO_URI: false,
      DATABASE_URL: false,
      NODE_ENV: process.env.NODE_ENV || 'not set'
    },
    warnings: []
  };

  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  result.envFileExists = fs.existsSync(envPath);

  if (!result.envFileExists) {
    result.warnings.push('No .env file found in current directory');
  }

  // Check for MongoDB connection string environment variables
  if (process.env.MONGO_URI) {
    result.variables.MONGO_URI = true;
    result.envFileLoaded = true;
  }

  if (process.env.DATABASE_URL) {
    result.variables.DATABASE_URL = true;
    result.envFileLoaded = true;
  }

  if (!result.variables.MONGO_URI && !result.variables.DATABASE_URL) {
    result.warnings.push('No MongoDB connection string found in environment variables (MONGO_URI or DATABASE_URL)');
  }

  return result;
}

module.exports = {
  checkEnvironmentVariables
};
