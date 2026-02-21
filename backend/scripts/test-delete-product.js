require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

// Configuration
const API_URL = process.env.API_URL || 'https://inventory-application-git-backend-otikanelsons-projects.vercel.app/api';
const JWT_TOKEN = process.env.TEST_JWT_TOKEN; // Set this in your .env file

if (!JWT_TOKEN) {
  console.error('❌ TEST_JWT_TOKEN not set in .env file');
  console.log('Please add: TEST_JWT_TOKEN=your_jwt_token_here');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${JWT_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testDeleteProduct() {
  try {
    console.log('🧪 Testing Delete Product Functionality\n');
    console.log('API URL:', API_URL);
    console.log('Token:', JWT_TOKEN.substring(0, 20) + '...\n');

    // Step 1: Create a test product
    console.log('1️⃣  Creating test product...');
    const createResponse = await axios.post(
      `${API_URL}/products`,
      {
        name: 'Test Product for Deletion',
        barcode: `TEST-DELETE-${Date.now()}`,
        category: 'Test',
        quantity: 1,
        price: 10,
        isPerishable: false,
        hasBarcode: true
      },
      { headers }
    );

    if (!createResponse.data.success) {
      console.error('❌ Failed to create test product:', createResponse.data);
      process.exit(1);
    }

    const productId = createResponse.data.data._id;
    console.log('✅ Created test product:', productId);
    console.log('   Name:', createResponse.data.data.name);
    console.log('   Barcode:', createResponse.data.data.barcode);

    // Step 2: Verify product exists
    console.log('\n2️⃣  Verifying product exists...');
    const getResponse = await axios.get(
      `${API_URL}/products/${productId}`,
      { headers }
    );

    if (!getResponse.data.success) {
      console.error('❌ Product not found after creation');
      process.exit(1);
    }

    console.log('✅ Product verified:', getResponse.data.data.name);

    // Step 3: Delete the product
    console.log('\n3️⃣  Deleting product...');
    const deleteResponse = await axios.delete(
      `${API_URL}/products/${productId}`,
      { headers }
    );

    if (!deleteResponse.data.success) {
      console.error('❌ Failed to delete product:', deleteResponse.data);
      process.exit(1);
    }

    console.log('✅ Product deleted successfully');
    console.log('   Message:', deleteResponse.data.message);

    // Step 4: Verify product is deleted
    console.log('\n4️⃣  Verifying product is deleted...');
    try {
      await axios.get(`${API_URL}/products/${productId}`, { headers });
      console.error('❌ Product still exists after deletion!');
      process.exit(1);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Product confirmed deleted (404 response)');
      } else {
        throw error;
      }
    }

    console.log('\n✅ All tests passed! Delete functionality is working correctly.\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Test failed with error:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testDeleteProduct();
