# Implementation Plan: Multi-Tenancy Data Fetch Fixes

## Overview

This implementation plan addresses critical tenant filtering issues in aggregation pipelines, notification queries, and frontend error handling. The work is organized into discrete tasks that build incrementally, with testing integrated throughout.

## Tasks

- [x] 1. Update Notification Model Schema
  - Add storeId field to Notification schema with required validation and indexes
  - Update compound indexes to include storeId for query performance
  - Update static methods (getUnread, getUnreadCount, existsSimilar, markAllAsRead) to accept and filter by storeId parameter
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]* 1.1 Write property test for Notification model
  - **Property 6: Notification Store Association**
  - **Validates: Requirements 4.1**

- [ ]* 1.2 Write property test for Notification queries
  - **Property 7: Notification Query Filtering**
  - **Validates: Requirements 4.2, 4.3**

- [x] 2. Create Notification Migration Script
  - Create migration script to backfill storeId for existing notifications
  - Query each notification's product to get storeId
  - Update notification with product's storeId
  - Log migration progress and any errors
  - _Requirements: 4.1_

- [ ]* 2.1 Write unit tests for migration script
  - Test migration with notifications missing storeId
  - Test migration with notifications already having storeId
  - Test migration with deleted products (orphaned notifications)
  - _Requirements: 4.1_

- [x] 3. Checkpoint - Verify notification schema and migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Fix Analytics Controller - Recently Sold Aggregation
  - [x] 4.1 Update getRecentlySold function
    - Convert req.tenantFilter.storeId to ObjectId before aggregation
    - Apply storeId filter at first stage of aggregation pipeline
    - Add debug logging to track tenant filter application
    - Add debug logging to show result count
    - _Requirements: 1.1, 1.2_
  
  - [x] 4.2 Update getRecentlySoldBatches function
    - Convert req.tenantFilter.storeId to ObjectId before aggregation
    - Apply storeId filter at first stage of aggregation pipeline
    - Add debug logging to track tenant filter application
    - _Requirements: 1.1, 1.2_

- [ ]* 4.3 Write property test for recently sold aggregation
  - **Property 1: Tenant Isolation in Data Queries (Recently Sold)**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 4.4 Write unit tests for recently sold endpoints
  - Test with valid storeId returns filtered data
  - Test with missing storeId returns 400 error
  - Test with no sales returns empty array (not error)
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 5. Fix Alerts Controller - Product and Sales Queries
  - [x] 5.1 Update getAlerts function
    - Validate storeId exists in req.user before queries
    - Apply req.tenantFilter to product queries (already done, verify)
    - Apply req.tenantFilter to sales queries in slow-moving detection
    - Add debug logging to track tenant filter application
    - Add debug logging to show alert counts by level
    - _Requirements: 2.1, 2.2_

- [ ]* 5.2 Write property test for alerts tenant filtering
  - **Property 1: Tenant Isolation in Data Queries (Alerts)**
  - **Validates: Requirements 2.1**

- [ ]* 5.3 Write property test for alert level categorization
  - **Property 2: Alert Level Categorization**
  - **Validates: Requirements 2.2**

- [ ]* 5.4 Write property test for custom threshold application
  - **Property 3: Custom Threshold Application**
  - **Validates: Requirements 2.4**

- [ ]* 5.5 Write unit tests for alerts endpoint
  - Test with valid storeId returns filtered alerts
  - Test with missing storeId returns 400 error
  - Test with no alerts returns empty array (not error)
  - Test custom category thresholds are applied
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Checkpoint - Verify analytics and alerts controllers
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Fix Predictive Analytics Service - Tenant Filtering
  - [x] 7.1 Update getQuickInsights function
    - Add storeId parameter to function signature
    - Add storeId filter to Prediction.find query
    - Update controller to pass req.user.storeId to function
    - Add debug logging to track storeId filter
    - _Requirements: 3.2, 3.3_
  
  - [x] 7.2 Update getCategoryInsights function
    - Add storeId parameter to function signature
    - Add storeId filter to Product.find query
    - Add storeId filter to Prediction.find query
    - Update controller to pass req.user.storeId to function
    - Add debug logging to track storeId filter
    - _Requirements: 3.2, 3.4_
  
  - [x] 7.3 Update checkAndSendNotification function
    - Add storeId field when creating notifications
    - Get storeId from product.storeId
    - Verify storeId exists before creating notification
    - _Requirements: 4.1_
  
  - [x] 7.4 Verify savePredictionToDatabase includes storeId
    - Confirm storeId is already included from product (no changes needed)
    - Add debug logging to confirm storeId is set
    - _Requirements: 3.1_

