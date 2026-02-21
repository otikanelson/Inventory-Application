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
    
    console.log('🔐 Authenticate middleware - Method:', req.method, 'Path:', req.path);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No auth header or invalid format');
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
      console.log('✅ Token decoded:', { userId: decoded.userId, role: decoded.role, storeId: decoded.storeId });
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
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
      console.log('✅ Author user set');
      return next();
    }

    // For admin/staff, fetch user from database
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      console.log('❌ User not found or inactive:', decoded.userId);
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

    console.log('✅ User authenticated:', { id: req.user.id, role: req.user.role, storeId: req.user.storeId });
    return next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false,
      error: 'Authentication failed',
      details: error.message
    });
  }
}

module.exports = authenticate;
