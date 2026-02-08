const mongoose = require('mongoose');

const RecommendationSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'urgent_markdown',
      'moderate_markdown',
      'reduce_order',
      'restock_soon',
      'overstocked',
      'monitor_closely'
    ]
  },
  priority: {
    type: String,
    required: true,
    enum: ['critical', 'high', 'medium', 'low']
  },
  message: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: 'information-circle'
  }
}, { _id: false });

const PredictionSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Forecast Data
  forecast: {
    next7Days: { type: Number, default: 0 },
    next14Days: { type: Number, default: 0 },
    next30Days: { type: Number, default: 0 },
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'low'
    }
  },
  
  // Metrics
  metrics: {
    velocity: { type: Number, default: 0 },              // Units per day
    movingAverage: { type: Number, default: 0 },         // 7-day moving average
    trend: {
      type: String,
      enum: ['increasing', 'stable', 'decreasing'],
      default: 'stable'
    },
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    daysUntilStockout: { type: Number, default: 999 },
    salesLast30Days: { type: Number, default: 0 }
  },
  
  // Recommendations
  recommendations: [RecommendationSchema],
  
  // Metadata
  calculatedAt: { type: Date, default: Date.now },
  dataPoints: { type: Number, default: 0 },              // Number of sales records used
  
  // Warning for low confidence
  warning: { type: String, default: null },
  
  // Additional metadata
  metadata: {
    usedCategoryFallback: { type: Boolean, default: false },
    originalDataPoints: { type: Number }
  }
  
}, { 
  timestamps: true
});

// Indexes for performance
PredictionSchema.index({ productId: 1 });
PredictionSchema.index({ 'metrics.riskScore': -1 });
PredictionSchema.index({ calculatedAt: -1 });
PredictionSchema.index({ 'metrics.velocity': -1 });

// Static method to get urgent predictions
PredictionSchema.statics.getUrgentPredictions = async function() {
  return this.find({
    $or: [
      { 'metrics.riskScore': { $gte: 70 } },
      { 'metrics.daysUntilStockout': { $lte: 7 } }
    ]
  })
  .populate('productId', 'name category imageUrl')
  .sort({ 'metrics.riskScore': -1 })
  .limit(10);
};

// Static method to get predictions by category
PredictionSchema.statics.getByCategoryWithProducts = async function(category) {
  const Product = mongoose.model('Product');
  
  // Get products in category
  const products = await Product.find({ category }).select('_id');
  const productIds = products.map(p => p._id);
  
  // Get predictions for those products
  return this.find({ productId: { $in: productIds } })
    .populate('productId', 'name category imageUrl totalQuantity')
    .sort({ 'metrics.riskScore': -1 });
};

module.exports = mongoose.model('Prediction', PredictionSchema);
