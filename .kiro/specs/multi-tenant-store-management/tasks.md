# Implementation Plan: Multi-Tenant Store Management System

## Overview

This implementation plan transforms the single-user inventory system into a multi-tenant architecture with three hierarchical user roles (Author, Store Admin, Staff) and complete data isolation between stores. The implementation follows an incremental approach: database schema updates, backend API changes, authentication system, middleware, frontend updates, data migration, and comprehensive testing.

## Tasks

- [x] 1. Database Schema Updates
  - [x] 1.1 Create Store model
    - Create `backend/src/models/Store.js` with fields: name, ownerId, createdAt, updatedAt, isActive
    - Add unique index on name field
    - Add index on ownerId field
    - _Requirements: 2.1, 2.2, 2.3, 11.1_
  
  - [ ]* 1.2 Write property test for Store model
    - **Property 6: Store ID Uniqueness**
    - **Validates: Requirements 2.2**
  
  - [x] 1.3 Update User model with multi-tenant fields
    - Add 'author' to role enum
    - Add storeId field (ObjectId, ref: Store, nullable)
    - Add storeName field (String, nullable)
    - Update PIN uniqueness constraint to compound index: { pin: 1, role: 1, storeId: 1 }
    - Add index: { storeId: 1, role: 1 }
    - _Requirements: 11.2, 11.3, 11.6_
  
  - [ ]* 1.4 Write property test for User model updates
    - **Property 1: User Role Assignment**
    - **Validates: Requirements 1.2**
  
  - [ ] 1.5 Update Product model with storeId
    - Add storeId field (ObjectId, ref: Store, required)
    - Update barcode uniqueness to compound index: { storeId: 1, barcode: 1 }
    - Update internalCode uniqueness to compound index: { storeId: 1, internalCode: 1 }
    - Add indexes: { storeId: 1, category: 1 }, { storeId: 1, totalQuantity: 1 }
    - _Requirements: 11.4_
  
  - [ ] 1.6 Update Sale model with storeId
    - Add storeId field (ObjectId, ref: Store, required)
    - Add indexes: { storeId: 1, saleDate: -1 }, { storeId: 1, productId: 1, saleDate: -1 }, { storeId: 1, category: 1, saleDate: -1 }
    - _Requirements: 11.5_
  
  - [ ]* 1.7 Write property test for data entity store association
    - **Property 7: Data Entity Store Association**
    - **Validates: Requirements 3.1, 3.2, 3.3, 11.4, 11.5**
  
  - [ ]* 1.8 Write property test for referential integrity
    - **Property 21: Referential Integrity**
    - **Validates: Requirements 11.8**

- [ ] 2. Authentication Middleware
  - [ ] 2.1 Create authentication middleware
    - Create `backend/src/middleware/authenticate.js`
    - Extract and validate session token from Authorization header
    - For author role: set req.user with isAuthor=true
    - For admin/staff: fetch user from database and set req.user with storeId
    - Handle invalid/missing tokens with 401 responses
    - _Requirements: 12.1, 12.2_
  
  - [ ]* 2.2 Write property test for authentication token verification
    - **Property 17: Authentication Token Verification**
    - **Validates: Requirements 12.1, 12.2**
  
  - [ ] 2.3 Create tenant filter middleware
    - Create `backend/src/middleware/tenantFilter.js`
    - Skip filtering for author users (check req.user.isAuthor)
    - Inject req.tenantFilter = { storeId: req.user.storeId } for admin/staff
    - Validate route params don't reference other stores
    - Return 403 for cross-store access attempts
    - _Requirements: 3.7, 8.6_
  
  - [ ]* 2.4 Write property test for store isolation
    - **Property 2: Store Isolation for Non-Author Users**
    - **Validates: Requirements 1.4, 1.5, 2.5, 3.4, 3.5, 5.6, 7.2, 7.5, 8.1, 8.2, 8.3**
  
  - [ ] 2.5 Create store access validator middleware
    - Create `backend/src/middleware/validateStoreAccess.js`
    - Allow author to access all stores
    - Extract storeId from request (body, params, query)
    - Verify storeId matches user's storeId for admin/staff
    - Return 403 for mismatched storeId
    - _Requirements: 12.3, 12.4, 12.5_
  
  - [ ]* 2.6 Write property test for request storeId validation
    - **Property 18: Request StoreId Validation**
    - **Validates: Requirements 12.3, 12.4**
  
  - [ ]* 2.7 Write property test for author bypass
    - **Property 19: Author Bypasses StoreId Validation**
    - **Validates: Requirements 12.5**

