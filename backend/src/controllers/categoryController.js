// backend/src/controllers/categoryController.js
// Admin category management controller

const Category = require('../models/Category');
const Product = require('../models/Product');
const GlobalProduct = require('../models/GlobalProduct');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, customAlertThresholds } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Category name is required'
      });
    }
    
    // Check if category already exists (case-insensitive)
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category already exists'
      });
    }
    
    // Validate thresholds if provided
    if (customAlertThresholds?.enabled) {
      const { critical, highUrgency, earlyWarning } = customAlertThresholds;
      
      if (critical >= highUrgency) {
        return res.status(400).json({
          success: false,
          error: 'Critical threshold must be less than High Urgency threshold'
        });
      }
      
      if (highUrgency >= earlyWarning) {
        return res.status(400).json({
          success: false,
          error: 'High Urgency threshold must be less than Early Warning threshold'
        });
      }
    }
    
    const category = await Category.create({
      name: name.trim(),
      customAlertThresholds: customAlertThresholds || { enabled: false }
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 */
exports.updateCategory = async (req, res) => {
  try {
    const { name, customAlertThresholds } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // If name is being changed, check for duplicates
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category name already exists'
        });
      }
      
      // Update all products with old category name
      await Product.updateMany(
        { category: category.name },
        { category: name.trim() }
      );
      
      // Update all global products with old category name
      await GlobalProduct.updateMany(
        { category: category.name },
        { category: name.trim() }
      );
      
      category.name = name.trim();
    }
    
    // Update thresholds if provided
    if (customAlertThresholds !== undefined) {
      if (customAlertThresholds.enabled) {
        const { critical, highUrgency, earlyWarning } = customAlertThresholds;
        
        if (critical >= highUrgency) {
          return res.status(400).json({
            success: false,
            error: 'Critical threshold must be less than High Urgency threshold'
          });
        }
        
        if (highUrgency >= earlyWarning) {
          return res.status(400).json({
            success: false,
            error: 'High Urgency threshold must be less than Early Warning threshold'
          });
        }
      }
      
      category.customAlertThresholds = customAlertThresholds;
    }
    
    await category.save();
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    // Check if any products use this category
    const productCount = await Product.countDocuments({ category: category.name });
    const globalProductCount = await GlobalProduct.countDocuments({ category: category.name });
    const totalCount = productCount + globalProductCount;
    
    if (totalCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete category. ${productCount} inventory product(s) and ${globalProductCount} global product(s) are using this category.`
      });
    }
    
    await category.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Update product counts for all categories
 * @route   POST /api/categories/sync-counts
 */
exports.syncProductCounts = async (req, res) => {
  try {
    const categories = await Category.find();
    
    for (const category of categories) {
      const count = await Product.countDocuments({ category: category.name });
      category.productCount = count;
      await category.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Product counts synchronized'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
