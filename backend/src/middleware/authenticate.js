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
    
    console.log('=== AUTHENTICATE MIDDLEWARE ===');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid auth header');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted (first 20 chars):', token.substring(0, 20) + '...');

    // Decode and verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      console.log('✅ Token verified, decoded role:', decoded.role);
    } catch (error) {
      console.log('❌ Token verification failed:', error.message);
      return res.status(401).json({ 
        success: false,
        error: 'Invalid session' 
      });
    }

    // Handle author role (no database lookup needed)
    if (decoded.role === 'author') {
      console.log('✅ Author authenticated');
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
      console.log('❌ User not found or inactive');
      return res.status(401).json({ 
        success: false,
        error: 'User not found or inactive' 
      });
    }

    console.log('✅ User authenticated:', user.role);

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