- [ ] 3. Checkpoint - Verify middleware and models
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Author Authentication System
  - [ ] 4.1 Create author authentication controller
    - Add `authorLogin` function to `backend/src/controllers/authController.js`
    - Accept secretKey in request body
    - Compare secretKey with process.env.MONGODB_PASSWORD
    - Generate session token with role='author', userId='author'
    - Return user object with role='author' and session token
    - Return 401 for invalid secret key
    - _Requirements: 4.1, 4.2, 13.2_
  
  - [ ]* 4.2 Write property test for author authentication
    - **Property 8: Author Authentication with Secret Key**
    - **Validates: Requirements 4.1, 4.2**
  
  - [ ] 4.3 Add author login route
    - Add POST /api/auth/author/login to `backend/src/routes/authRoutes.js`
    - Route to authController.authorLogin
    - No authentication middleware required
    - _Requirements: 13.2_
  
  - [ ]* 4.4 Write unit tests for author authentication
    - Test successful login with correct secret key
    - Test failed login with incorrect secret key
    - Test missing secret key returns 400
    - _Requirements: 4.1, 4.2_

- [ ] 5. Store Management System
  - [ ] 5.1 Create store controller
    - Create `backend/src/controllers/storeController.js`
    - Implement createStore function (name, ownerId)
    - Implement getStore function (by ID, with admin check)
    - Implement getAllStores function (author only)
    - Implement getStoreDetails function (store with admins, staff, stats)
    - _Requirements: 2.1, 2.3, 13.1, 13.4_
  
  - [ ]* 5.2 Write property test for store creation
    - **Property 5: Store Creation During Admin Setup**
    - **Validates: Requirements 2.1, 2.3, 2.4, 5.3, 5.4**
  
  - [ ]* 5.3 Write property test for store name uniqueness
    - **Property 20: Store Name Uniqueness**
    - **Validates: Requirements 14.4**
  
  - [ ] 5.4 Create store routes
    - Create `backend/src/routes/storeRoutes.js`
    - POST /api/stores - createStore (internal use during setup)
    - GET /api/stores/:storeId - getStore (admin/author)
    - GET /api/stores - getAllStores (author only)
    - GET /api/stores/:storeId/details - getStoreDetails (author only)
    - Apply authentication and store access middleware
    - _Requirements: 13.1, 13.4_
  
  - [ ]* 5.5 Write unit tests for store management
    - Test store creation with valid data
    - Test duplicate store name rejection
    - Test admin can view their store
    - Test admin cannot view other stores
    - Test author can view all stores
    - _Requirements: 2.1, 2.5, 2.6, 14.4_

- [ ] 6. Updated Admin Setup with Store Creation
  - [ ] 6.1 Update setupAdmin controller function
    - Modify `backend/src/controllers/authController.js` setupAdmin function
    - Add storeName to required fields
    - Validate storeName is unique (case-insensitive)
    - Create Store entity first with provided name
    - Create admin user with storeId and storeName fields
    - Return both user and store data in response
    - Handle errors: duplicate store name (400), validation errors (400)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 14.2, 14.4_
  
  - [ ]* 6.2 Write property test for admin setup validation
    - **Property 10: Admin Setup Input Validation**
    - **Validates: Requirements 5.1, 5.2, 14.2, 14.4**
  
  - [ ]* 6.3 Write unit tests for admin setup
    - Test successful admin setup with store creation
    - Test empty store name rejection
    - Test duplicate store name rejection
    - Test invalid PIN format rejection
    - Test admin user has correct storeId
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 14.2, 14.4_

