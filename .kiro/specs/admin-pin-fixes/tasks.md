# Implementation Plan: Admin PIN Fixes

## Overview

This plan addresses seven critical bugs in the inventory management app's authentication and PIN management system. The implementation will fix audio feedback, tour guide content, database schema, Security PIN warnings, logout flow, staff access handling, and redundant PIN checks.

## Tasks

- [x] 1. Fix Admin Scanner Audio Feedback
  - Add audio playback calls to admin scanner's handleBarCodeScanned function
  - Play scanBeep.play() after successful product lookups in lookup mode
  - Play scanBeep.play() after adding items to cart in sales mode
  - Play scanBeep.play() after successful registry operations in register mode
  - Test audio plays consistently across all scan modes
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Update Tour Guide Content
  - [x] 2.1 Update security settings tour step description
    - Modify step 5 in adminTourSteps array in context/AdminTourContext.tsx
    - Change description to mention both Login PIN and Security PIN
    - Update text to: "Set up your Login PIN for authentication and Security PIN for sensitive operations. Enable auto-logout for extra security."
    - _Requirements: 2.1, 2.4_
  
  - [x] 2.2 Verify tour guide highlight coordinates
    - Review all tour steps and verify highlight coordinates match current UI
    - Test tour guide navigation on actual device
    - Adjust coordinates if UI elements have moved
    - _Requirements: 2.2_

- [x] 3. Create Database Migration Script
  - [x] 3.1 Create migration script file
    - Create backend/scripts/remove-pin-field.js
    - Import mongoose and User model
    - Implement removePinField function using updateMany with $unset
    - Add error handling and logging
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 3.2 Write unit tests for migration script
    - Test migration removes 'pin' field from user documents
    - Test migration preserves loginPin and securityPin fields
    - Test migration logs correct count of updated records
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Fix Security PIN Warning Logic
  - [x] 4.1 Update admin scanner Security PIN check
    - Modify useEffect in app/admin/scan.tsx
    - Check auth_user_role from AsyncStorage before showing warning
    - Only show warning for staff users when Security PIN is not set
    - Skip warning for authenticated admin users
    - _Requirements: 4.4, 4.5, 7.1, 7.3, 7.4, 7.7_
  
  - [x] 4.2 Update add-products Security PIN check
    - Modify useEffect in app/admin/add-products.tsx
    - Check auth_user_role from AsyncStorage before showing warning
    - Only show warning for staff users when Security PIN is not set
    - Skip warning for authenticated admin users
    - _Requirements: 4.4, 4.5, 7.2, 7.5, 7.6, 7.8_
  
  - [ ]* 4.3 Write property test for Security PIN warning accuracy
    - **Property 4: Security PIN Warning Accuracy**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 5. Fix Logout Flow
  - [x] 5.1 Update logout function in AuthContext
    - Modify logout function in context/AuthContext.tsx
    - Add all auth-related keys to multiRemove array
    - Include: auth_user_role, auth_user_id, auth_user_name, auth_store_id, auth_store_name
    - Verify state is fully reset (user, role, isAuthenticated)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ]* 5.2 Write property test for logout completeness
    - **Property 5: Logout Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

- [x] 6. Fix Staff Admin Access Handling
  - [x] 6.1 Update admin layout authentication check
    - Modify checkAuth function in app/admin/_layout.tsx
    - Check user role when no PIN exists
    - For staff users: show warning that admin must set Security PIN first
    - For admin users: show normal setup modal
    - Update modal text to be role-appropriate
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 6.2 Write property test for staff access messaging
    - **Property 6: Staff Access Messaging**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 7. Checkpoint - Verify all fixes work together
  - Test complete authentication flow for admin users
  - Test complete authentication flow for staff users
  - Test logout and re-login scenarios
  - Test Security PIN warnings appear only when appropriate
  - Test audio feedback in admin scanner
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Integration Testing
  - [ ]* 8.1 Write integration tests for admin authentication flow
    - Test admin login, access protected pages, logout
    - Verify no redundant PIN prompts for admin
    - Verify audio plays in admin scanner
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [ ]* 8.2 Write integration tests for staff authentication flow
    - Test staff login, access protected pages
    - Verify Security PIN prompts appear for staff
    - Verify appropriate messaging when Security PIN not set
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 7.7, 7.8_
  
  - [ ]* 8.3 Write integration tests for logout flow
    - Test logout from various authenticated states
    - Verify no auto re-login occurs
    - Verify all AsyncStorage keys are cleared
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 9. Final Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Run all integration tests and verify they pass
  - Perform manual testing checklist from design document
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
