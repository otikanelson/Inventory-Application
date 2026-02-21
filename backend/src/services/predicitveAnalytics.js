const Sale = require('../models/Sale');
const Product = require('../models/Product');
const tensorflowService = require('./tensorflowService');

// TensorFlow feature flag (can be toggled via environment variable)
const USE_TENSORFLOW = process.env.USE_TENSORFLOW === 'true' || false;

/**
 * Calculate moving average for demand forecasting
 * @param {Array} data - Array of sales quantities
 * @param {Number} period - Number of periods to average (default 7 days)
 */
const calculateMovingAverage = (data, period = 7) => {
  if (data.length < period) return data.reduce((a, b) => a + b, 0) / data.length;
  
  const recent = data.slice(-period);
  return recent.reduce((a, b) => a + b, 0) / period;
};

/**
 * Calculate trend (increasing, stable, decreasing)
 * @param {Array} data - Array of sales quantities
 */
const calculateTrend = (data) => {
  if (data.length < 2) return 'stable';
  
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 10) return 'increasing';
  if (change < -10) return 'decreasing';
  return 'stable';
};

/**
 * Calculate demand velocity (units per day)
 * @param {Array} salesData - Sales history
 * @param {Number} days - Number of days to analyze
 */
const calculateVelocity = (salesData, days = 30) => {
  if (!salesData || salesData.length === 0) return 0;
  
  const totalSold = salesData.reduce((sum, sale) => sum + sale.quantitySold, 0);
  return totalSold / days;
};

/**
 * Calculate expiry risk score (0-100)
 * Higher score = higher risk of expiring
 */
