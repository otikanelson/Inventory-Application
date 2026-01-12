const GlobalProduct = require('../models/GlobalProduct');
const Product = require('../models/Product');

exports.lookupBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const globalData = await GlobalProduct.findOne({ barcode });
    const existingStock = await Product.findOne({ barcode });

    if (!globalData) {
      return res.status(200).json({
        success: true,
        found: false,
        message: "Product not in Registry. Manual setup required.",
        existingInWarehouse: !!existingStock
      });
    }

    res.status(200).json({
      success: true,
      found: true,
      productData: globalData,
      inventoryStatus: existingStock ? {
        currentQuantity: existingStock.totalQuantity, // Updated to match your schema's totalQuantity
        lastAdded: existingStock.updatedAt
      } : null
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addToRegistry = async (req, res) => {
  try {
    // 1. Extract imageUrl from the request body
    const { barcode, name, category, isPerishable, imageUrl } = req.body;

    const existing = await GlobalProduct.findOne({ barcode });
    if (existing) {
      return res.status(400).json({ message: "Product already in registry" });
    }

    const newGlobalProduct = new GlobalProduct({
      barcode,
      name,
      category,
      imageUrl: imageUrl || "", // 2. Save the image path to the registry
      isPerishable: isPerishable === true || isPerishable === 'true'
    });

    await newGlobalProduct.save();
    res.status(201).json({ success: true, message: "Added to Global Registry" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};