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
      data: recentSales.map(sale => ({
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

module.exports = {
  getProductAnalytics: exports.getProductAnalytics,
  getDashboardStats: exports.getDashboardStats,
  getSalesTrends: exports.getSalesTrends,
  getCategoryAnalytics: exports.getCategoryAnalytics,
  recordSale: exports.recordSale,
  getRecentlySold: exports.getRecentlySold,
  getProductSales: exports.getProductSales
};