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
        currentQuantity: existingStock.totalQuantity,
        lastAdded: existingStock.updatedAt
      } : null
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addToRegistry = async (req, res) => {
  try {
    const { barcode, name, category, isPerishable, imageUrl } = req.body;

    const existing = await GlobalProduct.findOne({ barcode });
    if (existing) {
      return res.status(400).json({ message: "Product already in registry" });
    }

    const newGlobalProduct = new GlobalProduct({
      barcode,
      name,
      category,
      imageUrl: imageUrl || "",
      isPerishable: isPerishable === true || isPerishable === 'true'
    });

    await newGlobalProduct.save();
    res.status(201).json({ success: true, message: "Added to Global Registry" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW: Get all global products
exports.getAllGlobalProducts = async (req, res) => {
  try {
    const globalProducts = await GlobalProduct.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: globalProducts
    });
  } catch (error) {
    console.error('Get All Global Products Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// NEW: Get global product by ID
exports.getGlobalProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const globalProduct = await GlobalProduct.findById(id);
    
    if (!globalProduct) {
      return res.status(404).json({
        success: false,
        message: "Global product not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: globalProduct
    });
  } catch (error) {
    console.error('Get Global Product By ID Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// NEW: Update global product
exports.updateGlobalProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, imageUrl, isPerishable, genericPrice } = req.body;
    
    console.log('Attempting to update global product with ID:', id);
    console.log('Update data:', { name, category, imageUrl, isPerishable, genericPrice });
    
    const globalProduct = await GlobalProduct.findById(id);
    
    if (!globalProduct) {
      console.log('Global product not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: "Global product not found"
      });
    }
    
    console.log('Found global product:', globalProduct.name);
    
    // Build update object with only provided fields
    const updateFields = {};
    if (name !== undefined) {
      globalProduct.name = name;
      updateFields.name = name;
    }
    if (category !== undefined) {
      globalProduct.category = category;
      updateFields.category = category;
    }
    if (imageUrl !== undefined) {
      globalProduct.imageUrl = imageUrl;
      updateFields.imageUrl = imageUrl;
    }
    if (isPerishable !== undefined) {
      globalProduct.isPerishable = isPerishable;
      updateFields.isPerishable = isPerishable;
    }
    if (genericPrice !== undefined) {
      globalProduct.genericPrice = genericPrice;
      updateFields.genericPrice = genericPrice;
    }
    
    console.log('Saving global product with fields:', updateFields);
    await globalProduct.save();
    
    // Also update all inventory products with the same barcode (only if there are fields to update)
    if (Object.keys(updateFields).length > 0) {
      const updateResult = await Product.updateMany(
        { barcode: globalProduct.barcode },
        { $set: updateFields }
      );
      console.log('Updated inventory items:', updateResult.modifiedCount);
    }
    
    console.log('Global product updated successfully');
    res.status(200).json({
      success: true,
      message: "Global product updated successfully",
      data: globalProduct
    });
  } catch (error) {
    console.error('Update Global Product Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message
    });
  }
};

// NEW: Delete global product
exports.deleteGlobalProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Attempting to delete global product with ID:', id);
    
    const globalProduct = await GlobalProduct.findById(id);
    
    if (!globalProduct) {
      console.log('Global product not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: "Global product not found"
      });
    }
    
    console.log('Found global product:', globalProduct.name, 'Barcode:', globalProduct.barcode);
    
    // Check if there are any inventory items with this barcode that have stock
    const inventoryItems = await Product.find({ barcode: globalProduct.barcode });
    console.log('Found inventory items with this barcode:', inventoryItems.length);
    
    const itemsWithStock = inventoryItems.filter(item => item.totalQuantity > 0);
    
    if (itemsWithStock.length > 0) {
      console.log('Cannot delete - product has active stock in', itemsWithStock.length, 'store(s)');
      
      // Get store names for better error message
      const Store = require('../models/Store');
      const storeIds = itemsWithStock.map(item => item.storeId);
      const stores = await Store.find({ _id: { $in: storeIds } });
      const storeNames = stores.map(s => s.name).join(', ');
      
      return res.status(400).json({
        success: false,
        message: `Cannot delete: Product has active inventory in ${itemsWithStock.length} store(s): ${storeNames}. Remove all stock first or contact those stores.`,
        details: {
          storesWithStock: itemsWithStock.length,
          storeNames: storeNames
        }
      });
    }
    
    // Delete the global product
    console.log('Deleting global product from database...');
    await GlobalProduct.findByIdAndDelete(id);
    
    // Also delete any inventory items with 0 stock that reference this barcode
    const deleteResult = await Product.deleteMany({ barcode: globalProduct.barcode, totalQuantity: 0 });
    console.log('Deleted inventory items with 0 stock:', deleteResult.deletedCount);
    
    console.log('Global product deleted successfully');
    res.status(200).json({
      success: true,
      message: "Global product deleted successfully"
    });
  } catch (error) {
    console.error('Delete Global Product Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};