- [ ] 7. Updated Authentication for Admin and Staff
  - [ ] 7.1 Update login controller function
    - Modify `backend/src/controllers/authController.js` login function
    - Add optional storeName parameter for admin login
    - Query by { pin, role, isActive: true } and optionally storeName
    - Return user data including storeId and storeName
    - Update session token to include storeId
    - _Requirements: 5.5, 7.1_
  
  - [ ]* 7.2 Write property test for PIN authentication
    - **Property 11: PIN-Based Authentication**
    - **Validates: Requirements 5.5, 7.1**
  
  - [ ]* 7.3 Write unit tests for updated login
    - Test admin login with correct PIN
    - Test staff login with correct PIN
    - Test login with incorrect PIN
    - Test inactive user cannot login
    - Test response includes storeId and storeName
    - _Requirements: 5.5, 7.1_

- [ ] 8. Checkpoint - Verify authentication system
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Updated Staff Management
  - [ ] 9.1 Update createStaff controller function
    - Modify `backend/src/controllers/authController.js` createStaff function
    - Remove storeId from request body (auto-inject from req.user.storeId)
    - Add storeName from req.user.storeName
    - Validate admin role (only admins can create staff)
    - Associate staff with admin's storeId
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 9.2 Write property test for staff creation
    - **Property 12: Staff Creation Inherits Store**
    - **Validates: Requirements 6.1**
  
  - [ ]* 9.3 Write property test for staff creation validation
    - **Property 13: Staff Creation Input Validation**
    - **Validates: Requirements 6.2**
  
  - [ ]* 9.4 Write property test for cross-store prevention
    - **Property 14: Cross-Store Staff Management Prevention**
    - **Validates: Requirements 6.3, 6.5**
  
  - [ ] 9.5 Update deleteStaff controller function
    - Modify `backend/src/controllers/authController.js` deleteStaff function
    - Verify staff member belongs to admin's store (check storeId)
    - Return 403 if storeId doesn't match
    - Delete staff member from database
    - _Requirements: 6.4, 6.5, 6.6_
  
  - [ ]* 9.6 Write property test for staff deletion
    - **Property 15: Staff Deletion**
    - **Validates: Requirements 6.4, 6.6**
  
  - [ ] 9.7 Update getStaff controller function
    - Modify `backend/src/controllers/authController.js` getStaff function
    - Filter staff by req.user.storeId for admin
    - Return all staff for author
    - _Requirements: 6.1, 13.7_
  
  - [ ]* 9.8 Write unit tests for staff management
    - Test admin can create staff in their store
    - Test admin cannot create staff for other stores
    - Test admin can delete staff in their store
    - Test admin cannot delete staff from other stores
    - Test staff list filtered by store
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 10. Author Dashboard API
  - [ ] 10.1 Create author controller
    - Create `backend/src/controllers/authorController.js`
    - Implement getAllStores function (with admin/staff counts, product counts)
    - Implement getStoreDetails function (store, admins, staff, statistics)
    - Implement getAllUsers function (all users across all stores)
    - Verify author role in each function
    - _Requirements: 4.4, 4.5, 9.1, 9.2, 9.3, 9.4, 9.6, 13.4, 13.5, 13.6_
  
  - [ ]* 10.2 Write property test for author global access
    - **Property 3: Author Global Access**
    - **Validates: Requirements 1.3, 2.6, 3.6, 4.3, 8.5, 9.1**
  
  - [ ]* 10.3 Write property test for author dashboard data
    - **Property 9: Author Dashboard Data Completeness**
    - **Validates: Requirements 4.4, 4.5, 9.2, 9.3, 9.4, 9.6**
  
  - [ ] 10.4 Create author routes
    - Create `backend/src/routes/authorRoutes.js`
    - GET /api/author/stores - getAllStores
    - GET /api/author/stores/:storeId - getStoreDetails
    - GET /api/author/users - getAllUsers
    - Apply authentication middleware (author only)
    - _Requirements: 13.4, 13.5, 13.6_
  
  - [ ]* 10.5 Write unit tests for author dashboard
    - Test author can retrieve all stores
    - Test author can retrieve store details with admins and staff
    - Test author can retrieve all users
    - Test non-author cannot access author endpoints
    - _Requirements: 4.4, 4.5, 9.1, 9.2, 9.3_