const calculateExpiryRisk = (product, velocity) => {
  let risk = 0;
  
  // Get earliest expiry batch
  const batches = product.batches || [];
  if (batches.length === 0) return 0;
  
  const sortedBatches = [...batches]
    .filter(b => b.expiryDate)
    .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  
  if (sortedBatches.length === 0) return 0;
  
  const earliestBatch = sortedBatches[0];
  const daysUntilExpiry = Math.ceil(
    (new Date(earliestBatch.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  );
  
  // Risk factor 1: Days until expiry (40 points)
  if (daysUntilExpiry < 0) risk += 40; // Already expired
  else if (daysUntilExpiry <= 3) risk += 35;
  else if (daysUntilExpiry <= 7) risk += 25;
  else if (daysUntilExpiry <= 14) risk += 15;
  else if (daysUntilExpiry <= 30) risk += 5;
  
  // Risk factor 2: Demand velocity (30 points)
  const daysToSellOut = velocity > 0 ? product.totalQuantity / velocity : 999;
  if (daysToSellOut > daysUntilExpiry) risk += 30; // Won't sell in time
  else if (daysToSellOut > daysUntilExpiry * 0.8) risk += 20;
  else if (daysToSellOut > daysUntilExpiry * 0.5) risk += 10;
  
  // Risk factor 3: Quantity vs demand (30 points)
  const excessStock = product.totalQuantity - (velocity * 7); // Week's worth
  if (excessStock > product.totalQuantity * 0.5) risk += 30;
  else if (excessStock > product.totalQuantity * 0.3) risk += 20;
  else if (excessStock > 0) risk += 10;
  
  return Math.min(100, Math.round(risk));
};

/**
 * Generate action recommendations based on risk and velocity
 */
const generateRecommendations = (product, velocity, riskScore, forecast) => {
  const recommendations = [];
  
  // High risk products
  if (riskScore >= 70) {
    recommendations.push({
      action: 'urgent_markdown',
      priority: 'critical',
      message: `Apply 30-50% discount immediately. ${Math.ceil(product.totalQuantity / (velocity || 1))} days to sell at current rate.`,
      icon: 'alert-circle'
    });
  } else if (riskScore >= 50) {
    recommendations.push({
      action: 'moderate_markdown',
      priority: 'high',
      message: `Consider 15-30% discount. Monitor closely for next 7 days.`,
      icon: 'warning'
    });
  }
  
  // Low velocity products
  if (velocity < 0.5 && product.totalQuantity > 5) {
    recommendations.push({
      action: 'reduce_order',
      priority: 'medium',
      message: `Slow-moving item. Reduce next order quantity by 50%.`,
      icon: 'trending-down'
    });
  }
  
  // High demand products
  if (velocity > 5 && product.totalQuantity < velocity * 3) {
    recommendations.push({
      action: 'restock_soon',
      priority: 'high',
      message: `High demand! Restock within ${Math.ceil(product.totalQuantity / velocity)} days.`,
      icon: 'trending-up'
    });
  }
  
  // Forecast-based recommendations
  if (forecast.predicted < product.totalQuantity * 0.3) {
    recommendations.push({
      action: 'overstocked',
      priority: 'medium',
      message: `Predicted demand lower than current stock. Consider promotions.`,
      icon: 'archive'
    });
  }
  
  return recommendations;
};

/**
 * Main function: Get predictive analytics for a product
 * Uses TensorFlow LSTM if enabled and sufficient data exists, otherwise falls back to statistical methods
 */
const getPredictiveAnalytics = async (productId) => {
  try {
    // Get product details
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    
    // Get sales history (last 30 days for statistical, 90 for TensorFlow)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesHistory = await Sale.find({
      productId: productId,
      saleDate: { $gte: thirtyDaysAgo }
    }).sort({ saleDate: 1 });
    
    // Extract daily quantities
    const dailyQuantities = salesHistory.map(s => s.quantitySold);
    
    // Calculate basic metrics (always needed)
    const velocity = calculateVelocity(salesHistory, 30);
    const movingAvg = calculateMovingAverage(dailyQuantities, 7);
    const trend = calculateTrend(dailyQuantities);
    const riskScore = calculateExpiryRisk(product, velocity);
    
    // Calculate days until stockout
    const daysUntilStockout = velocity > 0 
      ? Math.ceil(product.totalQuantity / velocity)
      : 999;
    
    let forecast;
    let modelType = 'statistical';
    
    // Try TensorFlow prediction if enabled and sufficient data
    if (USE_TENSORFLOW && salesHistory.length >= 14) {
      try {
        console.log(`Attempting TensorFlow forecast for product ${productId}...`);
        const tfForecast = await tensorflowService.getTensorFlowForecast(productId, 30);
        
        if (tfForecast) {
          forecast = {
            next7Days: tfForecast.next7Days,
            next14Days: tfForecast.next14Days,
            next30Days: tfForecast.next30Days,
            confidence: tfForecast.confidence,
            predicted: tfForecast.next7Days,
            dailyPredictions: tfForecast.dailyPredictions
          };
          modelType = 'LSTM';
          console.log(`✅ TensorFlow forecast successful for ${productId}`);
        } else {
          throw new Error('TensorFlow forecast returned null');
        }
      } catch (tfError) {
        console.log(`TensorFlow forecast failed, using statistical fallback: ${tfError.message}`);
        // Fall through to statistical method
      }
    }
    
    // Fallback to statistical forecast if TensorFlow not used or failed
    if (!forecast) {
      const predictedDemand = Math.round(movingAvg * 7);
      forecast = {
        next7Days: predictedDemand,
        next14Days: Math.round(movingAvg * 14),
        next30Days: Math.round(movingAvg * 30),
        confidence: salesHistory.length >= 14 ? 'high' : salesHistory.length >= 7 ? 'medium' : 'low',
        predicted: predictedDemand
      };
    }
    
    // Generate recommendations
    const recommendations = generateRecommendations(product, velocity, riskScore, forecast);
    
    return {
      productId: product._id,
      productName: product.name,
      currentStock: product.totalQuantity,
      modelType, // 'LSTM' or 'statistical'
      metrics: {
        velocity: Math.round(velocity * 10) / 10, // Units per day
        movingAverage: Math.round(movingAvg * 10) / 10,
        trend: trend,
        riskScore: riskScore,
        daysUntilStockout: daysUntilStockout,
        salesLast30Days: salesHistory.reduce((sum, s) => sum + s.quantitySold, 0)
      },
      forecast: forecast,
      recommendations: recommendations,
      salesHistory: salesHistory.map(s => ({
        date: s.saleDate,
        quantity: s.quantitySold,
        amount: s.totalAmount
      }))
    };
    
  } catch (error) {
    throw new Error(`Analytics error: ${error.message}`);
  }
};

