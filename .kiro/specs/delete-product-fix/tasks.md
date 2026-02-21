# Implementation Plan: Delete Product Fix

## Overview

This implementation plan addresses the production failure where `req.user` is undefined in the `validateStoreAccess` middleware. The approach focuses on adding version tracking, enhancing logging, creating diagnostic tools, and verifying deployment integrity. Tasks are ordered to enable early diagnosis and incremental validation.

## Tasks

- [ ] 1. Add version tracking and enhanced logging to middleware
  - [ ] 1.1 Update authenticate middleware with version constant and enhanced logging
    - Add `MIDDLEWARE_VERSION = 'v3.0'` constant at top of file
    - Log version, request ID, method, and path on every execution
    - Log JWT_SECRET prefix (first 4 chars) on module load for verification
    - Add request ID to all log statements
    - Ensure all error paths have explicit return statements (verify existing code)
    - _Requirements: 2.4, 4.1, 5.1, 6.5_
  
  - [ ] 1.2 Update validateStoreAccess middleware with version constant and defensive checks
    - Update version constant to `MIDDLEWARE_VERSION = 'v3.0'`
    - Add immediate check at function entry: if req.user is undefined, return 401 with detailed error
    - Log version, request ID, and req.user existence on every execution
    - Log sanitized req.user object (id, role, storeId) when it exists
    - Add request ID to all log statements
    - _Requirements: 3.2, 4.2, 5.2_

- [ ] 2. Create request ID middleware
  - [ ] 2.1 Implement requestId middleware
    - Create `backend/src/middleware/requestId.js`
    - Generate unique ID using `crypto.randomUUID()` or timestamp-based ID
    - Set `req.id` property
    - Add request ID to response headers as `X-Request-ID`
    - _Requirements: 5.1, 5.2, 5.5_
  
  - [ ] 2.2 Add requestId middleware to product routes
    - Import requestId middleware in `backend/src/routes/productRoutes.js`
    - Apply as first middleware: `router.use(requestId)`
    - Ensure it runs before authenticate middleware
    - _Requirements: 3.1, 5.1_

- [ ] 3. Create diagnostic endpoints
  - [ ] 3.1 Create diagnostic routes file
    - Create `backend/src/routes/diagnosticRoutes.js`
    - Set up Express router
    - Export router
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 3.2 Implement version endpoint
    - Add GET `/api/diagnostics/version` endpoint
    - Return middleware versions (authenticate, validateStoreAccess)
    - Return deployment timestamp from environment variable
    - Return environment name (production/development)
    - Return JWT_SECRET prefix (first 4 characters)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.5_
  
  - [ ] 3.3 Implement auth-test endpoint
    - Add POST `/api/diagnostics/auth-test` endpoint
    - Accept JWT token in request body
    - Decode and verify token
    - Query user from database
    - Return detailed results (token valid, user found, user properties)
    - _Requirements: 1.1, 1.2, 6.1, 6.3_
  
  - [ ] 3.4 Implement middleware-chain test endpoint
    - Add POST `/api/diagnostics/middleware-chain` endpoint
    - Accept JWT token and product ID in request body
    - Manually execute each middleware in sequence
    - Track which middleware executed and what they set on req
    - Return detailed execution report
    - _Requirements: 1.3, 1.4, 3.1, 3.2, 3.3_
  
  - [ ] 3.5 Register diagnostic routes in server
    - Import diagnostic routes in `backend/src/server.js`
    - Mount at `/api/diagnostics` path
    - Ensure routes are accessible without authentication (for debugging)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 4. Create diagnostic scripts
  - [ ] 4.1 Create test-auth-flow script
    - Create `backend/scripts/test-auth-flow.js`
    - Accept environment argument (local/production)
    - Load JWT token from environment variable
    - Decode and verify token locally
    - Query user from database
    - Make DELETE request to test product endpoint
    - Output detailed results with color-coded status
    - _Requirements: 1.1, 1.2, 1.3, 7.3, 7.4_
  
  - [ ] 4.2 Create verify-deployment script
    - Create `backend/scripts/verify-deployment.js`
    - Call `/api/diagnostics/version` endpoint on production
    - Compare returned versions with local version constants
    - Report if versions match or mismatch
    - Check Git branch information
    - Output deployment status
    - _Requirements: 4.3, 4.4, 4.5, 10.3_

