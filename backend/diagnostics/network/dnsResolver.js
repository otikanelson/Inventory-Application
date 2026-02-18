/**
 * DNS Resolver for MongoDB hostnames
 * Resolves hostnames to IP addresses and handles SRV records
 */

const dns = require('dns').promises;

async function resolveDNS(hostname, protocol) {
  const result = {
    success: false,
    hostname,
    protocol,
    resolvedAddresses: [],
    srvRecords: [],
    resolutionTime: 0,
    error: null
  };

  const startTime = Date.now();

  try {
    if (protocol === 'mongodb+srv') {
      // Resolve SRV records for mongodb+srv protocol
      try {
        const srvRecords = await Promise.race([
          dns.resolveSrv(`_mongodb._tcp.${hostname}`),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('DNS_TIMEOUT')), 5000)
          )
        ]);

        result.srvRecords = srvRecords.map(record => ({
          hostname: record.name,
          port: record.port,
          priority: record.priority,
          weight: record.weight
        }));

        // Resolve each SRV hostname to IP addresses
        for (const srv of result.srvRecords) {
          try {
            const addresses = await dns.resolve4(srv.hostname);
            result.resolvedAddresses.push(...addresses);
          } catch (err) {
            // Continue even if one host fails
          }
        }

        result.success = result.srvRecords.length > 0;
      } catch (err) {
        result.error = `SRV resolution failed: ${err.message}`;
      }
    } else {
      // Resolve A/AAAA records for mongodb protocol
      try {
        const addresses = await Promise.race([
          dns.resolve4(hostname),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('DNS_TIMEOUT')), 5000)
          )
        ]);

        result.resolvedAddresses = addresses;
        result.success = addresses.length > 0;
      } catch (err) {
        // Try AAAA (IPv6) if A (IPv4) fails
        try {
          const addresses = await Promise.race([
            dns.resolve6(hostname),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('DNS_TIMEOUT')), 5000)
            )
          ]);

          result.resolvedAddresses = addresses;
          result.success = addresses.length > 0;
        } catch (err2) {
          result.error = err.code || err.message;
        }
      }
    }
  } catch (error) {
    result.error = error.code || error.message;
    
    // Provide specific error messages
    if (error.code === 'ENOTFOUND') {
      result.error = 'ENOTFOUND: Hostname does not exist or cannot be resolved';
    } else if (error.message === 'DNS_TIMEOUT') {
      result.error = 'ETIMEOUT: DNS query timed out after 5 seconds';
    } else if (error.code === 'ESERVFAIL') {
      result.error = 'ESERVFAIL: DNS server returned a failure response';
    }
  }

  result.resolutionTime = Date.now() - startTime;
  return result;
}

module.exports = {
  resolveDNS
};
