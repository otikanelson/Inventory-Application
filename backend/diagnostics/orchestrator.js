/**
 * Diagnostic Orchestrator
 * Coordinates execution of all diagnostic tests
 */

const { checkEnvironmentVariables } = require('./system/envChecker');
const { validateConnectionString } = require('./validators/connectionString');
const { resolveDNS } = require('./network/dnsResolver');
const { testPortConnectivity } = require('./network/portTester');
const { checkFirewall } = require('./system/firewallChecker');
const { testMongoDBConnection, testTimeoutConfigurations } = require('./validators/mongoConnection');

async function runAllDiagnostics(connectionString, options = {}) {
  const results = {
    timestamp: new Date(),
    connectionString,
    results: {},
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0
    }
  };

  console.log('\n🔍 Starting MongoDB Connection Diagnostics...\n');

  try {
    // 1. Environment variable check
    console.log('1️⃣  Checking environment variables...');
    results.results.environmentCheck = checkEnvironmentVariables();
    results.summary.totalTests++;
    if (results.results.environmentCheck.warnings.length > 0) {
      results.summary.warnings += results.results.environmentCheck.warnings.length;
    } else {
      results.summary.passed++;
    }

    // 2. Connection string validation
    console.log('2️⃣  Validating connection string...');
    results.results.connectionStringValidation = validateConnectionString(connectionString);
    results.summary.totalTests++;
    if (results.results.connectionStringValidation.isValid) {
      results.summary.passed++;
      console.log('   ✓ Connection string is valid');
    } else {
      results.summary.failed++;
      console.log('   ✗ Connection string validation failed');
      // If connection string is invalid, skip remaining tests
      return results;
    }

    const validation = results.results.connectionStringValidation;

    // 3. DNS resolution
    console.log('3️⃣  Resolving DNS...');
    const hostname = validation.hosts[0].split(':')[0]; // Get first host without port
    results.results.dnsResolution = await resolveDNS(hostname, validation.protocol);
    results.summary.totalTests++;
    if (results.results.dnsResolution.success) {
      results.summary.passed++;
      console.log(`   ✓ DNS resolved (${results.results.dnsResolution.resolutionTime}ms)`);
    } else {
      results.summary.failed++;
      console.log('   ✗ DNS resolution failed');
    }

    // 4. Network connectivity tests
    console.log('4️⃣  Testing network connectivity...');
    const hostsToTest = results.results.dnsResolution.success 
      ? results.results.dnsResolution.resolvedAddresses.slice(0, 2) // Test first 2 IPs
      : [hostname]; // Fallback to hostname if DNS failed
    
    results.results.networkConnectivity = await testPortConnectivity(hostsToTest, [27017]);
    results.summary.totalTests++;
    if (results.results.networkConnectivity.summary.successful > 0) {
      results.summary.passed++;
      console.log(`   ✓ Port connectivity successful (${results.results.networkConnectivity.summary.successful}/${results.results.networkConnectivity.summary.totalTests})`);
    } else {
      results.summary.failed++;
      console.log('   ✗ All port connectivity tests failed');
    }

    // 5. Firewall check
    console.log('5️⃣  Checking firewall...');
    results.results.firewallCheck = await checkFirewall();
    results.summary.totalTests++;
    if (results.results.firewallCheck.applicable) {
      if (results.results.firewallCheck.potentialBlocks.length > 0) {
        results.summary.warnings++;
        console.log(`   ⚠ Firewall enabled with ${results.results.firewallCheck.potentialBlocks.length} potential blocking rule(s)`);
      } else {
        results.summary.passed++;
        console.log('   ✓ No firewall blocks detected');
      }
    } else {
      results.summary.passed++;
      console.log('   ℹ Firewall check skipped (non-Windows)');
    }

    // 6. MongoDB connection attempt
    console.log('6️⃣  Testing MongoDB connection...');
    results.results.mongodbConnection = await testMongoDBConnection(connectionString, 10000);
    results.summary.totalTests++;
    if (results.results.mongodbConnection.success) {
      results.summary.passed++;
      console.log(`   ✓ MongoDB connection successful (${results.results.mongodbConnection.connectionTime}ms)`);
    } else {
      results.summary.failed++;
      console.log('   ✗ MongoDB connection failed');
      
      // 7. Timeout configuration tests (only if initial connection failed)
      if (options.testTimeouts !== false) {
        console.log('7️⃣  Testing different timeout configurations...');
        results.results.timeoutTests = await testTimeoutConfigurations(connectionString);
        const successfulTimeout = results.results.timeoutTests.find(t => t.success);
        if (successfulTimeout) {
          console.log(`   ✓ Connection successful with ${successfulTimeout.timeout/1000}s timeout`);
        } else {
          console.log('   ✗ All timeout tests failed');
        }
      }
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
    results.summary.failed++;
  }

  console.log('\n✅ Diagnostics complete\n');
  return results;
}

module.exports = {
  runAllDiagnostics
};
