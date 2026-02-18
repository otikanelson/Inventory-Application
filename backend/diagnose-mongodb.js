#!/usr/bin/env node

/**
 * MongoDB Connection Diagnostics Tool
 * 
 * Usage:
 *   node diagnose-mongodb.js [connection-string]
 *   npm run diagnose
 * 
 * If no connection string is provided, it will use MONGO_URI from environment variables.
 */

require('dotenv').config();
const { runAllDiagnostics } = require('./diagnostics/orchestrator');
const { generateReport } = require('./diagnostics/reporting/reportGenerator');

async function main() {
  // Determine connection string source
  let connectionString = process.argv[2]; // From command line argument
  
  if (!connectionString) {
    connectionString = process.env.MONGO_URI || process.env.DATABASE_URL;
  }
  
  if (!connectionString) {
    console.error('❌ Error: No connection string provided');
    console.error('\nUsage:');
    console.error('  node diagnose-mongodb.js <connection-string>');
    console.error('  OR set MONGO_URI in .env file');
    process.exit(1);
  }

  try {
    // Run diagnostics
    const diagnosticResults = await runAllDiagnostics(connectionString);
    
    // Generate and display report
    const report = generateReport(diagnosticResults);
    console.log(report.details);
    
    // Exit with appropriate code
    const exitCode = diagnosticResults.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

// Export for programmatic usage
module.exports = {
  runAllDiagnostics,
  generateReport
};
