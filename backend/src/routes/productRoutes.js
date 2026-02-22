const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const authenticate = require("../middleware/authenticate");
const tenantFilter = require("../middleware/tenantFilter");
const validateStoreAccess = require("../middleware/validateStoreAccess");

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateGenericPrice,
  applyDiscount,
  deleteProduct,
  deleteBatch,
  processSale,
} = require("../controllers/productController");

const registryController = require("../controllers/registryController");

// Apply authentication and tenant filter to all routes
router.use(authenticate);
router.use(tenantFilter);

// Route for /api/products
router.route("/").post(addProduct).get(getProducts);

// Get products by category
router.get("/category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    console.log('🔍 Fetching products for category:', categoryId);
    console.log('🔍 Tenant filter:', req.tenantFilter);

    // Apply tenant filter
    const query = { category: categoryId, ...req.tenantFilter };
    const products = await Product.find(query).select('_id name barcode category imageUrl');

    console.log('✅ Found products:', products.length);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("❌ Get products by category error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Process sale (must come before /:id to avoid conflict)
router.post("/process-sale", processSale);

// External Registry routes (must come before /:id)
router.get("/registry/lookup/:barcode", registryController.lookupBarcode);
router.post("/registry/add", registryController.addToRegistry);
router.get("/registry/all", registryController.getAllGlobalProducts);
router.get("/registry/:id", registryController.getGlobalProductById);
router.patch("/registry/:id", registryController.updateGlobalProduct);
router.delete("/registry/:id", registryController.deleteGlobalProduct);

router.get("/barcode/:barcode", async (req, res) => {
  try {
    const { barcode } = req.params;

    // Apply tenant filter
    const query = { barcode, ...req.tenantFilter };
    const product = await Product.findOne(query);

    if (!product) {
      return res.status(200).json({
        success: false,
        message: "Product not found in inventory",
        product: null,
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get product by barcode error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Route for /api/products/:id (CRUD operations)
// Update generic price
router.put("/:id/generic-price", validateStoreAccess, updateGenericPrice);

// Apply discount
router.post("/:id/discount", validateStoreAccess, applyDiscount);

router
  .route("/:id")
  .get(getProductById)
  .patch(validateStoreAccess, updateProduct)
  .delete(validateStoreAccess, deleteProduct);

// Delete specific batch
router.delete("/:id/batches/:batchNumber", validateStoreAccess, deleteBatch);

module.exports = router;