/**
 * Get analytics for all products (Dashboard overview)
 */
const getDashboardAnalytics = async () => {
  try {
    const products = await Product.find();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all sales in one query for efficiency
    const allSales = await Sale.find({
      saleDate: { $gte: thirtyDaysAgo }
    });
    
    // Group sales by product
    const salesByProduct = {};
    allSales.forEach(sale => {
      const key = sale.productId.toString();
      if (!salesByProduct[key]) salesByProduct[key] = [];
      salesByProduct[key].push(sale);
    });
    
    // Calculate analytics for each product
    const analytics = [];
    
    for (const product of products) {
      const productSales = salesByProduct[product._id.toString()] || [];
      const velocity = calculateVelocity(productSales, 30);
      const riskScore = calculateExpiryRisk(product, velocity);
      
      analytics.push({
        productId: product._id,
        productName: product.name,
        category: product.category,
        currentStock: product.totalQuantity,
        velocity: Math.round(velocity * 10) / 10,
        riskScore: riskScore,
        trend: calculateTrend(productSales.map(s => s.quantitySold)),
        salesCount: productSales.length
      });
    }
    
    // Sort by risk score (highest first)
    analytics.sort((a, b) => b.riskScore - a.riskScore);
    
    // Calculate summary stats
    const summary = {
      totalProducts: products.length,
      highRiskProducts: analytics.filter(a => a.riskScore >= 70).length,
      mediumRiskProducts: analytics.filter(a => a.riskScore >= 40 && a.riskScore < 70).length,
      lowRiskProducts: analytics.filter(a => a.riskScore < 40).length,
      totalSales: allSales.reduce((sum, s) => sum + s.totalAmount, 0),
      totalUnitsSold: allSales.reduce((sum, s) => sum + s.quantitySold, 0),
      averageVelocity: analytics.reduce((sum, a) => sum + a.velocity, 0) / analytics.length,
      topRiskProducts: analytics.slice(0, 10),
      topSellingProducts: [...analytics].sort((a, b) => b.velocity - a.velocity).slice(0, 10)
    };
    
    return {
      summary,
      productAnalytics: analytics
    };
    
  } catch (error) {
    throw new Error(`Dashboard analytics error: ${error.message}`);
  }
};

module.exports = {
  getPredictiveAnalytics,
  getDashboardAnalytics,
  calculateMovingAverage,
  calculateTrend,
  calculateVelocity,
  calculateExpiryRisk
};


// ============================================================================
// REAL-TIME PREDICTION UPDATES (NEW)
// ============================================================================

const Prediction = require('../models/Prediction');
const Notification = require('../models/Notification');

/**
 * Update prediction after a sale (Real-time with incremental calculation)
 * @param {String} productId - Product ID
 * @param {Object} saleData - Sale transaction data
 */
