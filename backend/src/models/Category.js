// backend/src/models/Category.js
// Admin-managed product categories with optional alert thresholds

const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  
  // Optional category-specific alert thresholds
  customAlertThresholds: {
    enabled: { type: Boolean, default: false },
    critical: { type: Number, default: null, min: 1, max: 30 },
    highUrgency: { type: Number, default: null, min: 1, max: 60 },
    earlyWarning: { type: Number, default: null, min: 1, max: 90 },
  },
  
  // Metadata
  productCount: { type: Number, default: 0 }, // Cached count of products in this category
  createdBy: { type: String, default: 'admin' },
  
}, { timestamps: true });

module.exports = mongoose.model('Category', CategorySchema);
