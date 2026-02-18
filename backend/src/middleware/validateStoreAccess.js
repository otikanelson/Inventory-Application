/**
 * Store Access Validator Middleware
 * Validates that users can only access their own store's data
 * Author users bypass this validation
 */
function validateStoreAccess(req, res, next) {
  try {
    // Author can access all stores
    if (req.user && req.user.isAuthor) {
      return next();
    }

    // Ensure user is authenticated
    if (!req.user || !req.user.storeId) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    // Extract storeId from request (body, params, or query)
    const requestedStoreId = req.body.storeId || req.params.storeId || req.query.storeId;

    // If storeId is in request, verify it matches user's store
    if (requestedStoreId && requestedStoreId !== req.user.storeId) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied to this store' 
      });
    }

    next();
  } catch (error) {
    console.error('Store access validation error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authorization failed' 
    });
  }
}

module.exports = validateStoreAccess;