- [ ] 5. Update Vercel configuration
  - [ ] 5.1 Disable API route caching
    - Update `backend/vercel.json` Cache-Control header
    - Change from `public, max-age=30...` to `no-cache, no-store, must-revalidate`
    - Add `Pragma: no-cache` header
    - Add `Expires: 0` header
    - _Requirements: 10.1, 10.2, 10.4_
  
  - [ ] 5.2 Add deployment timestamp environment variable
    - Add `DEPLOYMENT_TIMESTAMP` to Vercel environment variables
    - Set value to current timestamp during deployment
    - Document in README how to set this
    - _Requirements: 4.1, 4.3_

- [ ] 6. Verify and fix middleware chain ordering
  - [ ] 6.1 Review productRoutes middleware application
    - Open `backend/src/routes/productRoutes.js`
    - Verify `router.use(authenticate)` is called before `router.use(tenantFilter)`
    - Verify both are called before any route-specific middleware
    - Verify DELETE route applies validateStoreAccess before deleteProduct
    - Add comments documenting middleware chain order
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ] 6.2 Ensure middleware returns are respected
    - Review authenticate middleware for explicit returns after all responses
    - Review validateStoreAccess middleware for explicit returns after all responses
    - Verify no code executes after return statements
    - _Requirements: 2.2, 2.3, 2.5, 3.4_

- [ ] 7. Add JWT secret validation on startup
  - [ ] 7.1 Create startup validation module
    - Create `backend/src/utils/validateEnvironment.js`
    - Check JWT_SECRET environment variable is set
    - Log warning if using fallback value
    - Log first 4 characters of JWT_SECRET for verification
    - Validate other critical environment variables
    - _Requirements: 6.1, 6.2, 6.4, 6.5_
  
  - [ ] 7.2 Call validation on server startup
    - Import validateEnvironment in `backend/src/server.js`
    - Call validation function before starting server
    - Exit with error if critical variables missing
    - _Requirements: 6.4, 6.5_

- [ ] 8. Checkpoint - Test locally before deployment
  - Run diagnostic scripts locally
  - Verify version endpoints work
  - Test auth-test endpoint with local token
  - Test middleware-chain endpoint
  - Verify all logs show version identifiers
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Deploy to Vercel and verify
  - [ ] 9.1 Deploy updated code to Vercel
    - Commit all changes with clear commit message
    - Push to correct Git branch
    - Trigger Vercel deployment
    - Wait for deployment to complete
    - _Requirements: 4.5, 10.1, 10.3_
  
  - [ ] 9.2 Run deployment verification
    - Run `node backend/scripts/verify-deployment.js`
    - Verify versions match local code
    - Check Vercel logs for version identifiers
    - Verify JWT_SECRET prefix matches expected value
    - _Requirements: 4.3, 4.4, 4.5, 10.3_
  
  - [ ] 9.3 Test delete product in production
    - Create test product using production API
    - Authenticate with production JWT token
    - Delete test product using production API
    - Verify deletion succeeds (200 status)
    - Check Vercel logs for detailed execution logs
    - Verify no "req.user is undefined" errors
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3_

- [ ] 10. Final verification and cleanup
  - [ ] 10.1 Test delete product in production UI
    - Open production application
    - Navigate to inventory page
    - Select a test product
    - Click delete button
    - Verify product is deleted successfully
    - Verify no errors in browser console
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [ ] 10.2 Review Vercel logs for any remaining issues
    - Check Vercel logs for the delete request
    - Verify all middleware executed in correct order
    - Verify req.user was set correctly
    - Verify no errors or warnings
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ] 10.3 Clean up test data
    - Remove any test products created during testing
    - Document the fix in project README or changelog
    - _Requirements: 7.5_

- [ ] 11. Document the solution
  - [ ] 11.1 Update README with diagnostic tools
    - Document how to use test-auth-flow.js script
    - Document how to use verify-deployment.js script
    - Document diagnostic endpoints and their usage
    - Add troubleshooting section for similar issues
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ] 11.2 Add deployment checklist
    - Create deployment checklist in README
    - Include steps to verify deployment
    - Include steps to check version identifiers
    - Include steps to test critical functionality
    - _Requirements: 4.3, 4.4, 4.5, 10.3_

## Notes

- Version tracking (v3.0) helps verify code is actually deployed
- Request IDs enable tracking requests through logs
- Diagnostic endpoints allow testing without modifying production code
- Scripts automate verification and reduce manual testing
- Disabling cache ensures deployments take effect immediately
- All middleware must have explicit return statements after error responses
- JWT_SECRET verification helps catch environment configuration issues
- Testing locally before deployment reduces deployment cycles
