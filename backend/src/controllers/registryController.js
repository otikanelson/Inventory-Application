const GlobalProduct = require('../models/GlobalProduct');
const Product = require('../models/Product');

exports.lookupBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const storeId = req.user.storeId; // Get storeId from authenticated user

    console.log('🔍 Looking up barcode:', barcode, 'for store:', storeId);

    // Look for global product in this store's registry
    const query = storeId ? { barcode, storeId } : { barcode };
    const globalData = await GlobalProduct.findOne(query);
    
    // Look for existing stock in this store
    const existingStock = await Product.findOne({ barcode, ...req.tenantFilter });

    if (!globalData) {
      console.log('❌ Product not found in store registry');
      return res.status(200).json({
        success: true,
        found: false,
        message: "Product not in Registry. Manual setup required.",
        existingInWarehouse: !!existingStock
      });
    }

    console.log('✅ Found in registry:', globalData.name);
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
    console.error('❌ Lookup barcode error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addToRegistry = async (req, res) => {
  try {
    const { barcode, name, category, isPerishable, imageUrl } = req.body;
    const storeId = req.user.storeId; // Get storeId from authenticated user

    console.log('➕ Adding to registry:', { barcode, name, storeId });

    // Check if product already exists in this store's registry
    const query = storeId ? { barcode, storeId } : { barcode };
    const existing = await GlobalProduct.findOne(query);
    
    if (existing) {
      console.log('❌ Product already exists in store registry');
      return res.status(400).json({ 
        success: false,
        message: "Product already in your store's registry" 
      });
    }

    const newGlobalProduct = new GlobalProduct({
      storeId, // Add storeId to global product
      barcode,
      name,
      category,
      imageUrl: imageUrl || "",
      isPerishable: isPerishable === true || isPerishable === 'true'
    });

    await newGlobalProduct.save();
    console.log('✅ Added to registry successfully');
    
    res.status(201).json({ 
      success: true, 
      message: "Added to Global Registry",
      data: newGlobalProduct
    });
  } catch (error) {
    console.error('❌ Add to registry error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// NEW: Get all global products
exports.getAllGlobalProducts = async (req, res) => {
  try {
    const storeId = req.user.storeId; // Get storeId from authenticated user
    
    console.log('📋 Getting all global products for store:', storeId);
    
    // Filter by store if user is not author
    const query = req.user.isAuthor ? {} : { storeId };
    const globalProducts = await GlobalProduct.find(query).sort({ createdAt: -1 });
    
    console.log('✅ Found', globalProducts.length, 'global products');
    
    res.status(200).json({
      success: true,
      data: globalProducts
    });
  } catch (error) {
    console.error('❌ Get All Global Products Error:', error);
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
    const storeId = req.user.storeId;
    
    console.log('🔍 Getting global product by ID:', id, 'for store:', storeId);
    
    // Build query with store filter if not author
    const query = { _id: id };
    if (!req.user.isAuthor && storeId) {
      query.storeId = storeId;
    }
    
    const globalProduct = await GlobalProduct.findOne(query);
    
    if (!globalProduct) {
      console.log('❌ Global product not found');
      return res.status(404).json({
        success: false,
        message: "Global product not found"
      });
    }
    
    console.log('✅ Found global product:', globalProduct.name);
    
    res.status(200).json({
      success: true,
      data: globalProduct
    });
  } catch (error) {
    console.error('❌ Get Global Product By ID Error:', error);
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
    const storeId = req.user.storeId;
    
    console.log('✏️ Attempting to update global product with ID:', id);
    console.log('Update data:', { name, category, imageUrl, isPerishable, genericPrice });
    console.log('User store:', storeId);
    
    // Build query with store filter if not author
    const query = { _id: id };
    if (!req.user.isAuthor && storeId) {
      query.storeId = storeId;
    }
    
    const globalProduct = await GlobalProduct.findOne(query);
    
    if (!globalProduct) {
      console.log('❌ Global product not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: "Global product not found or you don't have permission to update it"
      });
    }
    
    console.log('✅ Found global product:', globalProduct.name);
    
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
    
    console.log('💾 Saving global product with fields:', updateFields);
    await globalProduct.save();
    
    // Also update all inventory products with the same barcode in this store
    if (Object.keys(updateFields).length > 0) {
      const inventoryQuery = { 
        barcode: globalProduct.barcode,
        storeId: globalProduct.storeId 
      };
      const updateResult = await Product.updateMany(inventoryQuery, { $set: updateFields });
      console.log('✅ Updated inventory items:', updateResult.modifiedCount);
    }
    
    console.log('✅ Global product updated successfully');
    res.status(200).json({
      success: true,
      message: "Global product updated successfully",
      data: globalProduct
    });
  } catch (error) {
    console.error('❌ Update Global Product Error:', error);
    res.status(500).json({
      success: false,
      message: "Failed to update global product. Please try again.",
      error: error.message
    });
  }
};

// NEW: Delete global product
exports.deleteGlobalProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = req.user.storeId;
    
    console.log('🗑️ Attempting to delete global product with ID:', id);
    console.log('User store:', storeId);
    
    // Validate ID format
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }
    
    // Build query with store filter if not author
    const query = { _id: id };
    if (!req.user.isAuthor && storeId) {
      query.storeId = storeId;
    }
    
    const globalProduct = await GlobalProduct.findOne(query);
    
    if (!globalProduct) {
      console.log('❌ Global product not found with ID:', id);
      return res.status(404).json({
        success: false,
        message: "Global product not found or you don't have permission to delete it"
      });
    }
    
    console.log('✅ Found global product:', globalProduct.name, 'Barcode:', globalProduct.barcode);
    
    // Check if there are any inventory items with this barcode in this store that have stock
    const inventoryQuery = { 
      barcode: globalProduct.barcode,
      storeId: globalProduct.storeId 
    };
    const inventoryItems = await Product.find(inventoryQuery);
    console.log('📦 Found inventory items with this barcode:', inventoryItems.length);
    
    const itemsWithStock = inventoryItems.filter(item => item.totalQuantity > 0);
    
    if (itemsWithStock.length > 0) {
      console.log('❌ Cannot delete - product has active stock');
      
      const totalStock = itemsWithStock.reduce((sum, item) => sum + item.totalQuantity, 0);
      
      return res.status(400).json({
        success: false,
        message: `Cannot delete: Product has ${totalStock} units in active inventory. Remove all stock first.`,
        details: {
          itemsWithStock: itemsWithStock.length,
          totalStock
        }
      });
    }
    
    // Delete the global product
    console.log('🗑️ Deleting global product from database...');
    await GlobalProduct.findOneAndDelete(query);
    
    // Also delete any inventory items with 0 stock that reference this barcode in this store
    const deleteResult = await Product.deleteMany({ 
      barcode: globalProduct.barcode, 
      storeId: globalProduct.storeId,
      totalQuantity: 0 
    });
    console.log('✅ Deleted inventory items with 0 stock:', deleteResult.deletedCount);
    
    console.log('✅ Global product deleted successfully');
    res.status(200).json({
      success: true,
      message: "Global product deleted successfully"
    });
  } catch (error) {
    console.error('❌ Delete Global Product Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to delete global product. Please try again.",
    });
  }
};