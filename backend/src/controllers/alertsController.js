// backend/src/controllers/alertsController.js
// Multi-threshold alert system controller

const Product = require('../models/Product');
const AlertSettings = require('../models/AlertSettings');
const Category = require('../models/Category');

/**
 * Helper: Get effective thresholds for a product (category > product > global fallback)
 */
const getEffectiveThresholds = async (product, globalThresholds) => {
  // Priority 1: Product-specific thresholds
  if (product.customAlertThresholds?.enabled) {
    return {
      critical: product.customAlertThresholds.critical || globalThresholds.critical,
      highUrgency: product.customAlertThresholds.highUrgency || globalThresholds.highUrgency,
      earlyWarning: product.customAlertThresholds.earlyWarning || globalThresholds.earlyWarning,
      isCustom: true,
      source: 'product'
    };
  }
  
  // Priority 2: Category-specific thresholds
  if (product.category) {
    const category = await Category.findOne({ name: product.category });
    if (category && category.customAlertThresholds?.enabled) {
      return {
        critical: category.customAlertThresholds.critical || globalThresholds.critical,
        highUrgency: category.customAlertThresholds.highUrgency || globalThresholds.highUrgency,
        earlyWarning: category.customAlertThresholds.earlyWarning || globalThresholds.earlyWarning,
        isCustom: true,
        source: 'category'
      };
    }
  }
  
  // Priority 3: Global thresholds
  return { ...globalThresholds, isCustom: false, source: 'global' };
};

/**
 * Helper: Determine alert level based on days until expiry
 */
const getAlertLevel = (daysLeft, thresholds) => {
  if (daysLeft < 0) {
    return { level: 'expired', color: '#8B0000', priority: 4 };
  } else if (daysLeft <= thresholds.critical) {
    return { level: 'critical', color: '#FF4444', priority: 3 };
  } else if (daysLeft <= thresholds.highUrgency) {
    return { level: 'high', color: '#FF9500', priority: 2 };
  } else if (daysLeft <= thresholds.earlyWarning) {
    return { level: 'early', color: '#FFCC00', priority: 1 };
  }
  return { level: 'normal', color: '#34C759', priority: 0 };
};

/**
 * Helper: Generate recommended actions based on alert level
 */
const getRecommendedActions = (alertLevel, daysLeft, quantity) => {
  const actions = [];
  
  switch (alertLevel) {
    case 'expired':
      actions.push({
        type: 'remove',
        label: 'Remove Immediately',
        icon: 'trash',
        description: 'Product has expired',
        urgent: true
      });
      break;
      
    case 'critical':
      actions.push({
        type: 'markdown',
        label: 'Discount 30-50%',
        icon: 'pricetag',
        description: `Only ${daysLeft} days left`,
        urgent: true
      });
      if (quantity > 5) {
        actions.push({
          type: 'transfer',
          label: 'Transfer Stock',
          icon: 'swap-horizontal',
          description: 'Move to faster location',
          urgent: false
        });
      }
      break;
      
    case 'high':
      actions.push({
        type: 'markdown',
        label: 'Discount 15-25%',
        icon: 'pricetag',
        description: 'Boost sales velocity',
        urgent: false
      });
      actions.push({
        type: 'promote',
        label: 'Feature Item',
        icon: 'megaphone',
        description: 'Add to promotions',
        urgent: false
      });
      break;
      
    case 'early':
      actions.push({
        type: 'monitor',
        label: 'Monitor Sales',
        icon: 'eye',
        description: 'Track daily movement',
        urgent: false
      });
      actions.push({
        type: 'adjust',
        label: 'Adjust Reorder',
        icon: 'refresh',
        description: 'Reduce next order',
        urgent: false
      });
      break;
  }
  
  return actions;
};

/**
 * @desc    Get all alerts with multi-threshold categorization
 * @route   GET /api/alerts
 * @query   ?level=critical&category=dairy&sortBy=urgency
 */
