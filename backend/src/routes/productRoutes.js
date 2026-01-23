const express = require('express');
const router = express.Router();

const { 
  addProduct, 
  getProducts, 
  getProductById,
  updateProduct,
  deleteProduct,
  deleteBatch,
  processSale
} = require('../controllers/productController');

const registryController = require('../controllers/registryController');

// Route for /api/products
router.route('/')
  .post(addProduct)
  .get(getProducts);

// Process sale (must come before /:id to avoid conflict)
router.post('/process-sale', processSale);

// External Registry routes (must come before /:id)
router.get('/registry/lookup/:barcode', registryController.lookupBarcode);
router.post('/registry/add', registryController.addToRegistry);

// Route for /api/products/:id (CRUD operations)
router.route('/:id')
  .get(getProductById)
  .patch(updateProduct)
  .delete(deleteProduct);

// Delete specific batch
router.delete('/:id/batches/:batchNumber', deleteBatch);

module.exports = router;
