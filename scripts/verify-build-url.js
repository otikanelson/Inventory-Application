#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying Build Configuration\n');

// Read eas.json
const easPath = path.join(__dirname, '..', 'eas.json');
const easConfig = JSON.parse(fs.readFileSync(easPath, 'utf8'));

// Check production profile
const prodEnv = easConfig.build?.production?.env?.EXPO_PUBLIC_API_URL;
const previewEnv = easConfig.build?.preview?.env?.EXPO_PUBLIC_API_URL;

console.log('📋 EAS Build Profiles:');
console.log(`   Production: ${prodEnv || '❌ NOT SET'}`);
console.log(`   Preview: ${previewEnv || '❌ NOT SET'}`);

// Check .env files
const envFiles = ['.env', '.env.local', '.env.production'];
console.log('\n📄 Local .env Files:');

envFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/EXPO_PUBLIC_API_URL=(.+)/);
    if (match) {
      console.log(`   ${file}: ${match[1].trim()}`);
    }
  } else {
    console.log(`   ${file}: (not found)`);
  }
});

// Validation
console.log('\n✅ Validation:');
const expectedUrl = 'https://inventory-application-one.vercel.app';

if (prodEnv === expectedUrl) {
  console.log('   ✅ Production profile is correct');
} else {
  console.log(`   ❌ Production profile should be: ${expectedUrl}`);
  console.log(`      Currently: ${prodEnv}`);
}

if (previewEnv === expectedUrl) {
  console.log('   ✅ Preview profile is correct');
} else {
  console.log(`   ❌ Preview profile should be: ${expectedUrl}`);
  console.log(`      Currently: ${previewEnv}`);
}

console.log('\n💡 Important Notes:');
console.log('   - EAS Build uses ONLY the env vars in eas.json');
console.log('   - Local .env files are ignored during EAS builds');
console.log('   - The app code adds /api to the URL automatically');
console.log('\n📦 To build with correct URL:');
console.log('   eas build --platform android --profile production');
console.log('');
