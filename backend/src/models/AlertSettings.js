// backend/src/models/AlertSettings.js
// Stores user-configurable alert thresholds

const mongoose = require('mongoose');

const AlertSettingsSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    unique: true,
    index: true
  },
  userId: { 
    type: String, 
    default: 'admin'
  },
  
  thresholds: {
    critical: { 
      type: Number, 
      default: 7, 
      min: 1, 
      max: 30 
    },
    highUrgency: { 
      type: Number, 
      default: 14, 
      min: 1, 
      max: 60 
    },
    earlyWarning: { 
      type: Number, 
      default: 30, 
      min: 1, 
      max: 90 
    },
  },
  
  notificationSettings: {
    enableCritical: { type: Boolean, default: true },
    enableHighUrgency: { type: Boolean, default: true },
    enableEarlyWarning: { type: Boolean, default: false },
    notificationTime: { type: String, default: '09:00' },
  },
  
}, { timestamps: true });

// Index for multi-tenant queries
AlertSettingsSchema.index({ storeId: 1, userId: 1 });

module.exports = mongoose.model('AlertSettings', AlertSettingsSchema);