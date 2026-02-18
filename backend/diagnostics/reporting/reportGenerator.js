/**
 * Report Generator
 * Generates comprehensive diagnostic reports
 */

const formatter = require('../utils/formatter');
const { sanitizeConnectionString } = require('../utils/sanitizer');
const { generateRecommendations } = require('./recommendationEngine');

function generateReport(diagnosticResults) {
  const recommendations = generateRecommendations(diagnosticResults);
  
  let report = '';
  
  // Header
  report += formatter.header('MongoDB Connection Diagnostics Report');
  report += `\n${formatter.dim('Timestamp: ' + new Date().toISOString())}\n`;
  report += `${formatter.dim('Connection String: ' + sanitizeConnectionString(diagnosticResults.connectionString))}\n`;
  
  // Summary
  report += formatter.subheader('\n📊 Summary');
  report += `\nTotal Tests: ${diagnosticResults.summary.totalTests}`;
  report += `\n${formatter.success('Passed: ' + diagnosticResults.summary.passed)}`;
  report += `\n${formatter.error('Failed: ' + diagnosticResults.summary.failed)}`;
  report += `\n${formatter.warning('Warnings: ' + diagnosticResults.summary.warnings)}`;
  
  // Detailed Results
  report += formatter.subheader('\n\n🔍 Detailed Results');
  
  // Environment Check
  if (diagnosticResults.results.environmentCheck) {
    report += '\n\n' + formatter.bold('Environment Variables:');
    const env = diagnosticResults.results.environmentCheck;
    report += `\n  .env file exists: ${env.envFileExists ? formatter.success('Yes') : formatter.error('No')}`;
    report += `\n  MONGO_URI set: ${env.variables.MONGO_URI ? formatter.success('Yes') : formatter.error('No')}`;
    report += `\n  NODE_ENV: ${env.variables.NODE_ENV}`;
    if (env.warnings.length > 0) {
      env.warnings.forEach(w => report += `\n  ${formatter.warning(w)}`);
    }
  }
  
  // Connection String Validation
  if (diagnosticResults.results.connectionStringValidation) {
    report += '\n\n' + formatter.bold('Connection String Validation:');
    const cs = diagnosticResults.results.connectionStringValidation;
    report += `\n  Valid: ${cs.isValid ? formatter.success('Yes') : formatter.error('No')}`;
    report += `\n  Protocol: ${cs.protocol || 'N/A'}`;
    report += `\n  Hosts: ${cs.hosts.join(', ') || 'None'}`;
    report += `\n  Database: ${cs.database || formatter.warning('Not specified')}`;
    if (cs.errors.length > 0) {
      cs.errors.forEach(e => report += `\n  ${formatter.error(e)}`);
    }
  }
  
  // DNS Resolution
  if (diagnosticResults.results.dnsResolution) {
    report += '\n\n' + formatter.bold('DNS Resolution:');
    const dns = diagnosticResults.results.dnsResolution;
    report += `\n  Success: ${dns.success ? formatter.success('Yes') : formatter.error('No')}`;
    report += `\n  Hostname: ${dns.hostname}`;
    report += `\n  Resolution Time: ${dns.resolutionTime}ms`;
    if (dns.success) {
      report += `\n  Resolved IPs: ${dns.resolvedAddresses.join(', ')}`;
      if (dns.srvRecords.length > 0) {
        report += `\n  SRV Records: ${dns.srvRecords.length} found`;
      }
    } else {
      report += `\n  ${formatter.error('Error: ' + dns.error)}`;
    }
  }
  
  // Network Connectivity
  if (diagnosticResults.results.networkConnectivity) {
    report += '\n\n' + formatter.bold('Network Connectivity:');
    const net = diagnosticResults.results.networkConnectivity;
    report += `\n  Tests: ${net.summary.totalTests}`;
    report += `\n  Successful: ${formatter.success(net.summary.successful.toString())}`;
    report += `\n  Failed: ${formatter.error(net.summary.failed.toString())}`;
    
    net.tests.forEach(test => {
      const status = test.success ? formatter.success('✓') : formatter.error('✗');
      report += `\n  ${status} ${test.host}:${test.port} (${test.responseTime}ms)`;
      if (!test.success) {
        report += `\n    ${formatter.dim(test.error)}`;
      }
    });
  }
  
  // Firewall Check
  if (diagnosticResults.results.firewallCheck) {
    report += '\n\n' + formatter.bold('Firewall Check:');
    const fw = diagnosticResults.results.firewallCheck;
    if (fw.applicable) {
      report += `\n  Firewall Enabled: ${fw.firewallEnabled ? formatter.warning('Yes') : formatter.success('No')}`;
      if (fw.potentialBlocks.length > 0) {
        report += `\n  ${formatter.warning('Potential blocking rules: ' + fw.potentialBlocks.length)}`;
      }
    } else {
      report += `\n  ${formatter.dim(fw.error)}`;
    }
  }
  
  // MongoDB Connection
  if (diagnosticResults.results.mongodbConnection) {
    report += '\n\n' + formatter.bold('MongoDB Connection:');
    const mongo = diagnosticResults.results.mongodbConnection;
    report += `\n  Success: ${mongo.success ? formatter.success('Yes') : formatter.error('No')}`;
    report += `\n  Connection Time: ${mongo.connectionTime}ms`;
    
    if (mongo.success && mongo.serverInfo) {
      report += `\n  Host: ${mongo.serverInfo.host}`;
      report += `\n  Database: ${mongo.serverInfo.database}`;
      report += `\n  Server Version: ${mongo.serverInfo.version}`;
    } else if (mongo.error) {
      report += `\n  ${formatter.error('Error Category: ' + mongo.error.category)}`;
      report += `\n  ${formatter.error('Message: ' + mongo.error.message)}`;
      if (mongo.error.code) {
        report += `\n  ${formatter.error('Code: ' + mongo.error.code)}`;
      }
    }
  }
  
  // Recommendations
  if (recommendations.length > 0) {
    report += formatter.subheader('\n\n💡 Recommendations');
    
    recommendations.forEach((rec, index) => {
      const priorityIcon = rec.priority === 'critical' ? '🔴' : rec.priority === 'high' ? '🟠' : '🟡';
      report += `\n\n${priorityIcon} ${formatter.bold(`${index + 1}. ${rec.issue}`)}`;
      report += `\n   ${rec.recommendation}`;
      
      if (rec.commands && rec.commands.length > 0) {
        report += '\n   ' + formatter.dim('Commands:');
        rec.commands.forEach(cmd => {
          report += `\n   ${formatter.dim('$ ' + cmd)}`;
        });
      }
      
      if (rec.errors && rec.errors.length > 0) {
        rec.errors.forEach(err => {
          report += `\n   ${formatter.dim('• ' + err)}`;
        });
      }
      
      if (rec.warnings && rec.warnings.length > 0) {
        rec.warnings.forEach(warn => {
          report += `\n   ${formatter.dim('• ' + warn)}`;
        });
      }
    });
  }
  
  report += formatter.separator();
  
  return {
    summary: `${diagnosticResults.summary.passed}/${diagnosticResults.summary.totalTests} tests passed`,
    details: report,
    recommendations,
    rawResults: diagnosticResults
  };
}

module.exports = {
  generateReport
};