- [ ]* 7.5 Write property test for prediction store inheritance
  - **Property 4: Prediction Store Inheritance**
  - **Validates: Requirements 3.1**

- [ ]* 7.6 Write property test for prediction query filtering
  - **Property 5: Prediction Query Filtering**
  - **Validates: Requirements 3.2, 3.3, 3.4**

- [ ]* 7.7 Write unit tests for predictive analytics service
  - Test getQuickInsights filters by storeId
  - Test getCategoryInsights filters by storeId
  - Test savePredictionToDatabase includes storeId
  - Test checkAndSendNotification includes storeId
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 8. Update Analytics Controller - AI Endpoints
  - [x] 8.1 Update getQuickInsightsEndpoint
    - Pass req.user.storeId to getQuickInsights function
    - Add error handling for missing storeId
    - _Requirements: 3.3_
  
  - [x] 8.2 Update getCategoryInsightsEndpoint
    - Pass req.user.storeId to getCategoryInsights function
    - Add error handling for missing storeId
    - _Requirements: 3.4_
  
  - [x] 8.3 Update getNotifications endpoint
    - Pass req.user.storeId to Notification.getUnread
    - Pass req.user.storeId to Notification.getUnreadCount
    - Add error handling for missing storeId
    - _Requirements: 4.2, 4.3_

- [ ]* 8.4 Write unit tests for AI endpoints
  - Test endpoints pass storeId correctly
  - Test endpoints return 400 when storeId is missing
  - _Requirements: 3.3, 3.4, 4.2, 4.3_

- [x] 9. Checkpoint - Verify predictive analytics and AI endpoints
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Update Frontend - useProducts Hook Error Handling
  - [x] 10.1 Improve fetchRecentlySold error handling
    - Distinguish between empty data (success with empty array) and network errors
    - Add debug logging to track API responses
    - Log when empty data is received (not an error)
    - Don't show error toast for empty data
    - _Requirements: 1.3_

- [ ]* 10.2 Write unit tests for useProducts hook
  - Test empty data doesn't trigger error state
  - Test network error triggers error state
  - Test loading states are correct
  - _Requirements: 1.3_

- [x] 11. Update Frontend - useAlerts Hook Error Handling
  - [x] 11.1 Improve fetchAlerts error handling
    - Distinguish between empty data (success with empty array) and network errors
    - Add debug logging to track API responses
    - Log when empty data is received (not an error)
    - Clear error state on successful empty response
    - _Requirements: 2.3_

- [ ]* 11.2 Write unit tests for useAlerts hook
  - Test empty data doesn't trigger error state
  - Test network error triggers error state
  - Test loading states are correct
  - _Requirements: 2.3_

- [-] 12. Final Integration Testing
  - [x] 12.1 Test Recently Sold tab with multiple stores
    - Create test data for multiple stores
    - Verify each store only sees its own sales
    - Verify empty state shows correctly when no sales
    - Verify error state shows correctly on network error
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ] 12.2 Test Alerts page with multiple stores
    - Create test data for multiple stores
    - Verify each store only sees its own alerts
    - Verify empty state shows correctly when no alerts
    - Verify error state shows correctly on network error
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ] 12.3 Test AI predictions with multiple stores
    - Create test data for multiple stores
    - Verify predictions are created with correct storeId
    - Verify quick insights only show store-specific data
    - Verify category insights only show store-specific data
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ] 12.4 Test notifications with multiple stores
    - Create test data for multiple stores
    - Verify notifications are created with correct storeId
    - Verify notification queries only return store-specific data
    - Verify notification counts are store-specific
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Debug logging is added throughout to track tenant filter application
- Frontend changes are isolated and can be deployed independently
- Backend changes require careful testing to ensure tenant isolation