const updatePredictionAfterSale = async (productId, saleData) => {
  try {
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      console.error(`Product ${productId} not found for prediction update`);
      return null;
    }
    
    // Get existing prediction
    let prediction = await Prediction.findOne({ productId });
    
    if (!prediction) {
      // First sale - create new prediction
      return await savePredictionToDatabase(productId);
    }
    
    // INCREMENTAL UPDATE - Optimize by updating only what changed
    const now = new Date();
    const timeSinceLastCalc = (now - prediction.calculatedAt) / 1000; // seconds
    
    // If last calculation was < 5 seconds ago, use incremental update
    if (timeSinceLastCalc < 5) {
      console.log(`Using incremental update for ${productId}`);
      
      // Update metrics incrementally
      prediction.metrics.salesLast30Days += saleData.quantitySold;
      prediction.dataPoints += 1;
      
      // Recalculate velocity incrementally (weighted average)
      const oldVelocity = prediction.metrics.velocity;
      const newSaleVelocity = saleData.quantitySold; // Today's contribution
      prediction.metrics.velocity = (oldVelocity * 0.9) + (newSaleVelocity * 0.1); // Weighted
      
      // Update stockout days
      prediction.metrics.daysUntilStockout = prediction.metrics.velocity > 0 
        ? Math.ceil(product.totalQuantity / prediction.metrics.velocity)
        : 999;
      
      // Recalculate risk score (fast)
      prediction.metrics.riskScore = calculateExpiryRisk(product, prediction.metrics.velocity);
      
      // Update forecast incrementally
      const avgDailyDemand = prediction.metrics.movingAverage || prediction.metrics.velocity;
      prediction.forecast.next7Days = Math.round(avgDailyDemand * 7);
      prediction.forecast.next14Days = Math.round(avgDailyDemand * 14);
      prediction.forecast.next30Days = Math.round(avgDailyDemand * 30);
      
      prediction.calculatedAt = now;
      
    } else {
      // Full recalculation if it's been a while
      console.log(`Full recalculation for ${productId}`);
      
      const salesHistory = await Sale.find({
        productId,
        saleDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });
      
      const velocity = calculateVelocity(salesHistory, 30);
      const dailyQuantities = salesHistory.map(s => s.quantitySold);
      const movingAvg = calculateMovingAverage(dailyQuantities, 7);
      const trend = calculateTrend(dailyQuantities);
      const riskScore = calculateExpiryRisk(product, velocity);
      
      prediction.metrics = {
        velocity: Math.round(velocity * 10) / 10,
        movingAverage: Math.round(movingAvg * 10) / 10,
        trend,
        riskScore,
        daysUntilStockout: velocity > 0 ? Math.ceil(product.totalQuantity / velocity) : 999,
        salesLast30Days: salesHistory.reduce((sum, s) => sum + s.quantitySold, 0)
      };
      
      prediction.forecast = {
        next7Days: Math.round(movingAvg * 7),
        next14Days: Math.round(movingAvg * 14),
        next30Days: Math.round(movingAvg * 30),
        confidence: salesHistory.length >= 14 ? 'high' : salesHistory.length >= 7 ? 'medium' : 'low'
      };
      
      prediction.dataPoints = salesHistory.length;
      prediction.calculatedAt = now;
    }
    
    // Regenerate recommendations (always, as they depend on current state)
    prediction.recommendations = generateRecommendations(
      product,
      prediction.metrics.velocity,
      prediction.metrics.riskScore,
      prediction.forecast
    );
    
    await prediction.save();
    
    // Check if notification should be sent
    await checkAndSendNotification(product, prediction);
    
    return prediction;
    
  } catch (error) {
    console.error(`Error updating prediction for ${productId}:`, error);
    return null;
  }
};

/**
 * Save full prediction to database with low-confidence handling
 * @param {String} productId - Product ID
 */
