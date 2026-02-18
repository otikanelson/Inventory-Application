/**
 * Recommendation Engine
 * Generates actionable recommendations based on diagnostic results
 */

function generateRecommendations(diagnosticResults) {
  const recommendations = [];

  // Connection string validation recommendations
  if (diagnosticResults.connectionStringValidation && !diagnosticResults.connectionStringValidation.isValid) {
    recommendations.push({
      priority: 'critical',
      category: 'configuration',
      issue: 'Invalid connection string format',
      recommendation: 'Fix the connection string format. Example: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority',
      actionable: true,
      commands: [],
      errors: diagnosticResults.connectionStringValidation.errors
    });
  }

  // DNS resolution recommendations
  if (diagnosticResults.dnsResolution && !diagnosticResults.dnsResolution.success) {
    if (diagnosticResults.dnsResolution.error.includes('ENOTFOUND')) {
      recommendations.push({
        priority: 'high',
        category: 'network',
        issue: 'DNS resolution failed - hostname not found',
        recommendation: 'Verify the hostname is correct and your DNS server is accessible. Check your internet connection.',
        actionable: true,
        commands: ['nslookup ' + diagnosticResults.dnsResolution.hostname]
      });
    } else if (diagnosticResults.dnsResolution.error.includes('ETIMEOUT')) {
      recommendations.push({
        priority: 'high',
        category: 'network',
        issue: 'DNS query timed out',
        recommendation: 'Check your network connection and DNS server settings. Try using a different DNS server (e.g., 8.8.8.8).',
        actionable: true,
        commands: []
      });
    }
  }

  // Network connectivity recommendations
  if (diagnosticResults.networkConnectivity && diagnosticResults.networkConnectivity.summary.failed > 0) {
    recommendations.push({
      priority: 'high',
      category: 'firewall',
      issue: `Failed to connect to ${diagnosticResults.networkConnectivity.summary.failed} port(s)`,
      recommendation: 'Port may be blocked by firewall or network. Check Windows Firewall rules and network access. Verify MongoDB Atlas IP whitelist includes your IP address.',
      actionable: true,
      commands: [
        'netsh advfirewall firewall add rule name="MongoDB" dir=out action=allow protocol=TCP remoteport=27017'
      ]
    });
  }

  // Firewall recommendations
  if (diagnosticResults.firewallCheck && diagnosticResults.firewallCheck.firewallEnabled && diagnosticResults.firewallCheck.potentialBlocks.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'firewall',
      issue: `Windows Firewall has ${diagnosticResults.firewallCheck.potentialBlocks.length} rule(s) that might block MongoDB`,
      recommendation: 'Review and modify firewall rules to allow outbound connections to MongoDB ports (27017-27019).',
      actionable: true,
      commands: [
        'netsh advfirewall set allprofiles state off  # Temporarily disable (for testing)',
        'netsh advfirewall firewall add rule name="MongoDB Out" dir=out action=allow protocol=TCP remoteport=27017-27019'
      ]
    });
  }

  // MongoDB connection recommendations
  if (diagnosticResults.mongodbConnection && !diagnosticResults.mongodbConnection.success) {
    const error = diagnosticResults.mongodbConnection.error;
    
    if (error.category === 'authentication') {
      recommendations.push({
        priority: 'critical',
        category: 'authentication',
        issue: 'MongoDB authentication failed',
        recommendation: 'Verify username and password are correct. Check database user permissions in MongoDB Atlas. Ensure the user has access to the specified database.',
        actionable: true,
        commands: []
      });
    } else if (error.category === 'timeout') {
      recommendations.push({
        priority: 'high',
        category: 'network',
        issue: 'MongoDB connection timed out',
        recommendation: 'Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for development). Verify cluster is running (not paused). Try increasing timeout values or use a different network.',
        actionable: true,
        commands: []
      });
    } else if (error.category === 'network') {
      recommendations.push({
        priority: 'high',
        category: 'network',
        issue: 'Network error connecting to MongoDB',
        recommendation: 'Check your internet connection. Verify MongoDB Atlas cluster is running. Try using a mobile hotspot or VPN.',
        actionable: true,
        commands: []
      });
    }
  }

  // Environment variable recommendations
  if (diagnosticResults.environmentCheck && diagnosticResults.environmentCheck.warnings.length > 0) {
    recommendations.push({
      priority: 'medium',
      category: 'configuration',
      issue: 'Environment variable issues detected',
      recommendation: 'Create a .env file with MONGO_URI variable. Ensure dotenv is loaded before accessing environment variables.',
      actionable: true,
      commands: [],
      warnings: diagnosticResults.environmentCheck.warnings
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

module.exports = {
  generateRecommendations
};
