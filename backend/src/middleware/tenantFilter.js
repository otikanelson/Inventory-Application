/**
 * Tenant Filter Middleware
 * Automatically injects storeId filter for admin/staff users
 * Skips filtering for author users
 * Validates route params don't reference other stores
 */
function tenantFilter(req, res, next) {
  try {
    // Skip filtering for author users
    if (req.user && req.user.isAuthor) {
      req.tenantFilter = {}; // No filter for author
      return next();
    }

    // Ensure user is authenticated
    if (!req.user || !req.user.storeId) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    // Inject storeId filter for queries
    req.tenantFilter = { storeId: req.user.storeId };

    // Validate route params don't reference other stores
    if (req.params.storeId && req.params.storeId !== req.user.storeId) {
      return res.status(403).json({ 
        success: false,
        error: 'Access denied to this store' 
      });
    }

    next();
  } catch (error) {
    console.error('Tenant filter error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Authorization failed' 
    });
  }
}

module.exports = tenantFilter;
