const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Sale = require('../models/Sale');

// Get all stores with counts (author only)
exports.getAllStores = async (req, res) => {
  try {
    // Verify author role
    if (!req.user || !req.user.isAuthor) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const stores = await Store.find({ isActive: true })
      .populate('ownerId', 'name')
      .sort({ createdAt: -1 });

    // Get counts for each store
    const storesWithCounts = await Promise.all(
      stores.map(async (store) => {
        const adminCount = await User.countDocuments({ 
          storeId: store._id, 
          role: 'admin',
          isActive: true 
        });
        
        const staffCount = await User.countDocuments({ 
          storeId: store._id, 
          role: 'staff',
          isActive: true 
        });
        
        const productCount = await Product.countDocuments({ 
          storeId: store._id 
        });

        return {
          _id: store._id,
          name: store.name,
          ownerId: store.ownerId?._id,
          ownerName: store.ownerId?.name,
          adminCount,
          staffCount,
          productCount,
          isActive: store.isActive,
          createdAt: store.createdAt
        };
      })
    );

    res.json({
      success: true,
      data: storesWithCounts
    });
  } catch (error) {
    console.error('Get all stores error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stores'
    });
  }
};

// Get store details with admins, staff, and stats (author only)
exports.getStoreDetails = async (req, res) => {
  try {
    const { storeId } = req.params;

    console.log('=== GET STORE DETAILS ===');
    console.log('Store ID from params:', storeId);

    // Verify author role
    if (!req.user || !req.user.isAuthor) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Validate storeId
    if (!storeId || storeId === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Invalid store ID'
      });
    }

    const store = await Store.findById(storeId);

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    // Get admins for this store
    const admins = await User.find({ 
      storeId: store._id, 
      role: 'admin',
      isActive: true 
    }).select('-pin');

    // Get staff for this store
    const staff = await User.find({ 
      storeId: store._id, 
      role: 'staff',
      isActive: true 
    }).select('-pin');

    // Get statistics
    const totalProducts = await Product.countDocuments({ storeId: store._id });
    const totalSales = await Sale.countDocuments({ storeId: store._id });
    
    // Calculate total revenue
    const revenueResult = await Sale.aggregate([
      { $match: { storeId: store._id } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.json({
      success: true,
      data: {
        store: {
          _id: store._id,
          name: store.name,
          ownerId: store.ownerId,
          createdAt: store.createdAt,
          isActive: store.isActive
        },
        admins: admins.map(admin => ({
          _id: admin._id,
          name: admin.name,
          lastLogin: admin.lastLogin,
          isActive: admin.isActive
        })),
        staff: staff.map(s => ({
          _id: s._id,
          name: s.name,
          createdBy: s.createdBy,
          lastLogin: s.lastLogin,
          isActive: s.isActive
        })),
        statistics: {
          totalProducts,
          totalSales,
          totalRevenue
        }
      }
    });
  } catch (error) {
    console.error('Get store details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch store details'
    });
  }
};

// Get all users across all stores (author only)
exports.getAllUsers = async (req, res) => {
  try {
    // Verify author role
    if (!req.user || !req.user.isAuthor) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const users = await User.find({ role: { $in: ['admin', 'staff'] }, isActive: true })
      .select('-pin')
      .sort({ createdAt: -1 });

    const usersData = users.map(user => ({
      id: user._id,
      name: user.name,
      role: user.role,
      storeId: user.storeId,
      storeName: user.storeName,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    }));

    res.json({
      success: true,
      data: usersData
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
};

module.exports = exports;
