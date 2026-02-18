#!/usr/bin/env node

/**
 * Environment Configuration Checker
 * Verifies that environment files are set up correctly
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Checking Environment Configuration...\n');

const rootDir = path.join(__dirname, '..');
const files = {
  '.env': path.join(rootDir, '.env'),
  '.env.local': path.join(rootDir, '.env.local'),
  '.env.production': path.join(rootDir, '.env.production'),
  'eas.json': path.join(rootDir, 'eas.json'),
};

let hasErrors = false;

// Check .env
console.log('📄 Checking .env (default/fallback)...');
if (fs.existsSync(files['.env'])) {
  const content = fs.readFileSync(files['.env'], 'utf8');
  if (content.includes('192.168')) {
    console.log('   ✅ Contains local development URL (correct for default)');
  } else if (content.includes('inventory-application-git-backend-otikanelsons-projects.vercel.app')) {
    console.log('   ⚠️  WARNING: Contains production URL (should be local for development)');
  }
} else {
  console.log('   ❌ .env file not found');
  hasErrors = true;
}

// Check .env.local
console.log('\n📄 Checking .env.local (local development)...');
if (fs.existsSync(files['.env.local'])) {
  const content = fs.readFileSync(files['.env.local'], 'utf8');
  if (content.includes('192.168')) {
    console.log('   ✅ Contains local development URL');
  } else {
    console.log('   ⚠️  WARNING: Should contain local IP address');
  }
} else {
  console.log('   ⚠️  .env.local not found (will use .env as fallback)');
}

// Check .env.production
console.log('\n📄 Checking .env.production (production builds)...');
if (fs.existsSync(files['.env.production'])) {
  const content = fs.readFileSync(files['.env.production'], 'utf8');
  if (content.includes('inventory-application-git-backend-otikanelsons-projects.vercel.app')) {
    console.log('   ✅ Contains production URL');
  } else {
    console.log('   ⚠️  WARNING: Should contain production URL');
  }
} else {
  console.log('   ⚠️  .env.production not found (EAS will use eas.json instead)');
}

// Check eas.json
console.log('\n📄 Checking eas.json (EAS build configuration)...');
if (fs.existsSync(files['eas.json'])) {
  const content = fs.readFileSync(files['eas.json'], 'utf8');
  const config = JSON.parse(content);
  
  // Check production profile
  if (config.build?.production?.env?.EXPO_PUBLIC_API_URL) {
    const prodUrl = config.build.production.env.EXPO_PUBLIC_API_URL;
    if (prodUrl.includes('inventory-application-git-backend-otikanelsons-projects.vercel.app')) {
      console.log('   ✅ Production profile has correct URL');
    } else if (prodUrl.includes('192.168') || prodUrl.includes('localhost')) {
      console.log('   ❌ ERROR: Production profile has LOCAL URL!');
      hasErrors = true;
    }
  } else {
    console.log('   ⚠️  WARNING: Production profile missing EXPO_PUBLIC_API_URL');
  }
  
  // Check preview profile
  if (config.build?.preview?.env?.EXPO_PUBLIC_API_URL) {
    const previewUrl = config.build.preview.env.EXPO_PUBLIC_API_URL;
    if (previewUrl.includes('inventory-application-git-backend-otikanelsons-projects.vercel.app')) {
      console.log('   ✅ Preview profile has correct URL');
    } else if (previewUrl.includes('192.168') || previewUrl.includes('localhost')) {
      console.log('   ❌ ERROR: Preview profile has LOCAL URL!');
      hasErrors = true;
    }
  }
} else {
  console.log('   ❌ eas.json not found');
  hasErrors = true;
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ ERRORS FOUND - Please fix before building for production');
  console.log('\nSee ENVIRONMENT_SETUP.md for configuration guide');
  process.exit(1);
} else {
  console.log('✅ Environment configuration looks good!');
  console.log('\n📋 Quick Reference:');
  console.log('   • Local dev:  npx expo start');
  console.log('   • Production: eas build --platform android --profile production');
  console.log('\n📖 For more info, see ENVIRONMENT_SETUP.md');
}
console.log('='.repeat(60) + '\n');
