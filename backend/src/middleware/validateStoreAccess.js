/**
 * Store Access Validator Middleware
 * Validates that users can only access their own store's data
 * Author users bypass this validation
 */
function validateStoreAccess(req, res, next) {
  try {
    // Ensure user is authenticated (req.user should be set by authenticate middleware)
    if (!req.user) {
      console.error('validateStoreAccess: req.user is undefined - authenticate middleware may have failed');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    // Author can access all stores
    if (req.user.isAuthor) {
      return next();
    }

    // Ensure user has a storeId
    if (!req.user.storeId) {
      console.error('validateStoreAccess: User has no storeId:', req.user.id);
      return res.status(403).json({ 
        success: false,
        error: 'User not associated with any store' 
      });
    }

    // Extract storeId from request (body, params, or query)
    const requestedStoreId = req.body.storeId || req.params.storeId || req.query.storeId;

    // If storeId is in request, verify it matches user's store
    if (requestedStoreId) {
      // Normalize both IDs to strings for comparison
      const userStoreId = req.user.storeId.toString();
      const reqStoreId = requestedStoreId.toString();
      
      // Trim to 24 characters if longer (handle malformed IDs)
      const normalizedUserStoreId = userStoreId.substring(0, 24);
      const normalizedReqStoreId = reqStoreId.substring(0, 24);
      
      if (normalizedReqStoreId !== normalizedUserStoreId) {
        console.log(`Access denied: User store ${normalizedUserStoreId} !== Requested store ${normalizedReqStoreId}`);
        return res.status(403).json({ 
          success: false,
          error: 'Access denied to this store' 
        });
      }
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
