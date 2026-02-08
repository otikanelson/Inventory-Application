/**
 * Script to create database indexes for AI Prediction System
 * Run this after deploying the new models
 */

require('dotenv').config();
const mongoose = require('mongoose');
const colors = require('colors');

// Import models
const Prediction = require('../src/models/Prediction');
const Sale = require('../src/models/Sale');
const Product = require('../src/models/Product');

const createIndexes = async () => {
  try {
    console.log('Connecting to MongoDB...'.yellow);
    
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Connected to MongoDB'.green);
    console.log('Creating indexes...'.yellow);
    
    // Create Prediction indexes
    console.log('\n📊 Creating Prediction indexes...'.cyan);
    await Prediction.createIndexes();
    console.log('✓ Prediction indexes created'.green);
    
    // Create Sale indexes
    console.log('\n💰 Creating Sale indexes...'.cyan);
    await Sale.createIndexes();
    console.log('✓ Sale indexes created'.green);
    
    // Create Product indexes (if any new ones needed)
    console.log('\n📦 Creating Product indexes...'.cyan);
    await Product.createIndexes();
    console.log('✓ Product indexes created'.green);
    
    // List all indexes
    console.log('\n📋 Listing all indexes:'.yellow);
    
    const predictionIndexes = await Prediction.collection.getIndexes();
    console.log('\nPrediction indexes:'.cyan);
    console.log(JSON.stringify(predictionIndexes, null, 2));
    
    const saleIndexes = await Sale.collection.getIndexes();
    console.log('\nSale indexes:'.cyan);
    console.log(JSON.stringify(saleIndexes, null, 2));
    
    const productIndexes = await Product.collection.getIndexes();
    console.log('\nProduct indexes:'.cyan);
    console.log(JSON.stringify(productIndexes, null, 2));
    
    console.log('\n✅ All indexes created successfully!'.green.bold);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error creating indexes:'.red, error);
    process.exit(1);
  }
};

createIndexes();
