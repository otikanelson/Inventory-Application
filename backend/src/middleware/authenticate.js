const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication middleware
 * Verifies session token and sets req.user with user information
 * Supports three user types: author, admin, staff
 */
async function authenticate(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Decode and verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid session' 
      });
    }

    // Handle author role (no database lookup needed)
    if (decoded.role === 'author') {
      req.user = {
        id: 'author',
        role: 'author',
        isAuthor: true,
        storeId: null,
        storeName: null
      };
      return next();
    }

    // For admin/staff, fetch user from database
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: 'User not found or inactive' 
      });
    }

    // Set user information in request
    req.user = {
      id: user._id.toString(),
      role: user.role,
      storeId: user.storeId ? user.storeId.toString() : null,
      storeName: user.storeName,
      isAuthor: false,
      name: user.name
    };

    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication failed' 
    });
  }
}

module.exports = authenticate;