const savePredictionToDatabase = async (productId) => {
  try {
    const analyticsData = await getPredictiveAnalytics(productId);
    
    // Get product to retrieve storeId
    const product = await Product.findById(productId);
    if (!product) {
      console.error(`Product not found: ${productId}`);
      return null;
    }
    
    const storeId = product.storeId;
    if (!storeId) {
      console.error(`Product ${productId} has no storeId`);
      return null;
    }
    
    // Check if prediction already exists
    let prediction = await Prediction.findOne({ productId });
    
    // LOW-CONFIDENCE HANDLING
    const dataPoints = analyticsData.salesHistory.length;
    const confidence = analyticsData.forecast.confidence;
    let warning = null;
    let usedFallback = false;
    
    // Detect insufficient data (< 7 days)
    if (dataPoints < 7) {
      console.log(`Low confidence for product ${productId}: only ${dataPoints} data points`);
      
      // Try to use category averages as fallback
      if (product.category) {
        const categoryFallback = await getCategoryAverageFallback(product.category, productId);
        
        if (categoryFallback) {
          // Use category averages
          analyticsData.metrics.velocity = categoryFallback.avgVelocity;
          analyticsData.metrics.movingAverage = categoryFallback.avgVelocity;
          analyticsData.forecast.next7Days = Math.round(categoryFallback.avgVelocity * 7);
          analyticsData.forecast.next14Days = Math.round(categoryFallback.avgVelocity * 14);
          analyticsData.forecast.next30Days = Math.round(categoryFallback.avgVelocity * 30);
          
          usedFallback = true;
          warning = `Limited sales data (${dataPoints} days). Using ${product.category} category average (${Math.round(categoryFallback.avgVelocity * 10) / 10} units/day) as estimate. Predictions will improve with more sales.`;
        } else {
          warning = `Only ${dataPoints} days of sales data available. Predictions may be less accurate. More data needed for reliable forecasts.`;
        }
      } else {
        warning = `Only ${dataPoints} days of sales data available. Predictions may be less accurate. More data needed for reliable forecasts.`;
      }
    } else if (confidence === 'low') {
      warning = `Limited sales history (${dataPoints} days). Predictions may be less accurate.`;
    }
    
    if (prediction) {
      // Update existing - sanitize NaN values
      prediction.forecast = {
        next7Days: isNaN(analyticsData.forecast.next7Days) ? 0 : analyticsData.forecast.next7Days,
        next14Days: isNaN(analyticsData.forecast.next14Days) ? 0 : analyticsData.forecast.next14Days,
        next30Days: isNaN(analyticsData.forecast.next30Days) ? 0 : analyticsData.forecast.next30Days,
        confidence: analyticsData.forecast.confidence
      };
      prediction.metrics = {
        velocity: isNaN(analyticsData.metrics.velocity) ? 0 : analyticsData.metrics.velocity,
        movingAverage: isNaN(analyticsData.metrics.movingAverage) ? 0 : analyticsData.metrics.movingAverage,
        trend: analyticsData.metrics.trend,
        riskScore: isNaN(analyticsData.metrics.riskScore) ? 0 : analyticsData.metrics.riskScore,
        daysUntilStockout: isNaN(analyticsData.metrics.daysUntilStockout) ? 999 : analyticsData.metrics.daysUntilStockout,
        salesLast30Days: isNaN(analyticsData.metrics.salesLast30Days) ? 0 : analyticsData.metrics.salesLast30Days
      };
      prediction.recommendations = analyticsData.recommendations;
      prediction.calculatedAt = new Date();
      prediction.dataPoints = dataPoints;
      prediction.warning = warning;
      
      // Add metadata about fallback usage
      if (usedFallback) {
        prediction.metadata = {
          usedCategoryFallback: true,
          originalDataPoints: dataPoints
        };
      }
    } else {
      // Create new
      prediction = new Prediction({
        storeId, // Add storeId
        productId,
        forecast: {
          next7Days: isNaN(analyticsData.forecast.next7Days) ? 0 : analyticsData.forecast.next7Days,
          next14Days: isNaN(analyticsData.forecast.next14Days) ? 0 : analyticsData.forecast.next14Days,
          next30Days: isNaN(analyticsData.forecast.next30Days) ? 0 : analyticsData.forecast.next30Days,
          confidence: analyticsData.forecast.confidence
        },
        metrics: {
          velocity: isNaN(analyticsData.metrics.velocity) ? 0 : analyticsData.metrics.velocity,
          movingAverage: isNaN(analyticsData.metrics.movingAverage) ? 0 : analyticsData.metrics.movingAverage,
          trend: analyticsData.metrics.trend,
          riskScore: isNaN(analyticsData.metrics.riskScore) ? 0 : analyticsData.metrics.riskScore,
          daysUntilStockout: isNaN(analyticsData.metrics.daysUntilStockout) ? 999 : analyticsData.metrics.daysUntilStockout,
          salesLast30Days: isNaN(analyticsData.metrics.salesLast30Days) ? 0 : analyticsData.metrics.salesLast30Days
        },
        recommendations: analyticsData.recommendations,
        dataPoints,
        warning,
        metadata: usedFallback ? {
          usedCategoryFallback: true,
          originalDataPoints: dataPoints
        } : undefined
      });
    }
    
    // Validate before saving to catch any remaining NaN values
    const predictionObj = prediction.toObject ? prediction.toObject() : prediction;
    const hasNaN = Object.values(predictionObj.metrics || {}).some(v => typeof v === 'number' && isNaN(v)) ||
                   Object.values(predictionObj.forecast || {}).some(v => typeof v === 'number' && isNaN(v));
    
    if (hasNaN) {
      console.error(`NaN detected in prediction for ${productId}, skipping save:`, {
        metrics: predictionObj.metrics,
        forecast: predictionObj.forecast
      });
      return null;
    }
    
    await prediction.save();
    console.log(`Prediction saved successfully for product ${productId}`);
    return prediction;
    
  } catch (error) {
    console.error(`Error saving prediction for ${productId}:`, error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation details:', error.errors);
    }
    return null;
  }
};