- [ ] 11. Update Product Endpoints with Multi-Tenant Filtering
  - [ ] 11.1 Update product controller functions
    - Modify all functions in `backend/src/controllers/productController.js`
    - Add storeId to product creation (from req.user.storeId)
    - Add storeId filter to all queries (use req.tenantFilter)
    - Skip filtering for author (check req.user.isAuthor)
    - Verify product belongs to user's store before update/delete
    - _Requirements: 3.1, 3.4, 8.1, 13.8_
  
  - [ ] 11.2 Apply middleware to product routes
    - Update `backend/src/routes/productRoutes.js`
    - Apply authenticate middleware to all routes
    - Apply tenantFilter middleware to all routes
    - Apply validateStoreAccess middleware to update/delete routes
    - _Requirements: 12.6_
  
  - [ ]* 11.3 Write unit tests for product multi-tenancy
    - Test admin can create products in their store
    - Test admin can only see their store's products
    - Test admin cannot access other stores' products
    - Test author can see all products
    - Test product update validates store ownership
    - _Requirements: 3.1, 3.4, 3.5, 8.1_

- [ ] 12. Update Sale Endpoints with Multi-Tenant Filtering
  - [ ] 12.1 Update sale controller functions
    - Modify all functions in `backend/src/controllers/saleController.js`
    - Add storeId to sale creation (from req.user.storeId)
    - Add storeId filter to all queries (use req.tenantFilter)
    - Skip filtering for author (check req.user.isAuthor)
    - Verify sale belongs to user's store before operations
    - _Requirements: 3.2, 3.4, 8.2, 13.8_
  
  - [ ] 12.2 Apply middleware to sale routes
    - Update `backend/src/routes/saleRoutes.js`
    - Apply authenticate middleware to all routes
    - Apply tenantFilter middleware to all routes
    - Apply validateStoreAccess middleware where needed
    - _Requirements: 12.6_
  
  - [ ]* 12.3 Write unit tests for sale multi-tenancy
    - Test admin can create sales in their store
    - Test admin can only see their store's sales
    - Test admin cannot access other stores' sales
    - Test author can see all sales
    - _Requirements: 3.2, 3.4, 3.5, 8.2_

- [ ] 13. Checkpoint - Verify backend API changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Update Other Inventory Endpoints
  - [ ] 14.1 Update category controller with multi-tenant filtering
    - Modify `backend/src/controllers/categoryController.js`
    - Add storeId filter to all category queries
    - Skip filtering for author
    - _Requirements: 3.3, 3.4, 8.3_
  
  - [ ] 14.2 Update analytics controller with multi-tenant filtering
    - Modify analytics-related controllers
    - Add storeId filter to all analytics queries
    - Skip filtering for author
    - Ensure aggregation pipelines include storeId matching
    - _Requirements: 3.3, 3.4, 8.3_
  
  - [ ] 14.3 Apply middleware to remaining routes
    - Update all remaining route files
    - Apply authenticate middleware
    - Apply tenantFilter middleware
    - Apply validateStoreAccess where needed
    - _Requirements: 12.6_
  
  - [ ]* 14.4 Write property test for staff inventory operations
    - **Property 16: Staff Inventory Operations**
    - **Validates: Requirements 7.6**
  
  - [ ]* 14.5 Write property test for role-based permissions
    - **Property 4: Role-Based Permission Hierarchy**
    - **Validates: Requirements 1.6, 7.3, 7.4**

