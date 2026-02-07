// Test if backend server is accessible from this device
const http = require('http');

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.6:8000/api';
const BASE_URL = API_URL.replace('/api', '');

console.log('🔍 Testing Backend Server Connection\n');
console.log('=' .repeat(50));
console.log(`\nTarget: ${BASE_URL}`);
console.log(`API URL: ${API_URL}\n`);

// Test 1: Health check
console.log('1️⃣  Testing health endpoint...');
const healthUrl = new URL('/', BASE_URL);

http.get(healthUrl.href, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Server is reachable!');
      console.log(`   Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log(`   Message: ${json.message}`);
        console.log(`   Environment: ${json.environment}`);
        console.log(`   Storage: ${json.storage}`);
      } catch (e) {
        console.log(`   Response: ${data.substring(0, 100)}`);
      }
      
      // Test 2: API endpoint
      console.log('\n2️⃣  Testing API endpoint...');
      const apiUrl = new URL('/api', BASE_URL);
      
      http.get(apiUrl.href, (res2) => {
        let data2 = '';
        
        res2.on('data', (chunk) => {
          data2 += chunk;
        });
        
        res2.on('end', () => {
          if (res2.statusCode === 200) {
            console.log('✅ API is accessible!');
            console.log(`   Status: ${res2.statusCode}`);
            try {
              const json2 = JSON.parse(data2);
              console.log(`   Endpoints available:`);
              Object.entries(json2.endpoints || {}).forEach(([key, value]) => {
                console.log(`      - ${key}: ${value}`);
              });
            } catch (e) {
              console.log(`   Response: ${data2.substring(0, 100)}`);
            }
            
            console.log('\n✅ All tests passed!');
            console.log('\n📱 Your React Native app should be able to connect.');
            console.log('   If you still see errors, check:');
            console.log('   1. .env file has correct EXPO_PUBLIC_API_URL');
            console.log('   2. Restart Expo app after changing .env');
            console.log('   3. Check Android emulator network settings');
            
          } else {
            console.log(`⚠️  API returned status ${res2.statusCode}`);
            console.log(`   Response: ${data2}`);
          }
        });
      }).on('error', (err) => {
        console.error('❌ API endpoint not accessible:', err.message);
      });
      
    } else {
      console.log(`⚠️  Server returned status ${res.statusCode}`);
      console.log(`   Response: ${data}`);
    }
  });
}).on('error', (err) => {
  console.error('❌ Server is not reachable!');
  console.error(`   Error: ${err.message}`);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Check if backend server is running:');
  console.log('      cd backend && node src/server.js');
  console.log('   2. Verify IP address in .env file');
  console.log('   3. Check if port 8000 is open');
  console.log('   4. Ensure firewall allows connections');
  console.log('   5. Try: http://localhost:8000 if on same machine');
});