/**
 * Get category average as fallback for low-confidence predictions
 * @param {String} category - Category name
 * @param {String} excludeProductId - Product ID to exclude from average
 */
const getCategoryAverageFallback = async (category, excludeProductId) => {
  try {
    // Get all products in same category (excluding current product)
    const products = await Product.find({ 
      category,
      _id: { $ne: excludeProductId }
    });
    
    if (products.length === 0) {
      return null; // No other products in category
    }
    
    // Get predictions for these products
    const predictions = await Prediction.find({
      productId: { $in: products.map(p => p._id) },
      dataPoints: { $gte: 7 } // Only use products with sufficient data
    });
    
    if (predictions.length === 0) {
      return null; // No reliable predictions in category
    }
    
    // Calculate average velocity
    const avgVelocity = predictions.reduce((sum, p) => sum + p.metrics.velocity, 0) / predictions.length;
    const avgRiskScore = predictions.reduce((sum, p) => sum + p.metrics.riskScore, 0) / predictions.length;
    
    return {
      avgVelocity: Math.round(avgVelocity * 10) / 10,
      avgRiskScore: Math.round(avgRiskScore),
      sampleSize: predictions.length
    };
    
  } catch (error) {
    console.error(`Error getting category fallback for ${category}:`, error);
    return null;
  }
};

/**
 * Get quick insights for dashboard badge
 * Returns only urgent items (risk > 70 or stockout < 7 days)
 * @param {String} storeId - Store ID to filter predictions
 */
