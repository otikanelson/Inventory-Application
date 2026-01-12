const Product = require('../models/Product');

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
      isPerishable 
    } = req.body;

    // 1. Check if product already exists (by barcode or internal code)
    let product = null;
    if (barcode || internalCode) {
      product = await Product.findOne({ 
        $or: [
          ...(barcode ? [{ barcode }] : []),
          ...(internalCode ? [{ internalCode }] : [])
        ] 
      });
    }

    // 2. Prepare the new batch object
    const newBatch = {
      batchNumber: `BN-${Date.now()}`,
      quantity: Number(quantity),
      price: Number(price) || 0
    };

    // Only add expiryDate if it's a valid non-empty string
    if (expiryDate && expiryDate.trim() !== "") {
      newBatch.expiryDate = new Date(expiryDate);
    } 
    // Do NOT set it to null; leaving it undefined prevents validation trigger 
    // if your schema has required: false but the validator is picky.

    if (product) {
      // SCENARIO A: Product exists, add a new batch to it
      product.batches.push(newBatch);
      
      // Update metadata if provided
      if (imageUrl) product.imageUrl = imageUrl; 
      if (category) product.category = category;
      
      await product.save();
      
      return res.status(200).json({ 
        success: true, 
        message: 'New batch added to existing product', 
        data: product 
      });
    } else {
      // SCENARIO B: New product entirely
      // Use "|| undefined" so MongoDB doesn't save a null key into unique indexes
      const newProduct = await Product.create({
        name,
        barcode: barcode || undefined, 
        internalCode: internalCode || undefined,
        category,
        isPerishable: isPerishable === true || isPerishable === 'true',
        hasBarcode: hasBarcode ?? !!barcode, 
        imageUrl: imageUrl || 'https://via.placeholder.com/150',
        batches: [newBatch]
      });

      return res.status(201).json({ 
        success: true, 
        message: 'Product and first batch created',
        data: newProduct 
      });
    }
  } catch (error) {
    console.error("AddProduct Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all products with FEFO expiry and total quantity
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const rawProducts = await Product.find().sort({ updatedAt: -1 });

    const products = rawProducts.map(p => {
      // FEFO: Find the batch that is expiring soonest
      // We filter out batches without expiry dates first
      const sortedBatches = [...p.batches]
        .filter(b => b.expiryDate)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

      return {
        ...p._doc,
        id: p._id, 
        quantity: p.totalQuantity, // Uses the virtual/getter in your model
        expiryDate: sortedBatches.length > 0 ? sortedBatches[0].expiryDate : 'N/A',
        receivedDate: p.createdAt,
        hasBarcode: p.hasBarcode ?? !!p.barcode 
      };
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};