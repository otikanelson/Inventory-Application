# Implementation Plan: Admin Authentication and UX Improvements

## Overview

This implementation plan addresses critical authentication and UX issues by properly differentiating Login PINs from Admin Security PINs, fixing navigation flows, adding category validation, updating the admin layout, and resolving UI bugs. The implementation follows a bottom-up approach: backend changes first, then frontend authentication, then UI updates.

## Tasks

- [x] 1. Backend Database Schema Updates
  - [x] 1.1 Update User model to add loginPin and securityPin fields
    - Modify `backend/src/models/User.js`
    - Add `loginPin` field (required, 4 digits, validated)
    - Add `securityPin` field (required for admin role, 4 digits, validated)
    - Update indexes to use `loginPin` instead of `pin`
    - Keep old `pin` field temporarily for migration
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [ ]* 1.2 Write property test for User model PIN fields
    - **Property 2: Role-Based PIN Requirements**
    - **Validates: Requirements 2.3, 2.4**

  - [x] 1.3 Create database migration script
    - Create `backend/src/migrations/migrate-pins.js`
    - Copy existing `pin` field to `loginPin` for all users
    - For admin users, copy `pin` to both `loginPin` and `securityPin`
    - Log migration results
    - _Requirements: 2.5_

  - [ ]* 1.4 Write unit tests for migration script
    - Test migration with various user roles
    - Test idempotency (running twice doesn't break)
    - _Requirements: 2.5_

- [x] 2. Backend API Endpoints
  - [x] 2.1 Update login endpoint to use loginPin
    - Modify `backend/src/routes/auth.js` login handler
    - Change PIN validation to check `loginPin` field
    - Return user role in response for navigation
    - _Requirements: 1.3, 5.4_

  - [x] 2.2 Create verify-admin-security-pin endpoint
    - Add `POST /auth/verify-admin-security-pin` route
    - Accept `{ storeId, pin }` in request body
    - Find admin user by storeId and role='admin'
    - Verify PIN against admin's `securityPin` field
    - Return `{ success: boolean, message?: string }`
    - _Requirements: 10.5, 11.1, 11.2_

  - [ ]* 2.3 Write unit tests for verify-admin-security-pin endpoint
    - Test with valid admin Security PIN
    - Test with invalid PIN
    - Test with non-existent storeId
    - _Requirements: 10.5, 11.1, 11.2_

  - [x] 2.4 Create categories API endpoints
    - Add `GET /categories` route (returns all categories)
    - Add `POST /categories` route (admin only, creates category)
    - Add authentication middleware to POST route
    - Validate category name (required, unique, trimmed)
    - _Requirements: 11.3, 11.4, 11.5_

  - [ ]* 2.5 Write unit tests for categories endpoints
    - Test GET returns all categories
    - Test POST creates category (admin)
    - Test POST rejects non-admin users
    - Test POST validates category name
    - _Requirements: 11.3, 11.4, 11.5_

- [ ] 3. Checkpoint - Backend Complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 4. Frontend AsyncStorage Migration
  - [x] 4.1 Create PIN migration utility
    - Create `utils/pinMigration.ts`
    - Check for old `admin_pin` key
    - Copy to `admin_login_pin` if new key doesn't exist
    - Set `pin_migration_completed` flag
    - Log migration actions
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 4.2 Write property test for PIN migration
    - **Property 7: PIN Migration Preserves Data**
    - **Validates: Requirements 9.1, 9.2, 9.3**

  - [x] 4.3 Call migration utility on app startup
    - Modify `App.tsx` or `context/AuthContext.tsx`
    - Call migration utility before authentication check
    - Handle migration errors gracefully
    - _Requirements: 9.1_

- [x] 5. Frontend Authentication Updates
  - [x] 5.1 Update AuthContext to handle both PIN types
    - Modify `context/AuthContext.tsx`
    - Update login function to use loginPin
    - Add `verifySecurityPIN` method for sensitive operations
    - Update AsyncStorage keys to use `admin_login_pin`
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 5.2 Write property test for login authentication
    - **Property 3: Login Authentication Uses Login PIN**
    - **Validates: Requirements 1.3**

  - [x] 5.3 Add role-based navigation after login
    - Modify login success handler in `context/AuthContext.tsx`
    - Check user role from response
    - Navigate to `/admin/stats` for admin role
    - Navigate to `/(tabs)` for staff role
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 5.4 Write property test for role-based navigation
    - **Property 6: Role-Based Navigation After Login**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [x] 5.5 Create verifySecurityPIN method
    - Add method to AuthContext
    - For admin: verify against local `admin_security_pin`
    - For staff: call backend `/auth/verify-admin-security-pin`
    - Return boolean indicating success
    - _Requirements: 1.4, 10.1, 10.2, 10.3_

  - [ ]* 5.6 Write property test for security PIN verification
    - **Property 4: Sensitive Operations Require Security PIN**
    - **Validates: Requirements 1.4, 10.1, 10.2, 10.3**

- [x] 6. Security Settings Page Updates
  - [x] 6.1 Split security settings into two sections
    - Modify `app/admin/settings/security.tsx`
    - Create "Login PIN Management" section
    - Create "Admin Security PIN Management" section
    - Update all labels to use correct terminology
    - _Requirements: 3.4, 12.2_

  - [x] 6.2 Update "Require PIN for delete" setting
    - Change label to "Require Admin Security PIN for delete"
    - Update AsyncStorage key if needed
    - Update help text to clarify it's Security PIN
    - _Requirements: 3.1, 3.3_

  - [ ]* 6.3 Write unit tests for security settings
    - Test PIN update flows
    - Test setting toggles
    - Test label text correctness
    - _Requirements: 3.1, 3.3, 3.4_

- [ ] 7. Product Registration Category Validation
  - [x] 7.1 Add category fetching to add-products page
    - Modify `app/(tabs)/add-products.tsx`
    - Fetch categories from `GET /categories` on mount
    - Store in state `availableCategories`
    - _Requirements: 4.3, 4.4_

  - [x] 7.2 Add category validation before registration
    - Add validation function `validateCategory`
    - Check if category exists in `availableCategories`
    - Show error if category not found
    - Prevent registration if invalid
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]* 7.3 Write property test for category validation
    - **Property 5: Category Validation Before Registration**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 7.4 Update category picker to show only valid categories
    - Modify category picker modal
    - Display only categories from `availableCategories`
    - Sort alphabetically
    - _Requirements: 4.4_

