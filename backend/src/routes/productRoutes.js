const express = require('express');
const router = express.Router();

const { 
  addProduct, 
  getProducts, 
  getProductById 
} = require('../controllers/productController');

const registryController = require('../controllers/registryController');

// Route for /api/products
router.route('/')
  .post(addProduct)
  .get(getProducts);

// Route for /api/products/:id (This handles BOTH mongo ID and Barcode)
router.route('/:id').get(getProductById);

// External Registry routes
router.get('/registry/lookup/:barcode', registryController.lookupBarcode);
router.post('/registry/add', registryController.addToRegistry);

module.exports = router;