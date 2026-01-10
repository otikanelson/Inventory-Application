const express = require('express');
const router = express.Router();
const { addProduct, getProducts } = require('../controllers/productController');

router.route('/')
  .post(addProduct)    // Triggered by "Save Product" button
  .get(getProducts);   // Triggered by Dashboard load

module.exports = router;