- [ ] 15. Wire Backend Routes to Server
  - [ ] 15.1 Update server.js with new routes
    - Add authorRoutes to `backend/src/server.js`
    - Add storeRoutes to server
    - Ensure all routes are properly mounted
    - Verify middleware order (authenticate before tenantFilter)
    - _Requirements: 13.1, 13.2, 13.4, 13.5, 13.6_
  
  - [ ]* 15.2 Write integration tests for complete backend
    - Test end-to-end authentication flows
    - Test multi-tenant data isolation
    - Test role-based access control
    - Test store creation and user association
    - _Requirements: 1.3, 1.4, 1.5, 3.4, 3.5_

- [x] 16. Frontend: Author Login Component
  - [x] 16.1 Create AuthorLogin component
    - Create `components/AuthorLogin.tsx`
    - Add secret key input field (password type)
    - Add login button
    - Call POST /api/auth/author/login
    - Handle success: store session token, navigate to author dashboard
    - Handle errors: display error message
    - _Requirements: 4.1, 10.4_
  
  - [x] 16.2 Add author login link to setup page
    - Update setup screen to include small, discreet "Author Login" link
    - Link opens AuthorLogin modal or navigates to author login page
    - _Requirements: 10.1, 10.3_
  
  - [x] 16.3 Add author login link to login page
    - Update login screen to include small, discreet "Author Login" link
    - Link opens AuthorLogin modal or navigates to author login page
    - _Requirements: 10.2, 10.3_

- [x] 17. Frontend: Author Dashboard
  - [x] 17.1 Create AuthorDashboard screen
    - Create `app/(author)/dashboard.tsx`
    - Fetch all stores from GET /api/author/stores
    - Display stores in list/grid with stats (admin count, staff count, product count)
    - Add navigation to store detail view
    - Add system-wide statistics summary
    - _Requirements: 4.4, 9.1, 9.4, 9.5, 15.3_
  
  - [x] 17.2 Create StoreDetail screen for author
    - Create `app/(author)/store/[id].tsx`
    - Fetch store details from GET /api/author/stores/:storeId
    - Display store information (name, owner, created date)
    - Display list of admins with last login
    - Display list of staff with creator and last login
    - Display store statistics (products, sales, revenue)
    - _Requirements: 4.5, 9.2, 9.3, 9.4, 15.4_
  
  - [x] 17.3 Add author navigation
    - Create author-specific navigation structure
    - Add navigation between dashboard and store details
    - Add logout functionality
    - _Requirements: 9.5, 15.6_

- [x] 18. Frontend: Update Admin Setup
  - [x] 18.1 Update SetupScreen with store name input
    - Modify `app/(auth)/setup.tsx`
    - Add storeName input field (required)
    - Update form validation to require storeName
    - Update API call to POST /api/auth/setup with storeName
    - Handle response with store data
    - Display success message with store name
    - _Requirements: 5.1, 14.1, 14.2, 14.5_
  
  - [ ]* 18.2 Write component tests for admin setup
    - Test store name input is required
    - Test form submission includes store name
    - Test error handling for duplicate store name
    - _Requirements: 5.1, 14.2, 14.4_

- [x] 19. Frontend: Update Admin Settings with Staff Deletion
  - [x] 19.1 Add delete staff functionality
    - Modify admin settings screen
    - Add "Delete" button next to each staff member
    - Add confirmation modal before deletion
    - Call DELETE /api/auth/staff/:id
    - Refresh staff list after successful deletion
    - Handle errors (e.g., staff from another store)
    - _Requirements: 6.4, 6.5_
  
  - [ ]* 19.2 Write component tests for staff deletion
    - Test delete button appears for each staff
    - Test confirmation modal shows before deletion
    - Test successful deletion removes staff from list
    - Test error handling for failed deletion
    - _Requirements: 6.4, 6.5_

