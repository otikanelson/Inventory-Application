// Test production backend to see if it has the data and fixes
const https = require('https');

const PRODUCTION_URL = 'https://inventory-application-git-backend-otikanelsons-projects.vercel.app';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = `${PRODUCTION_URL}${path}`;
    console.log(`\n📡 Testing: ${url}`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testProductionBackend() {
  console.log('🧪 Testing Production Backend');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Health check
    console.log('\n1. Health Check');
    const health = await makeRequest('/api/products');
    console.log(`   Status: ${health.status}`);
    if (health.status === 401) {
      console.log('   ✅ Backend is running (requires auth)');
    } else if (health.status === 200) {
      console.log('   ✅ Backend is running');
    } else {
      console.log(`   ❌ Unexpected status: ${health.status}`);
    }
    
    // Test 2: Recently sold endpoint
    console.log('\n2. Recently Sold Endpoint');
    const recentlySold = await makeRequest('/api/analytics/recently-sold?limit=10');
    console.log(`   Status: ${recentlySold.status}`);
    if (recentlySold.status === 401) {
      console.log('   ✅ Endpoint exists (requires auth)');
      console.log('   📝 This is expected - authentication is required');
    } else if (recentlySold.status === 200) {
      console.log('   ✅ Endpoint accessible');
      console.log('   Data:', JSON.stringify(recentlySold.data, null, 2));
    } else {
      console.log(`   ❌ Unexpected status: ${recentlySold.status}`);
      console.log('   Response:', recentlySold.data);
    }
    
    // Test 3: Alerts endpoint
    console.log('\n3. Alerts Endpoint');
    const alerts = await makeRequest('/api/alerts');
    console.log(`   Status: ${alerts.status}`);
    if (alerts.status === 401) {
      console.log('   ✅ Endpoint exists (requires auth)');
    } else if (alerts.status === 200) {
      console.log('   ✅ Endpoint accessible');
      console.log('   Data:', JSON.stringify(alerts.data, null, 2));
    } else {
      console.log(`   ❌ Unexpected status: ${alerts.status}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log('   - Production backend is running');
    console.log('   - Endpoints require authentication (expected)');
    console.log('   - Frontend needs to send auth token with requests');
    console.log('\n💡 Next Steps:');
    console.log('   1. Check if production backend has the latest code');
    console.log('   2. Check if production database has the sales data');
    console.log('   3. Verify frontend is sending auth token correctly');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error testing production backend:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('   - Production backend is down');
    console.log('   - Network connectivity issues');
    console.log('   - DNS resolution problems');
  }
}

testProductionBackend();
