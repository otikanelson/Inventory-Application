const express = require("express");
const router = express.Router();
const Product = require("../models/Product"); // Add missing Product model import

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct, // ← Make sure this is imported
  updateGenericPrice,
  deleteProduct, // ← Make sure this is imported
  deleteBatch,
  processSale,
} = require("../controllers/productController");

const registryController = require("../controllers/registryController");

// Route for /api/products
router.route("/").post(addProduct).get(getProducts);

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

    const product = await Product.findOne({ barcode });

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
router.put("/:id/generic-price", updateGenericPrice);

router
  .route("/:id")
  .get(getProductById)
  .patch(updateProduct) // ← ADD THIS LINE
  .delete(deleteProduct); // ← ADD THIS LINE

// Delete specific batch
router.delete("/:id/batches/:batchNumber", deleteBatch);

module.exports = router;