- [x] 20. Frontend: Update Authentication Context
  - [x] 20.1 Update auth context with store information
    - Modify authentication context/provider
    - Store storeId and storeName in user state
    - Store isAuthor flag for author users
    - Update login functions to handle author vs admin/staff
    - Update session storage to include store information
    - _Requirements: 4.3, 5.6, 7.2_
  
  - [x] 20.2 Update API client with store filtering
    - Modify API client/axios instance
    - Include storeId in requests where needed
    - Handle 403 errors for cross-store access
    - Skip storeId for author requests
    - _Requirements: 3.4, 3.5, 12.3_

- [ ] 21. Checkpoint - Verify frontend changes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Data Migration Script
  - [x] 22.1 Create migration script
    - Create `backend/scripts/migrate-to-multi-tenant.js`
    - Step 1: Create default store named "Default Store"
    - Step 2: Update all existing users with storeId = defaultStore._id
    - Step 3: Update all existing products with storeId = defaultStore._id
    - Step 4: Update all existing sales with storeId = defaultStore._id
    - Step 5: Create new indexes on storeId fields
    - Step 6: Verify all documents have storeId
    - Step 7: Verify referential integrity
    - Add rollback capability
    - Add dry-run mode for testing
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [ ]* 22.2 Write tests for migration script
    - Test default store creation
    - Test user migration
    - Test product migration
    - Test sale migration
    - Test referential integrity after migration
    - Test idempotency (can run multiple times safely)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_
  
  - [ ] 22.3 Create migration documentation
    - Document migration steps
    - Document backup requirements
    - Document rollback procedure
    - Document verification steps
    - _Requirements: 16.6_

- [ ] 23. Environment Configuration
  - [ ] 23.1 Update environment variables
    - Ensure MONGODB_PASSWORD is set in .env
    - Add any new configuration needed
    - Update .env.example with new variables
    - Document environment setup
    - _Requirements: 4.2_
  
  - [ ] 23.2 Update deployment configuration
    - Update render.yaml or deployment config
    - Ensure environment variables are configured
    - Add migration script to deployment process
    - _Requirements: 4.2_

- [ ] 24. Property-Based Testing Setup
  - [ ] 24.1 Install fast-check library
    - Add fast-check to backend devDependencies
    - Configure test runner for property tests
    - Create test utilities for generating random test data
    - _Requirements: Testing Strategy_
  
  - [ ] 24.2 Create test data generators
    - Create generators for User entities (all roles)
    - Create generators for Store entities
    - Create generators for Product entities
    - Create generators for Sale entities
    - Create generators for valid PINs, store names, etc.
    - _Requirements: Testing Strategy_
  
  - [ ] 24.3 Configure property test execution
    - Set minimum 100 iterations per property test
    - Add property test tags with feature name and property number
    - Configure test reporting
    - _Requirements: Testing Strategy_

- [ ] 25. Final Integration Testing
  - [ ]* 25.1 Write end-to-end integration tests
    - Test complete author workflow (login, view stores, view details)
    - Test complete admin workflow (setup, create staff, manage inventory)
    - Test complete staff workflow (login, view inventory, record sales)
    - Test data isolation between stores
    - Test role-based access control
    - _Requirements: 1.3, 1.4, 1.5, 3.4, 3.5, 4.3, 5.6, 7.2_
  
  - [ ]* 25.2 Write security tests
    - Test cross-store access prevention
    - Test role escalation prevention
    - Test authentication bypass prevention
    - Test storeId tampering prevention
    - _Requirements: 2.5, 3.5, 6.3, 6.5, 12.3, 12.4_
  
  - [ ]* 25.3 Write performance tests
    - Test query performance with storeId indexes
    - Test multi-tenant query filtering overhead
    - Test concurrent access from multiple stores
    - _Requirements: 11.7_

- [ ] 26. Final Checkpoint - Complete System Verification
  - Run all tests (unit, property, integration)
  - Verify all requirements are met
  - Test migration script on staging data
  - Verify frontend and backend integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties with randomized inputs
- Unit tests validate specific examples and edge cases
- Migration script should be tested thoroughly before production deployment
- Backend uses JavaScript (Node.js/Express), frontend uses TypeScript (React Native)
- Use fast-check library for property-based testing with minimum 100 iterations per test
