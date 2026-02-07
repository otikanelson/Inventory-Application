const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Product = require('../src/models/Product');
const Sale = require('../src/models/Sale');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Sample products with batches
const sampleProducts = [
  {
    name: 'Organic Milk',
    category: 'Dairy',
    isPerishable: true,
    hasBarcode: true,
    barcode: '1234567890123',
    genericPrice: 4.99,
    imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400',
    batches: [
      {
        batchNumber: 'MILK-001',
        quantity: 50,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        price: 4.50
      },
      {
        batchNumber: 'MILK-002',
        quantity: 30,
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        price: 4.50
      }
    ],
    thresholdValue: 20,
    demandRate: 15
  },
  {
    name: 'Whole Wheat Bread',
    category: 'Bakery',
    isPerishable: true,
    hasBarcode: true,
    barcode: '2345678901234',
    genericPrice: 3.49,
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400',
    batches: [
      {
        batchNumber: 'BREAD-001',
        quantity: 25,
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        price: 3.00
      }
    ],
    thresholdValue: 15,
    demandRate: 10
  },
  {
    name: 'Fresh Apples',
    category: 'Produce',
    isPerishable: true,
    hasBarcode: true,
    barcode: '3456789012345',
    genericPrice: 2.99,
    imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400',
    batches: [
      {
        batchNumber: 'APPLE-001',
        quantity: 100,
        expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        price: 2.50
      },
      {
        batchNumber: 'APPLE-002',
        quantity: 75,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        price: 2.50
      }
    ],
    thresholdValue: 50,
    demandRate: 25
  },
  {
    name: 'Canned Beans',
    category: 'Canned Goods',
    isPerishable: false,
    hasBarcode: true,
    barcode: '4567890123456',
    genericPrice: 1.99,
    imageUrl: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400',
    batches: [
      {
        batchNumber: 'BEANS-001',
        quantity: 200,
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        price: 1.50
      }
    ],
    thresholdValue: 30,
    demandRate: 8
  },
  {
    name: 'Orange Juice',
    category: 'Beverages',
    isPerishable: true,
    hasBarcode: true,
    barcode: '5678901234567',
    genericPrice: 5.49,
    imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    batches: [
      {
        batchNumber: 'OJ-001',
        quantity: 40,
        expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        price: 5.00
      }
    ],
    thresholdValue: 15,
    demandRate: 12
  },
  {
    name: 'Pasta',
    category: 'Dry Goods',
    isPerishable: false,
    hasBarcode: true,
    barcode: '6789012345678',
    genericPrice: 2.49,
    imageUrl: 'https://images.unsplash.com/photo-1551462147-37bd170bca71?w=400',
    batches: [
      {
        batchNumber: 'PASTA-001',
        quantity: 150,
        expiryDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years from now
        price: 2.00
      }
    ],
    thresholdValue: 40,
    demandRate: 18
  }
];

// Generate historical sales data
const generateSalesData = (products) => {
  const sales = [];
  const now = new Date();
  
  products.forEach(product => {
    // Generate 10-30 sales per product over the last 60 days
    const numSales = Math.floor(Math.random() * 20) + 10;
    
    for (let i = 0; i < numSales; i++) {
      // Random date within last 60 days
      const daysAgo = Math.floor(Math.random() * 60);
      const saleDate = new Date(now);
      saleDate.setDate(saleDate.getDate() - daysAgo);
      
      // Random quantity between 1 and 10
      const quantitySold = Math.floor(Math.random() * 10) + 1;
      
      // Use product's generic price with slight variation
      const priceAtSale = product.genericPrice * (0.9 + Math.random() * 0.2);
      
      sales.push({
        productId: product._id,
        productName: product.name,
        category: product.category,
        quantitySold: quantitySold,
        priceAtSale: parseFloat(priceAtSale.toFixed(2)),
        totalAmount: parseFloat((quantitySold * priceAtSale).toFixed(2)),
        saleDate: saleDate,
        paymentMethod: ['cash', 'card', 'transfer'][Math.floor(Math.random() * 3)]
      });
    }
  });
  
  return sales;
};

// Seed function
const seedData = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing data...');
    await Product.deleteMany({});
    await Sale.deleteMany({});
    
    console.log('📦 Creating sample products...');
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${createdProducts.length} products`);
    
    console.log('💰 Generating sales history...');
    const salesData = generateSalesData(createdProducts);
    const createdSales = await Sale.insertMany(salesData);
    console.log(`✅ Created ${createdSales.length} sales records`);
    
    console.log('\n📊 Summary:');
    console.log(`   Products: ${createdProducts.length}`);
    console.log(`   Sales: ${createdSales.length}`);
    console.log(`   Total Revenue: $${salesData.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}`);
    
    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

// Run seeder
seedData();
