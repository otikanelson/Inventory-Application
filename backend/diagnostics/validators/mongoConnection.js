/**
 * MongoDB Connection Validator
 * Tests actual MongoDB connections with detailed error reporting
 */

const mongoose = require('mongoose');

async function testMongoDBConnection(connectionString, timeout = 10000) {
  const result = {
    success: false,
    connectionTime: 0,
    serverInfo: null,
    error: null
  };

  const startTime = Date.now();
  let connection = null;

  try {
    // Create a new connection (don't use default mongoose connection)
    connection = await mongoose.createConnection(connectionString, {
      serverSelectionTimeoutMS: timeout,
      connectTimeoutMS: timeout,
      socketTimeoutMS: timeout + 5000,
      maxPoolSize: 1,
      minPoolSize: 1
    }).asPromise();

    result.success = true;
    result.connectionTime = Date.now() - startTime;
    result.serverInfo = {
      host: connection.host,
      database: connection.name,
      version: connection.db ? await getServerVersion(connection) : 'unknown',
      readyState: connection.readyState
    };

    // Close the connection
    await connection.close();
  } catch (error) {
    result.connectionTime = Date.now() - startTime;
    result.error = categorizeError(error);
  }

  return result;
}

async function getServerVersion(connection) {
  try {
    const admin = connection.db.admin();
    const info = await admin.serverInfo();
    return info.version;
  } catch (err) {
    return 'unknown';
  }
}

function categorizeError(error) {
  const errorInfo = {
    message: error.message,
    code: error.code || null,
    name: error.name,
    category: 'unknown'
  };

  // Categorize based on error code or message
  if (error.code === 18 || error.code === 13 || error.message.includes('Authentication failed')) {
    errorInfo.category = 'authentication';
  } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timed out') || error.message.includes('ESOCKETTIMEDOUT')) {
    errorInfo.category = 'timeout';
  } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED') || error.message.includes('EHOSTUNREACH')) {
    errorInfo.category = 'network';
  } else if (error.message.includes('Invalid connection string') || error.message.includes('URI malformed')) {
    errorInfo.category = 'configuration';
  }

  return errorInfo;
}

async function testTimeoutConfigurations(connectionString) {
  const timeouts = [5000, 10000, 30000];
  const results = [];

  for (const timeout of timeouts) {
    console.log(`  Testing with ${timeout/1000}s timeout...`);
    const result = await testMongoDBConnection(connectionString, timeout);
    results.push({
      timeout,
      success: result.success,
      connectionTime: result.connectionTime,
      error: result.error
    });

    if (result.success) {
      console.log(`  ✓ Connection successful with ${timeout/1000}s timeout`);
      break; // Stop testing if we succeed
    }
  }

  return results;
}

module.exports = {
  testMongoDBConnection,
  testTimeoutConfigurations
};
