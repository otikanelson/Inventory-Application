const Product = require("../models/Product");
const Sale = require("../models/Sale");

// @desc    Add a new product or new batch
// @route   POST /api/products
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      barcode,
      internalCode,
      category,
      quantity,
      expiryDate,
      price,
      imageUrl,
      hasBarcode,
      isPerishable,
    } = req.body;

    //Check if product already exists (by barcode or internal code)
    let product = null;
    if (barcode || internalCode) {
      product = await Product.findOne({
        $or: [
          ...(barcode ? [{ barcode }] : []),
          ...(internalCode ? [{ internalCode }] : []),
        ],
      });
    }

    //Prepare the new batch object
    const newBatch = {
      batchNumber: `BN-${Date.now()}`,
      quantity: Number(quantity),
      price: Number(price) || 0,
    };

    // Only add expiryDate if it's a valid non-empty string
    if (expiryDate && expiryDate.trim() !== "") {
      newBatch.expiryDate = new Date(expiryDate);
    }

    if (product) {
      // SCENARIO A: Product exists, add a new batch to it
      product.batches.push(newBatch);

      // Update metadata if provided
      if (imageUrl) product.imageUrl = imageUrl;
      if (category) product.category = category;

      await product.save();

      return res.status(200).json({
        success: true,
        message: "New batch added to existing product",
        data: product,
      });
    } else {
      // SCENARIO B: New product entirely
      // Use "|| undefined" so MongoDB doesn't save a null key into unique indexes
      const newProduct = await Product.create({
        name,
        barcode: barcode || undefined,
        internalCode: internalCode || undefined,
        category,
        isPerishable: isPerishable === true || isPerishable === "true",
        hasBarcode: hasBarcode ?? !!barcode,
        imageUrl: imageUrl || "https://via.placeholder.com/150",
        batches: [newBatch],
      });

      return res.status(201).json({
        success: true,
        message: "Product and first batch created",
        data: newProduct,
      });
    }
  } catch (error) {
    console.error("AddProduct Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const rawProducts = await Product.find().sort({ updatedAt: -1 });

    const products = rawProducts.map((p) => {
      // FEFO: Find the batch that is expiring soonest
      const sortedBatches = [...p.batches]
        .filter((b) => b.expiryDate)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      return {
        ...p._doc,
        id: p._id,
        quantity: p.totalQuantity,
        expiryDate:
          sortedBatches.length > 0 ? sortedBatches[0].expiryDate : "N/A",
        receivedDate: p.createdAt,
        hasBarcode: p.hasBarcode ?? !!p.barcode,
      };
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single product by ID or Barcode
// @route   GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    let product;

    //Check if the 'id' looks like a MongoDB ObjectID
    const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);

    if (isMongoId) {
      product = await Product.findById(id);
    }

    //Fallback: Search by Barcode if not found by ID
    if (!product) {
      product = await Product.findOne({ barcode: id });
    }

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        ...product._doc,
        quantity: product.totalQuantity,
      },
    });
  } catch (error) {
    console.error("GetProductById Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update product details (name, category, image)
// @route   PATCH /api/products/:id
// @access  Admin
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, imageUrl } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        category,
        imageUrl,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("UpdateProduct Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete entire product
// @route   DELETE /api/products/:id
// @access  Admin
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: product,
    });
  } catch (error) {
    console.error("DeleteProduct Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete specific batch from product
// @route   DELETE /api/products/:id/batches/:batchNumber
// @access  Admin
exports.deleteBatch = async (req, res) => {
  try {
    const { id, batchNumber } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find and remove the batch
    const initialLength = product.batches.length;
    product.batches = product.batches.filter(
      (b) => b.batchNumber !== batchNumber,
    );

    if (product.batches.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Batch not found",
      });
    }

    await product.save();

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully",
      data: product,
    });
  } catch (error) {
    console.error("DeleteBatch Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Process a sale (FEFO Stock Deduction)
// @route   POST /api/products/process-sale
exports.processSale = async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantity, price }
    const saleRecords = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      let remainingToDeduct = item.quantity;

      // FEFO Logic: Sort batches by expiry date (Oldest/Soonest first)
      product.batches.sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      });

      for (let batch of product.batches) {
        if (remainingToDeduct <= 0) break;

        if (batch.quantity >= remainingToDeduct) {
          batch.quantity -= remainingToDeduct;
          remainingToDeduct = 0;
        } else {
          remainingToDeduct -= batch.quantity;
          batch.quantity = 0;
        }
      }

      // Remove batches that hit 0 to keep DB clean
      product.batches = product.batches.filter((b) => b.quantity > 0);
      await product.save();

      // Record the sale for analytics
      const saleRecord = new Sale({
        productId: product._id,
        productName: product.name,
        category: product.category,
        quantitySold: item.quantity,
        priceAtSale: item.price || 0,
        totalAmount: (item.price || 0) * item.quantity,
        saleDate: new Date(),
        paymentMethod: item.paymentMethod || 'cash'
      });

      saleRecords.push(saleRecord);
    }

    // Save all sale records
    if (saleRecords.length > 0) {
      await Sale.insertMany(saleRecords);
    }

    res.status(200).json({
      success: true,
      message: "Sale processed successfully via FEFO",
      salesRecorded: saleRecords.length
    });
  } catch (error) {
    console.error("ProcessSale Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update product (for admin edits)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, imageUrl } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name,
        category,
        imageUrl,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true },
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete product (for admin)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update generic price for a product
// @route   PUT /api/products/:id/generic-price
// @access  Admin
exports.updateGenericPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { genericPrice } = req.body;

    // Allow null to clear the generic price
    const update = { updatedAt: Date.now() };
    if (genericPrice === null || genericPrice === undefined) {
      update.genericPrice = null;
    } else {
      const priceNum = Number(genericPrice);
      if (isNaN(priceNum) || priceNum < 0) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid genericPrice" });
      }
      update.genericPrice = priceNum;
    }

    const product = await Product.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Generic price updated", data: product });
  } catch (error) {
    console.error("UpdateGenericPrice Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
