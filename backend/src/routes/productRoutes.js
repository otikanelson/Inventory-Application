const express = require('express');
const router = express.Router();
const { addProduct, getProducts } = require('../controllers/productController');
const registryController = require('../controllers/registryController');


router.route('/')
  .post(addProduct)    // Triggered by "Save Product" button
  .get(getProducts);   // Triggered by Dashboard load

  
  router.get('/registry/lookup/:barcode', registryController.lookupBarcode);
  router.post('/registry/add', registryController.addToRegistry);


module.exports = router;