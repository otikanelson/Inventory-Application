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

    //Check if product already exists (by barcode or internal code)
    let product = null;
    if (barcode || internalCode) {
      product = await Product.findOne({ 
        $or: [
          ...(barcode ? [{ barcode }] : []),
          ...(internalCode ? [{ internalCode }] : [])
        ] 
      });
    }

    //Prepare the new batch object
    const newBatch = {
      batchNumber: `BN-${Date.now()}`,
      quantity: Number(quantity),
      price: Number(price) || 0
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
        quantity: p.totalQuantity,
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
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        ...product._doc,
        quantity: product.totalQuantity
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Process a sale (FEFO Stock Deduction)
// @route   POST /api/products/process-sale
exports.processSale = async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, quantitySold }

    for (const item of items) {
      const product = await Product.findById(item.id);
      if (!product) continue;

      let remainingToDeduct = item.quantitySold;

      // FEFO Logic: Sort batches by expiry date (Oldest/Soonest first)
      // Non-perishables/No-expiry batches are handled last
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

      // Optional: Remove batches that hit 0 to keep DB clean
      product.batches = product.batches.filter(b => b.quantity > 0);
      await product.save();
    }

    res.status(200).json({ success: true, message: 'Inventory updated via FEFO' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};