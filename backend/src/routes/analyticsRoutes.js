const express = require('express');
const router = express.Router();

const {
  getProductAnalytics,
  getDashboardStats,
  getSalesTrends,
  getCategoryAnalytics,
  recordSale,
  getRecentlySold,
  getProductSales
} = require('../controllers/analyticsController');

// @route   GET /api/analytics/dashboard
// @desc    Get overall dashboard analytics
// @access  Admin
router.get('/dashboard', getDashboardStats);

// @route   GET /api/analytics/product/:productId
// @desc    Get predictive analytics for specific product
// @access  Admin
router.get('/product/:productId', getProductAnalytics);

// @route   GET /api/analytics/sales-trends
// @desc    Get sales trends for charts (query: ?days=30)
// @access  Admin
router.get('/sales-trends', getSalesTrends);

// @route   GET /api/analytics/by-category
// @desc    Get category-wise analytics
// @access  Admin
router.get('/by-category', getCategoryAnalytics);

// @route   GET /api/analytics/recently-sold
// @desc    Get recently sold products
// @access  Admin
router.get('/recently-sold', getRecentlySold);

// @route   GET /api/analytics/product-sales/:productId
// @desc    Get sales history for a specific product
// @access  Admin
router.get('/product-sales/:productId', getProductSales);

// @route   POST /api/analytics/record-sale
// @desc    Record a sale transaction
// @access  Staff/Admin
router.post('/record-sale', recordSale);

module.exports = router;