// backend/src/routes/categoryRoutes.js
// Routes for admin category management

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const tenantFilter = require('../middleware/tenantFilter');

const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  syncProductCounts
} = require('../controllers/categoryController');

// Apply authentication and tenant filter to all routes
router.use(authenticate);
router.use(tenantFilter);

// @route   GET /api/categories
// @desc    Get all categories
router.get('/', getCategories);

// @route   POST /api/categories
// @desc    Create new category
router.post('/', createCategory);

// @route   PUT /api/categories/:id
// @desc    Update category
router.put('/:id', updateCategory);

// @route   DELETE /api/categories/:id
// @desc    Delete category
router.delete('/:id', deleteCategory);

// @route   POST /api/categories/sync-counts
// @desc    Sync product counts for all categories
router.post('/sync-counts', syncProductCounts);

module.exports = router;