const getQuickInsights = async (storeId = null) => {
  try {
    const query = {
      $or: [
        { 'metrics.riskScore': { $gte: 70 } },
        { 'metrics.daysUntilStockout': { $lte: 7 } }
      ]
    };
    
    // Add storeId filter if provided
    if (storeId) {
      query.storeId = storeId;
      console.log('getQuickInsights - Filtering by storeId:', storeId);
    }
    
    const urgentPredictions = await Prediction.find(query)
    .populate('productId', 'name category imageUrl')
    .sort({ 'metrics.riskScore': -1 })
    .limit(10)
    .lean();
    
    console.log('getQuickInsights - Found', urgentPredictions.length, 'urgent predictions');
    
    // Format for lightweight response
    const criticalItems = urgentPredictions.map(p => ({
      productId: p.productId._id,
      productName: p.productId.name,
      riskScore: p.metrics.riskScore,
      daysUntilStockout: p.metrics.daysUntilStockout,
      recommendation: p.recommendations[0]?.message || 'Review product status'
    }));
    
    return {
      urgentCount: urgentPredictions.length,
      criticalItems,
      lastUpdate: new Date()
    };
    
  } catch (error) {
    console.error('Error getting quick insights:', error);
    return {
      urgentCount: 0,
      criticalItems: [],
      lastUpdate: new Date()
    };
  }
};

/**
 * Get category-level insights
 * @param {String} category - Category name
 * @param {String} storeId - Store ID to filter products and predictions
 */
const getCategoryInsights = async (category, storeId = null) => {
  try {
    // Get all products in category with optional storeId filter
    const productQuery = { category };
    if (storeId) {
      productQuery.storeId = storeId;
      console.log('getCategoryInsights - Filtering products by storeId:', storeId);
    }
    
    const products = await Product.find(productQuery);
    const productIds = products.map(p => p._id);
    
    console.log('getCategoryInsights - Found', products.length, 'products in category', category);
    
    // Get predictions for these products with optional storeId filter
    const predictionQuery = { productId: { $in: productIds } };
    if (storeId) {
      predictionQuery.storeId = storeId;
    }
    
    const predictions = await Prediction.find(predictionQuery)
      .populate('productId', 'name totalQuantity imageUrl');
    
    console.log('getCategoryInsights - Found', predictions.length, 'predictions');
    
    // Calculate category metrics
    const totalProducts = predictions.length;
    const highRisk = predictions.filter(p => p.metrics.riskScore >= 70).length;
    const mediumRisk = predictions.filter(p => p.metrics.riskScore >= 40 && p.metrics.riskScore < 70).length;
    const lowRisk = predictions.filter(p => p.metrics.riskScore < 40).length;
    
    const avgVelocity = predictions.reduce((sum, p) => sum + p.metrics.velocity, 0) / totalProducts || 0;
    const avgRiskScore = predictions.reduce((sum, p) => sum + p.metrics.riskScore, 0) / totalProducts || 0;
    
    // Get top and bottom performers
    const sortedByVelocity = [...predictions].sort((a, b) => b.metrics.velocity - a.metrics.velocity);
    const topPerformers = sortedByVelocity.slice(0, 5);
    const bottomPerformers = sortedByVelocity.slice(-5).reverse();
    
    return {
      category,
      summary: {
        totalProducts,
        highRisk,
        mediumRisk,
        lowRisk,
        avgVelocity: Math.round(avgVelocity * 10) / 10,
        avgRiskScore: Math.round(avgRiskScore)
      },
      topPerformers: topPerformers.map(p => ({
        productId: p.productId._id,
        productName: p.productId.name,
        velocity: p.metrics.velocity,
        riskScore: p.metrics.riskScore
      })),
      bottomPerformers: bottomPerformers.map(p => ({
        productId: p.productId._id,
        productName: p.productId.name,
        velocity: p.metrics.velocity,
        riskScore: p.metrics.riskScore
      }))
    };
    
  } catch (error) {
    console.error(`Error getting category insights for ${category}:`, error);
    return null;
  }
};

/**
 * Batch update predictions for multiple products
 * @param {Array} productIds - Array of product IDs
 */
const batchUpdatePredictions = async (productIds) => {
  try {
    const promises = productIds.map(id => 
      savePredictionToDatabase(id).catch(err => {
        console.error(`Failed to update prediction for ${id}:`, err);
        return null;
      })
    );
    
    const results = await Promise.all(promises);
    return results.filter(r => r !== null);
    
  } catch (error) {
    console.error('Error in batch update:', error);
    return [];
  }
};

