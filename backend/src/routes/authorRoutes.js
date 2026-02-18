const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const authenticate = require('../middleware/authenticate');

// All author routes require authentication
router.use(authenticate);

// GET /api/author/stores - Get all stores with counts
router.get('/stores', authorController.getAllStores);

// GET /api/author/stores/:storeId - Get store details
router.get('/stores/:storeId', authorController.getStoreDetails);

// GET /api/author/users - Get all users
router.get('/users', authorController.getAllUsers);

module.exports = router;
