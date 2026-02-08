const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['critical_risk', 'stockout_warning', 'bulk_alert', 'restock_reminder'],
    required: true,
    index: true
  },
  
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    index: true
  },
  
  title: {
    type: String,
    required: true
  },
  
  message: {
    type: String,
    required: true
  },
  
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium',
    index: true
  },
  
  actionable: {
    action: {
      type: String,
      enum: ['apply_discount', 'restock', 'review', 'view_product']
    },
    params: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  dismissed: {
    type: Boolean,
    default: false
  },
  
  // User ID (for multi-user support in future)
  userId: {
    type: String,
    default: 'admin',
    index: true
  },
  
  // Metadata
  metadata: {
    riskScore: Number,
    daysUntilStockout: Number,
    recommendedDiscount: Number
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800, // 7 days TTL (auto-delete after 7 days)
    index: true
  }
});

// Compound indexes for common queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ productId: 1, type: 1 });

// Static method to get unread notifications
NotificationSchema.statics.getUnread = async function(userId = 'admin') {
  return this.find({
    userId,
    read: false,
    dismissed: false
  })
  .populate('productId', 'name category imageUrl')
  .sort({ priority: 1, createdAt: -1 }) // Critical first, then by date
  .limit(50);
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = async function(userId = 'admin') {
  return this.countDocuments({
    userId,
    read: false,
    dismissed: false
  });
};

// Static method to mark all as read
NotificationSchema.statics.markAllAsRead = async function(userId = 'admin') {
  return this.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );
};

// Static method to check if similar notification exists (prevent duplicates)
NotificationSchema.statics.existsSimilar = async function(productId, type, hoursAgo = 24) {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  
  return this.findOne({
    productId,
    type,
    createdAt: { $gte: cutoff }
  });
};

// Instance method to mark as read
NotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  return this.save();
};

// Instance method to dismiss
NotificationSchema.methods.dismiss = async function() {
  this.dismissed = true;
  return this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema);
