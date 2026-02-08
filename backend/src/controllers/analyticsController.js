const { 
  getPredictiveAnalytics, 
  getDashboardAnalytics 
} = require('../services/predicitveAnalytics');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

/**
 * @desc    Get predictive analytics for a specific product
 * @route   GET /api/analytics/product/:productId
 * @access  Admin
 */
exports.getProductAnalytics = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const analytics = await getPredictiveAnalytics(productId);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Product Analytics Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get dashboard-level analytics for all products
 * @route   GET /api/analytics/dashboard
 * @access  Admin
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const analytics = await getDashboardAnalytics();
    
    res.status(200).json({
      success: true,
      data: analytics
    });
    
  } catch (error) {
    console.error('Dashboard Analytics Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get sales trends (for charts)
 * @route   GET /api/analytics/sales-trends
 * @access  Admin
 */
exports.getSalesTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Aggregate sales by date
    const salesByDate = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$saleDate' }
          },
          totalSales: { $sum: '$totalAmount' },
          totalUnits: { $sum: '$quantitySold' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Format for charts
    const chartData = salesByDate.map(day => ({
      date: day._id,
      sales: day.totalSales,
      units: day.totalUnits,
      transactions: day.transactionCount
    }));
    
    res.status(200).json({
      success: true,
      data: {
        period: `${days} days`,
        chartData: chartData,
        summary: {
          totalSales: salesByDate.reduce((sum, d) => sum + d.totalSales, 0),
          totalUnits: salesByDate.reduce((sum, d) => sum + d.totalUnits, 0),
          totalTransactions: salesByDate.reduce((sum, d) => sum + d.transactionCount, 0),
          averageDailySales: salesByDate.length > 0 
            ? salesByDate.reduce((sum, d) => sum + d.totalSales, 0) / salesByDate.length
            : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Sales Trends Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get category-wise analytics
 * @route   GET /api/analytics/by-category
 * @access  Admin
 */
exports.getCategoryAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get sales grouped by category
    const categoryData = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSales: { $sum: '$totalAmount' },
          totalUnits: { $sum: '$quantitySold' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalSales: -1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: categoryData.map(cat => ({
        category: cat._id || 'Uncategorized',
        sales: cat.totalSales,
        units: cat.totalUnits,
        transactions: cat.transactionCount
      }))
    });
    
  } catch (error) {
    console.error('Category Analytics Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Record a sale transaction
 * @route   POST /api/analytics/record-sale
 * @access  Staff/Admin
 */
exports.recordSale = async (req, res) => {
  try {
    const { productId, quantitySold, priceAtSale, paymentMethod } = req.body;
    
    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Create sale record
    const sale = await Sale.create({
      productId: product._id,
      productName: product.name,
      category: product.category,
      quantitySold: quantitySold,
      priceAtSale: priceAtSale,
      totalAmount: quantitySold * priceAtSale,
      paymentMethod: paymentMethod || 'cash',
      saleDate: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: sale
    });
    
  } catch (error) {
    console.error('Record Sale Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get recently sold products
 * @route   GET /api/analytics/recently-sold
 * @access  Admin
 */
exports.getRecentlySold = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent sales with product details
    const recentSales = await Sale.aggregate([
      {
        $sort: { saleDate: -1 }
      },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          category: { $first: '$category' },
          lastSaleDate: { $first: '$saleDate' },
          totalSold: { $sum: '$quantitySold' },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { lastSaleDate: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: recentSales
        .filter(sale => sale.productDetails) // Filter out deleted products
        .map(sale => ({
          _id: sale._id,
          name: sale.productName,
          category: sale.category,
          lastSaleDate: sale.lastSaleDate,
          totalSold: sale.totalSold,
          totalRevenue: sale.totalRevenue,
          imageUrl: sale.productDetails?.imageUrl || 'cube',
          totalQuantity: sale.productDetails?.totalQuantity || 0,
          isPerishable: sale.productDetails?.isPerishable || false,
          batches: sale.productDetails?.batches || []
        }))
    });
    
  } catch (error) {
    console.error('Recently Sold Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get recently sold products with batch breakdown
 * @route   GET /api/analytics/recently-sold-batches
 * @access  Admin
 */
exports.getRecentlySoldBatches = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get recent sales with batch details
    const recentSales = await Sale.aggregate([
      {
        $sort: { saleDate: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: {
          path: '$productDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    ]);
    
    // Filter out deleted products and map to batch-level data
    const batchSales = recentSales
      .filter(sale => sale.productDetails)
      .map(sale => ({
        _id: sale._id,
        productId: sale.productId,
        name: sale.productName,
        category: sale.category,
        batchNumber: sale.batchNumber || 'N/A',
        saleDate: sale.saleDate,
        quantitySold: sale.quantitySold,
        totalAmount: sale.totalAmount,
        imageUrl: sale.productDetails?.imageUrl || 'cube',
        isPerishable: sale.productDetails?.isPerishable || false,
      }));
    
    res.status(200).json({
      success: true,
      data: batchSales
    });
    
  } catch (error) {
    console.error('Recently Sold Batches Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get sales history for a specific product
 * @route   GET /api/analytics/product-sales/:productId
 * @access  Admin
 */
exports.getProductSales = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 50 } = req.query;
    
    // Get sales history for this specific product
    const salesHistory = await Sale.find({ productId })
      .sort({ saleDate: -1 })
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: salesHistory
    });
    
  } catch (error) {
    console.error('Product Sales History Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Exports are done via exports.functionName pattern throughout the file


// ============================================================================
// NEW AI PREDICTION ENDPOINTS
// ============================================================================

const {
  getQuickInsights,
  getCategoryInsights,
  batchUpdatePredictions,
  savePredictionToDatabase
} = require('../services/predicitveAnalytics');
const Prediction = require('../models/Prediction');
const Notification = require('../models/Notification');
const cacheService = require('../services/cacheService');

/**
 * @desc    Get quick insights for dashboard badge (lightweight)
 * @route   GET /api/analytics/quick-insights
 * @access  Public
 */
exports.getQuickInsightsEndpoint = async (req, res) => {
  try {
    // Try to get from cache first (30 second TTL)
    const insights = await cacheService.getOrSet(
      cacheService.CACHE_KEYS.quickInsights,
      async () => await getQuickInsights(),
      30 // 30 seconds TTL
    );
    
    res.status(200).json({
      success: true,
      data: insights
    });
    
  } catch (error) {
    console.error('Quick Insights Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get full prediction for a single product
 * @route   GET /api/analytics/product/:id/predictions
 * @access  Public
 */
exports.getProductPrediction = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to get from cache first (60 second TTL)
    const prediction = await cacheService.getOrSet(
      cacheService.CACHE_KEYS.productPrediction(id),
      async () => {
        let pred = await Prediction.findOne({ productId: id })
          .populate('productId', 'name category imageUrl totalQuantity');
        
        // If no prediction exists, create one
        if (!pred) {
          pred = await savePredictionToDatabase(id);
        }
        
        return pred;
      },
      60 // 60 seconds TTL
    );
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: prediction
    });
    
  } catch (error) {
    console.error('Product Prediction Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get category-level insights
 * @route   GET /api/analytics/category/:category/insights
 * @access  Public
 */
exports.getCategoryInsightsEndpoint = async (req, res) => {
  try {
    const { category } = req.params;
    
    // Try to get from cache first (60 second TTL)
    const insights = await cacheService.getOrSet(
      cacheService.CACHE_KEYS.categoryInsights(category),
      async () => await getCategoryInsights(category),
      60 // 60 seconds TTL
    );
    
    if (!insights) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or no predictions available'
      });
    }
    
    res.status(200).json({
      success: true,
      data: insights
    });
    
  } catch (error) {
    console.error('Category Insights Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get batch predictions for multiple products
 * @route   POST /api/analytics/batch-predictions
 * @access  Public
 */
exports.getBatchPredictions = async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: 'productIds array is required'
      });
    }
    
    // Fetch predictions in parallel
    const predictions = await Promise.all(
      productIds.map(async (id) => {
        try {
          let pred = await Prediction.findOne({ productId: id })
            .populate('productId', 'name category imageUrl totalQuantity');
          
          if (!pred) {
            pred = await savePredictionToDatabase(id);
          }
          
          return pred;
        } catch (error) {
          console.error(`Error fetching prediction for ${id}:`, error);
          return null;
        }
      })
    );
    
    // Filter out nulls
    const validPredictions = predictions.filter(p => p !== null);
    
    res.status(200).json({
      success: true,
      data: validPredictions,
      count: validPredictions.length
    });
    
  } catch (error) {
    console.error('Batch Predictions Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get all notifications for user
 * @route   GET /api/analytics/notifications
 * @access  Public
 */
exports.getNotifications = async (req, res) => {
  try {
    const { userId = 'admin' } = req.query;
    
    const notifications = await Notification.getUnread(userId);
    const unreadCount = await Notification.getUnreadCount(userId);
    
    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    });
    
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/analytics/notifications/:id/read
 * @access  Public
 */
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    await notification.markAsRead();
    
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Mark Notification Read Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Dismiss notification
 * @route   PATCH /api/analytics/notifications/:id/dismiss
 * @access  Public
 */
exports.dismissNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    await notification.dismiss();
    
    res.status(200).json({
      success: true,
      message: 'Notification dismissed'
    });
    
  } catch (error) {
    console.error('Dismiss Notification Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/analytics/notifications/read-all
 * @access  Public
 */
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId = 'admin' } = req.body;
    
    await Notification.markAllAsRead(userId);
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
    
  } catch (error) {
    console.error('Mark All Read Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Manually trigger prediction recalculation
 * @route   POST /api/analytics/recalculate/:productId
 * @access  Admin
 */
exports.recalculatePrediction = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Invalidate cache
    const product = await Product.findById(productId);
    if (product) {
      cacheService.invalidatePredictionCache(productId, product.category);
    }
    
    // Recalculate prediction
    const prediction = await savePredictionToDatabase(productId);
    
    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Failed to calculate prediction'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Prediction recalculated successfully',
      data: prediction
    });
    
  } catch (error) {
    console.error('Recalculate Prediction Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
