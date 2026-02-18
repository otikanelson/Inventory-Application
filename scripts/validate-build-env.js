#!/usr/bin/env node

/**
 * Build Environment Validation Script
 * 
 * This script ensures that production builds use the correct API URL
 * and prevents accidentally building with local development URLs.
 * 
 * Usage:
 *   node scripts/validate-build-env.js <profile>
 * 
 * Examples:
 *   node scripts/validate-build-env.js production
 *   node scripts/validate-build-env.js preview
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  error: (msg) => console.error(`${colors.red}❌ ERROR: ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.warn(`${colors.yellow}⚠️  WARNING: ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`),
};

// Expected URLs for different environments
const EXPECTED_URLS = {
  production: 'https://inventory-application-git-backend-otikanelsons-projects.vercel.app/api',
  preview: 'https://inventory-application-git-backend-otikanelsons-projects.vercel.app/api',
  development: 'http://', // Should start with http:// for local
};

// Local IP patterns to detect
const LOCAL_PATTERNS = [
  /^http:\/\/localhost/,
  /^http:\/\/127\.0\.0\.1/,
  /^http:\/\/192\.168\./,
  /^http:\/\/10\./,
  /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
];

/**
 * Check if a URL is a local development URL
 */
function isLocalUrl(url) {
  return LOCAL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Read environment file
 */
function readEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const env = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    return env;
  } catch (error) {
    return null;
  }
}

/**
 * Read EAS configuration
 */
function readEasConfig() {
  try {
    const easPath = path.join(process.cwd(), 'eas.json');
    const content = fs.readFileSync(easPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log.error(`Failed to read eas.json: ${error.message}`);
    return null;
  }
}

/**
 * Validate build environment
 */
function validateBuildEnvironment(profile) {
  log.header();
  log.info(`Validating build environment for profile: ${profile}`);
  log.header();
  
  // Read EAS config
  const easConfig = readEasConfig();
  if (!easConfig) {
    log.error('Could not read eas.json');
    process.exit(1);
  }
  
  // Check if profile exists
  if (!easConfig.build || !easConfig.build[profile]) {
    log.error(`Profile "${profile}" not found in eas.json`);
    process.exit(1);
  }
  
  const buildConfig = easConfig.build[profile];
  
  // Get API URL from EAS config
  const easApiUrl = buildConfig.env?.EXPO_PUBLIC_API_URL;
  
  log.info(`Profile: ${profile}`);
  log.info(`API URL from eas.json: ${easApiUrl || 'Not set (will use .env)'}`);
  
  // Validate production/preview builds
  if (profile === 'production' || profile === 'preview') {
    if (!easApiUrl) {
      log.error(`Production/Preview builds must have EXPO_PUBLIC_API_URL set in eas.json`);
      log.info(`Add this to eas.json under build.${profile}.env:`);
      log.info(`  "EXPO_PUBLIC_API_URL": "${EXPECTED_URLS[profile]}"`);
      process.exit(1);
    }
    
    if (isLocalUrl(easApiUrl)) {
      log.error(`Production/Preview builds cannot use local URLs!`);
      log.error(`Found: ${easApiUrl}`);
      log.error(`Expected: ${EXPECTED_URLS[profile]}`);
      log.info(`\nUpdate eas.json to use production URL:`);
      log.info(`  "EXPO_PUBLIC_API_URL": "${EXPECTED_URLS[profile]}"`);
      process.exit(1);
    }
    
    if (easApiUrl !== EXPECTED_URLS[profile]) {
      log.warning(`API URL doesn't match expected production URL`);
      log.warning(`Found: ${easApiUrl}`);
      log.warning(`Expected: ${EXPECTED_URLS[profile]}`);
      log.info(`\nContinuing anyway, but verify this is correct...`);
    }
  }
  
  // Check .env files for reference
  log.info('\nChecking .env files...');
  
  const envFiles = ['.env', '.env.local', '.env.production'];
  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile);
    const env = readEnvFile(envPath);
    
    if (env && env.EXPO_PUBLIC_API_URL) {
      const isLocal = isLocalUrl(env.EXPO_PUBLIC_API_URL);
      const status = isLocal ? '🏠 LOCAL' : '🌐 REMOTE';
      log.info(`  ${envFile}: ${status} - ${env.EXPO_PUBLIC_API_URL}`);
      
      if (envFile === '.env.production' && isLocal) {
        log.error(`\n.env.production should NOT contain local URL!`);
        log.error(`Update .env.production to: ${EXPECTED_URLS.production}`);
        process.exit(1);
      }
    } else {
      log.info(`  ${envFile}: Not found or no API URL`);
    }
  }
  
  // Final validation
  log.header();
  log.success(`Build environment validation passed for profile: ${profile}`);
  log.info(`API URL: ${easApiUrl || 'Will use .env file'}`);
  log.header();
  
  // Show build command
  log.info('\nTo build, run:');
  log.info(`  eas build --platform android --profile ${profile}`);
  log.info('');
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    log.error('Missing build profile argument');
    log.info('\nUsage:');
    log.info('  node scripts/validate-build-env.js <profile>');
    log.info('\nExamples:');
    log.info('  node scripts/validate-build-env.js production');
    log.info('  node scripts/validate-build-env.js preview');
    log.info('  node scripts/validate-build-env.js development');
    process.exit(1);
  }
  
  const profile = args[0];
  validateBuildEnvironment(profile);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateBuildEnvironment, isLocalUrl };