/**
 * Check if notification should be sent and send it
 * @param {Object} product - Product object
 * @param {Object} prediction - Prediction object
 */
const checkAndSendNotification = async (product, prediction) => {
  try {
    const { metrics, recommendations } = prediction;
    
    // Verify product has storeId
    if (!product.storeId) {
      console.error(`Product ${product._id} has no storeId, cannot create notification`);
      return;
    }
    
    // Check if similar notification was sent recently (prevent spam)
    const recentNotification = await Notification.existsSimilar(
      product._id,
      'critical_risk',
      product.storeId,
      24 // Last 24 hours
    );
    
    if (recentNotification) {
      return; // Don't send duplicate
    }
    
    // Critical risk notification
    if (metrics.riskScore >= 70) {
      await Notification.create({
        storeId: product.storeId,  // CRITICAL: Add storeId
        type: 'critical_risk',
        productId: product._id,
        title: 'Urgent: Product Expiring Soon',
        message: `${product.name} has high expiry risk (${metrics.riskScore}/100). ${recommendations[0]?.message || 'Take action immediately.'}`,
        priority: 'critical',
        actionable: {
          action: 'apply_discount',
          params: {
            recommendedDiscount: 30,
            daysUntilExpiry: Math.ceil((new Date(product.batches[0]?.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
          }
        },
        metadata: {
          riskScore: metrics.riskScore,
          daysUntilStockout: metrics.daysUntilStockout,
          recommendedDiscount: 30
        }
      });
      
      console.log(`Critical risk notification sent for ${product.name}`);
    }
    
    // Stockout warning notification
    else if (metrics.daysUntilStockout <= 3 && metrics.daysUntilStockout > 0) {
      const recentStockoutNotif = await Notification.existsSimilar(
        product._id,
        'stockout_warning',
        product.storeId,
        24
      );
      
      if (!recentStockoutNotif) {
        await Notification.create({
          storeId: product.storeId,  // CRITICAL: Add storeId
          type: 'stockout_warning',
          productId: product._id,
          title: 'Low Stock Alert',
          message: `${product.name} will run out in ${metrics.daysUntilStockout} days at current sales rate.`,
          priority: 'high',
          actionable: {
            action: 'restock',
            params: {
              daysUntilStockout: metrics.daysUntilStockout,
              recommendedQuantity: Math.ceil(metrics.velocity * 14) // 2 weeks supply
            }
          },
          metadata: {
            daysUntilStockout: metrics.daysUntilStockout,
            velocity: metrics.velocity
          }
        });
        
        console.log(`Stockout warning sent for ${product.name}`);
      }
    }
    
  } catch (error) {
    console.error('Error checking/sending notification:', error);
  }
};

/**
 * Initialize predictions for all products (run on startup or manually)
 */
const initializeAllPredictions = async () => {
  try {
    console.log('Initializing predictions for all products...');
    
    const products = await Product.find();
    console.log(`Found ${products.length} products`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        await savePredictionToDatabase(product._id);
        successCount++;
      } catch (error) {
        console.error(`Failed to initialize prediction for ${product.name}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Prediction initialization complete: ${successCount} success, ${errorCount} errors`);
    return { successCount, errorCount };
    
  } catch (error) {
    console.error('Error initializing predictions:', error);
    return { successCount: 0, errorCount: 0 };
  }
};

// Export new functions
module.exports = {
  // Existing exports
  getPredictiveAnalytics,
  getDashboardAnalytics,
  calculateMovingAverage,
  calculateTrend,
  calculateVelocity,
  calculateExpiryRisk,
  
  // New exports for real-time system
  updatePredictionAfterSale,
  savePredictionToDatabase,
  getQuickInsights,
  getCategoryInsights,
  batchUpdatePredictions,
  checkAndSendNotification,
  initializeAllPredictions,
  getCategoryAverageFallback
};
