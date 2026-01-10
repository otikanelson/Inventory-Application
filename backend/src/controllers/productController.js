const Product = require('../models/Product');

// @desc    Add a new product or new batch
// @route   POST /api/products
exports.addProduct = async (req, res) => {
  try {
    const { name, barcode, internalCode, category, quantity, expiryDate, price, imageUrl } = req.body;

    // 1. Check if product already exists (by barcode or internal code)
    // Only search if barcode or internalCode is actually provided
    let product = null;
    if (barcode || internalCode) {
      product = await Product.findOne({ 
        $or: [
          ...(barcode ? [{ barcode }] : []),
          ...(internalCode ? [{ internalCode }] : [])
        ] 
      });
    }

    const newBatch = {
      batchNumber: `BN-${Date.now()}`,
      quantity: Number(quantity),
      expiryDate: new Date(expiryDate), // Ensure string becomes a Date object
      price: Number(price) || 0
    };

    if (product) {
      // Scenario A: Product exists, add a new batch to it
      product.batches.push(newBatch);
      // imageUrl might be updated if a new one is provided
      if (imageUrl) product.imageUrl = imageUrl; 
      
      await product.save();
      
      // Return consistent structure { success, data }
      return res.status(200).json({ 
        success: true, 
        message: 'New batch added to existing product', 
        data: product 
      });
    } else {
      // Scenario B: New product entirely
      const newProduct = await Product.create({
        name,
        barcode,
        internalCode,
        category,
        imageUrl: imageUrl || 'https://via.placeholder.com/150',
        batches: [newBatch]
      });

      return res.status(201).json({ 
        success: true, 
        data: newProduct 
      });
    }
  } catch (error) {
    console.error("AddProduct Error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Get all products
// @route   GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const rawProducts = await Product.find().sort({ updatedAt: -1 });

    const products = rawProducts.map(p => {
      // Find the batch that is expiring soonest (FEFO)
      const sortedBatches = [...p.batches].sort((a, b) => 
        new Date(a.expiryDate) - new Date(b.expiryDate)
      );

      return {
        ...p._doc,
        id: p._id, 
        quantity: p.totalQuantity, 
        expiryDate: sortedBatches.length > 0 ? sortedBatches[0].expiryDate : 'N/A',
        receivedDate: p.createdAt,
        hasBarcode: !!p.barcode
      };
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};