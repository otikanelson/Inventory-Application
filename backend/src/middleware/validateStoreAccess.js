/**
 * Store Access Validator Middleware
 * Validates that users can only access their own store's data
 * Author users bypass this validation
 */
function validateStoreAccess(req, res, next) {
  console.log('🔒 validateStoreAccess middleware called - Version 3.0');
  console.log('🔒 req.user exists:', !!req.user);
  console.log('🔒 req.method:', req.method);
  console.log('🔒 req.path:', req.path);
  
  // Log req.user details safely
  if (req.user) {
    console.log('🔒 req.user details:', {
      id: req.user.id,
      role: req.user.role,
      storeId: req.user.storeId,
      isAuthor: req.user.isAuthor
    });
  } else {
    console.error('🔒 req.user is undefined!');
  }
  
  try {
    // Ensure user is authenticated (req.user should be set by authenticate middleware)
    if (!req.user) {
      console.error('❌ validateStoreAccess: req.user is undefined - authenticate middleware may have failed');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        debug: 'req.user is undefined in validateStoreAccess'
      });
    }

    // Author can access all stores
    if (req.user.isAuthor) {
      console.log('✅ Author user - bypassing store validation');
      return next();
    }

    // Ensure user has a storeId
    if (!req.user.storeId) {
      console.error('❌ validateStoreAccess: User has no storeId:', req.user.id);
      return res.status(403).json({ 
        success: false,
        error: 'User not associated with any store' 
      });
    }

    // Extract storeId from request (body, params, or query)
    // Safely access req.body in case it's undefined
    const requestedStoreId = (req.body && req.body.storeId) || (req.params && req.params.storeId) || (req.query && req.query.storeId);
    console.log('🔒 Requested storeId:', requestedStoreId);
    console.log('🔒 User storeId:', req.user.storeId);

    // If storeId is in request, verify it matches user's store
    if (requestedStoreId) {
      // Normalize both IDs to strings for comparison
      const userStoreId = String(req.user.storeId);
      const reqStoreId = String(requestedStoreId);
      
      // Trim to 24 characters if longer (handle malformed IDs)
      const normalizedUserStoreId = userStoreId.substring(0, 24);
      const normalizedReqStoreId = reqStoreId.substring(0, 24);
      
      console.log('🔒 Comparing stores:', { normalizedUserStoreId, normalizedReqStoreId });
      
      if (normalizedReqStoreId !== normalizedUserStoreId) {
        console.log(`❌ Access denied: User store ${normalizedUserStoreId} !== Requested store ${normalizedReqStoreId}`);
        return res.status(403).json({ 
          success: false,
          error: 'Access denied to this store' 
        });
      }
    }

    console.log('✅ Store access validation passed');
    return next();
  } catch (error) {
    console.error('❌ Store access validation error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Safely log req.user without causing another error
    try {
      if (req.user) {
        console.error('req.user at error:', {
          id: req.user.id,
          role: req.user.role,
          storeId: req.user.storeId
        });
      } else {
        console.error('req.user is undefined at error');
      }
    } catch (logError) {
      console.error('Error logging req.user:', logError.message);
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Authorization failed',
      details: error.message
    });
  }
}

module.exports = validateStoreAccess;
