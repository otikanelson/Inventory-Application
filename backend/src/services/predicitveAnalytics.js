const Sale = require('../models/Sale');
const Product = require('../models/Product');

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
 */
const getPredictiveAnalytics = async (productId) => {
  try {
    // Get product details
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    
    // Get sales history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const salesHistory = await Sale.find({
      productId: productId,
      saleDate: { $gte: thirtyDaysAgo }
    }).sort({ saleDate: 1 });
    
    // Extract daily quantities
    const dailyQuantities = salesHistory.map(s => s.quantitySold);
    
    // Calculate metrics
    const velocity = calculateVelocity(salesHistory, 30);
    const movingAvg = calculateMovingAverage(dailyQuantities, 7);
    const trend = calculateTrend(dailyQuantities);
    const riskScore = calculateExpiryRisk(product, velocity);
    
    // Forecast next 7 days demand
    const predictedDemand = Math.round(movingAvg * 7);
    
    // Calculate days until stockout
    const daysUntilStockout = velocity > 0 
      ? Math.ceil(product.totalQuantity / velocity)
      : 999;
    
    // Generate forecast object
    const forecast = {
      next7Days: predictedDemand,
      next14Days: Math.round(movingAvg * 14),
      next30Days: Math.round(movingAvg * 30),
      confidence: salesHistory.length >= 14 ? 'high' : salesHistory.length >= 7 ? 'medium' : 'low',
      predicted: predictedDemand
    };
    
    // Generate recommendations
    const recommendations = generateRecommendations(product, velocity, riskScore, forecast);
    
    return {
      productId: product._id,
      productName: product.name,
      currentStock: product.totalQuantity,
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