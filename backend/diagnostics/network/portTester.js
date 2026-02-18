/**
 * Network Port Tester
 * Tests TCP connectivity to MongoDB ports
 */

const net = require('net');

async function testPortConnectivity(hosts, ports = [27017, 27018, 27019]) {
  const result = {
    tests: [],
    summary: {
      totalTests: 0,
      successful: 0,
      failed: 0
    }
  };

  // Test each host-port combination
  for (const host of hosts) {
    for (const port of ports) {
      const testResult = await testSinglePort(host, port);
      result.tests.push(testResult);
      result.summary.totalTests++;
      
      if (testResult.success) {
        result.summary.successful++;
      } else {
        result.summary.failed++;
      }
    }
  }

  return result;
}

function testSinglePort(host, port) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({
        host,
        port,
        success: false,
        responseTime: Date.now() - startTime,
        error: 'ETIMEDOUT: Connection timed out after 5 seconds'
      });
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({
        host,
        port,
        success: true,
        responseTime: Date.now() - startTime,
        error: null
      });
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      socket.destroy();
      
      let errorMessage = err.code || err.message;
      if (err.code === 'ECONNREFUSED') {
        errorMessage = 'ECONNREFUSED: Connection actively refused by target';
      } else if (err.code === 'EHOSTUNREACH') {
        errorMessage = 'EHOSTUNREACH: No route to host';
      } else if (err.code === 'ENETUNREACH') {
        errorMessage = 'ENETUNREACH: Network is unreachable';
      }
      
      resolve({
        host,
        port,
        success: false,
        responseTime: Date.now() - startTime,
        error: errorMessage
      });
    });

    socket.connect(port, host);
  });
}

module.exports = {
  testPortConnectivity
};