exports.getAlerts = async (req, res) => {
  try {
    const { level, category, sortBy = 'urgency' } = req.query;
    
    console.log('getAlerts - tenantFilter:', req.tenantFilter);
    console.log('getAlerts - user:', { storeId: req.user?.storeId, role: req.user?.role });
    
    // Get storeId from authenticated user
    const storeId = req.user.storeId;
    
    if (!storeId) {
      console.log('getAlerts - No storeId found for user');
      return res.status(400).json({
        success: false,
        error: 'Store ID is required'
      });
    }
    
    // Get or create store-specific settings
    let settings = await AlertSettings.findOne({ storeId });
    if (!settings) {
      console.log('getAlerts - Creating new alert settings for store:', storeId);
      settings = await AlertSettings.create({
        storeId,
        userId: 'admin',
        thresholds: { critical: 7, highUrgency: 14, earlyWarning: 30 }
      });
    }
    
    const thresholds = settings.thresholds;
    const now = new Date();
    
    // Get all perishable products with batches, filtered by store
    const query = {
      isPerishable: true,
      'batches.0': { $exists: true },
      ...req.tenantFilter
    };
    
    console.log('getAlerts - Query:', JSON.stringify(query));
    
    const products = await Product.find(query);
    
    console.log('getAlerts - Found', products.length, 'perishable products');
    
    const alerts = [];
    
    // Generate alerts from each batch
    for (const product of products) {
      // Get effective thresholds for this product
      const effectiveThresholds = await getEffectiveThresholds(product, thresholds);
      
      for (const batch of product.batches) {
        if (!batch.expiryDate) continue;
        
        const expiryDate = new Date(batch.expiryDate);
        const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        // Only include items within earlyWarning threshold or expired
        if (daysLeft <= effectiveThresholds.earlyWarning || daysLeft < 0) {
          const alertInfo = getAlertLevel(daysLeft, effectiveThresholds);
          const actions = getRecommendedActions(alertInfo.level, daysLeft, batch.quantity);
          
          alerts.push({
            alertId: `${product._id}_${batch.batchNumber}`,
            productId: product._id,
            productName: product.name,
            category: product.category,
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            expiryDate: batch.expiryDate,
            daysLeft,
            level: alertInfo.level,
            color: alertInfo.color,
            priority: alertInfo.priority,
            actions,
            imageUrl: product.imageUrl,
            barcode: product.barcode,
            hasCustomThresholds: effectiveThresholds.isCustom
          });
        }
      }
    }
    
    // ============================================================================
    // NEW: Slow-Moving Non-Perishable Product Detection (AI Analytics)
    // ============================================================================
    const Sale = require('../models/Sale');
    
    // Get all non-perishable products with tenant filter
    const nonPerishableQuery = {
      isPerishable: false,
      totalQuantity: { $gt: 0 },
      ...req.tenantFilter
    };
    const nonPerishableProducts = await Product.find(nonPerishableQuery);
    
    // Calculate sales velocity for each non-perishable product
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const product of nonPerishableProducts) {
      // Get sales in last 30 days with tenant filter
      const salesQuery = {
        productId: product._id,
        saleDate: { $gte: thirtyDaysAgo },
        ...req.tenantFilter
      };
      const sales = await Sale.find(salesQuery);
      
      const totalSold = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
      const velocity = totalSold / 30; // units per day
      
      // Flag as slow-moving if velocity < 0.5 units/day and has been in stock for 30+ days
      if (velocity < 0.5 && product.totalQuantity > 5) {
        // Check if product has been in inventory for at least 30 days
        const oldestBatch = product.batches.reduce((oldest, batch) => {
          const receivedDate = batch.receivedDate ? new Date(batch.receivedDate) : new Date();
          return receivedDate < oldest ? receivedDate : oldest;
        }, new Date());
        
        const daysInStock = Math.ceil((now - oldestBatch) / (1000 * 60 * 60 * 24));
        
        if (daysInStock >= 30) {
          alerts.push({
            alertId: `slow_${product._id}`,
            productId: product._id,
            productName: product.name,
            category: product.category,
            batchNumber: 'N/A',
            quantity: product.totalQuantity,
            expiryDate: null,
            daysLeft: null,
            level: 'slow-moving',
            color: '#9B59B6', // Purple color for slow-moving
            priority: 2, // Medium priority
            actions: [
              {
                type: 'promote',
                label: 'Promote Product',
                icon: 'megaphone',
                description: 'Feature in promotions',
                urgent: false
              },
              {
                type: 'markdown',
                label: 'Apply Discount',
                icon: 'pricetag',
                description: 'Boost sales with discount',
                urgent: false
              },
              {
                type: 'review',
                label: 'Review Pricing',
                icon: 'analytics',
                description: 'Check if price is competitive',
                urgent: false
              }
            ],
            imageUrl: product.imageUrl,
            barcode: product.barcode,
            hasCustomThresholds: false,
            // Additional metadata for slow-moving products
            velocity: velocity.toFixed(2),
            daysInStock,
            salesLast30Days: totalSold
          });
        }
      }
    }
    
    // Apply filters
    let filtered = alerts;
    
    if (level && level !== 'all') {
      filtered = filtered.filter(a => a.level === level);
    }
    
    if (category && category !== 'all') {
      filtered = filtered.filter(a => 
        a.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Sort alerts
    filtered.sort((a, b) => {
      if (sortBy === 'urgency') {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.daysLeft - b.daysLeft;
      } else if (sortBy === 'expiry') {
        return a.daysLeft - b.daysLeft;
      } else if (sortBy === 'quantity') {
        return b.quantity - a.quantity;
      }
      return 0;
    });
    
    // Calculate summary
    const summary = {
      total: alerts.length,
      expired: alerts.filter(a => a.level === 'expired').length,
      critical: alerts.filter(a => a.level === 'critical').length,
      high: alerts.filter(a => a.level === 'high').length,
      early: alerts.filter(a => a.level === 'early').length,
      slowMoving: alerts.filter(a => a.level === 'slow-moving').length,
      totalUnits: alerts.reduce((sum, a) => sum + a.quantity, 0),
      urgentCount: alerts.filter(a => a.priority >= 3).length
    };
    
    res.status(200).json({
      success: true,
      data: {
        alerts: filtered,
        summary,
        thresholds,
        filters: { level, category, sortBy }
      }
    });
    
  } catch (error) {
    console.error('Get Alerts Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Get alert threshold settings
 * @route   GET /api/alerts/settings
 */
exports.getSettings = async (req, res) => {
  try {
    // Get storeId from authenticated user
    const storeId = req.user.storeId;
    
    let settings = await AlertSettings.findOne({ storeId });
    
    if (!settings) {
      settings = await AlertSettings.create({
        storeId,
        userId: 'admin',
        thresholds: { critical: 7, highUrgency: 14, earlyWarning: 30 }
      });
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Update alert threshold settings
 * @route   PUT /api/alerts/settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const { thresholds, notificationSettings } = req.body;
    
    // Get storeId from authenticated user
    const storeId = req.user.storeId;
    
    let settings = await AlertSettings.findOne({ storeId });
    
    if (!settings) {
      settings = new AlertSettings({ 
        storeId,
        userId: 'admin'
      });
    }
    
    if (thresholds) {
      // Validate threshold ordering
      const { critical, highUrgency, earlyWarning } = thresholds;
      
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
      
      settings.thresholds = { ...settings.thresholds, ...thresholds };
    }
    
    if (notificationSettings) {
      settings.notificationSettings = {
        ...settings.notificationSettings,
        ...notificationSettings
      };
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * @desc    Acknowledge an alert
 * @route   POST /api/alerts/acknowledge
 */
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { alertId, action, notes } = req.body;
    
    // Log acknowledgment (in production, save to AuditLog model)
    console.log(`Alert ${alertId} acknowledged with action: ${action}`, notes);
    
    res.status(200).json({
      success: true,
      message: `Alert acknowledged: ${action}`,
      data: { alertId, action, timestamp: new Date() }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};