- [ ] 8. Product Registration Security PIN Prompt
  - [ ] 8.1 Add Security PIN modal to add-products page
    - Add modal state `showSecurityPINModal`
    - Create PIN input modal component
    - Show modal before registration
    - _Requirements: 1.4, 12.3_

  - [ ] 8.2 Verify Security PIN before registration
    - Call `verifySecurityPIN` from AuthContext
    - If valid, proceed with registration
    - If invalid, show error and stay on modal
    - _Requirements: 1.4, 10.2, 10.3, 10.4_

  - [ ]* 8.3 Write integration test for registration flow
    - Test complete flow: form fill → PIN prompt → verify → register
    - Test with valid and invalid PINs
    - _Requirements: 1.4, 10.2, 10.3_

- [ ] 9. Product Deletion Security PIN Update
  - [x] 9.1 Update delete product modal
    - Modify `app/admin/product/[id].tsx`
    - Change PIN prompt label to "Enter Admin Security PIN"
    - Update validation to use Security PIN
    - _Requirements: 3.2, 12.4_

  - [x] 9.2 Verify Security PIN for deletion
    - Call `verifySecurityPIN` from AuthContext
    - If valid, proceed with deletion
    - If invalid, show error
    - _Requirements: 3.2_

- [x] 10. Admin Layout Tab Updates
  - [x] 10.1 Remove settings tab from admin layout
    - Modify `app/admin/_layout.tsx`
    - Remove `<Tabs.Screen name="settings" />` from bottom tabs
    - Keep settings routes as hidden screens
    - _Requirements: 6.1_

  - [x] 10.2 Add add-products tab to admin layout
    - Add `<Tabs.Screen name="add-products" />` to bottom tabs
    - Set appropriate icon and label
    - Position between scan and stats tabs
    - _Requirements: 6.2, 6.5_

  - [x] 10.3 Add settings button to admin stats page
    - Modify `app/admin/stats.tsx`
    - Add settings icon button in header
    - Navigate to `/admin/settings` on press
    - _Requirements: 6.3, 6.4_

  - [ ]* 10.4 Write unit tests for admin layout
    - Test tab visibility
    - Test settings button navigation
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 11. UI Fixes
  - [x] 11.1 Fix edit category modal design
    - Modify `app/admin/product/[id].tsx`
    - Update modal styling (spacing, borders, colors)
    - Ensure theme consistency
    - Add input validation
    - Improve button touch targets
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [x] 11.2 Refresh product details after category update
    - Add refresh logic after category save
    - Fetch updated product data
    - Update UI to reflect changes
    - _Requirements: 7.4_

  - [x] 11.3 Fix add generic price feature
    - Locate add generic price functionality
    - Debug why it's not working
    - Fix price input modal display
    - Fix price validation
    - Fix backend API call
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 11.4 Write unit tests for UI fixes
    - Test edit category modal
    - Test add generic price feature
    - _Requirements: 7.1, 8.1_

- [ ] 12. UI Text and Label Updates
  - [ ] 12.1 Update all PIN-related text across the app
    - Search for "Admin PIN" references
    - Replace with "Login PIN" or "Admin Security PIN" based on context
    - Update help tooltips
    - Update error messages
    - _Requirements: 12.1, 12.5_

  - [ ] 12.2 Add help tooltips for PIN differentiation
    - Add tooltip to security settings page
    - Explain difference between Login PIN and Security PIN
    - Add tooltip to product registration page
    - _Requirements: 12.5_

  - [ ]* 12.3 Write property test for UI text consistency
    - **Property 10: UI Text Consistency**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [ ] 13. Final Checkpoint - Integration Testing
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Additional Features (User Requested)
  - [x] 14.1 Add staff deletion to admin profile settings
    - Add delete button to each staff card
    - Create delete confirmation modal
    - Call `DELETE /auth/staff/:id` endpoint
    - Refresh staff list after deletion
    - Show success/error toast notifications
    - _User Request: Allow admin to delete staff members_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Backend changes must be completed before frontend changes
- Migration must run before authentication updates
- UI updates can be done in parallel after authentication is complete

