# Multi-Tenancy Data Fetch Fixes

## Overview
Fix data fetching issues in Recently Sold tab and Alerts page where tenant filtering is not working correctly, preventing users from seeing their store-specific data.

## Problem Statement
After implementing multi-tenancy with `storeId` filtering:
1. Recently Sold tab in staff dashboard shows no data
2. Alerts page shows no data
3. Migration script confirmed all records already have `storeId`
4. Debug logging added but needs verification

## User Stories

### 1. Recently Sold Data Display
**As a** staff member  
**I want to** see recently sold products from my store  
**So that** I can track sales performance

**Acceptance Criteria:**
- 1.1 Recently sold tab displays products sold from the user's store only
- 1.2 Both "by product" and "by batch" views work correctly
- 1.3 Empty state shows when no sales exist (not an error)
- 1.4 Data refreshes when tab is focused

### 2. Alerts Data Display
**As an** admin  
**I want to** see expiry alerts for products in my store  
**So that** I can take action on expiring inventory

**Acceptance Criteria:**
- 2.1 Alerts page displays products from the user's store only
- 2.2 All alert levels (critical, high, early, slow-moving) are shown
- 2.3 Empty state shows when no alerts exist (not an error)
- 2.4 Custom category alert thresholds are respected

### 3. AI Predictions Multi-Tenancy
**As a** user  
**I want** AI predictions to be store-specific  
**So that** predictions are accurate for my inventory

**Acceptance Criteria:**
- 3.1 Predictions are created with `storeId` from the product
- 3.2 Predictions are filtered by `storeId` when fetched
- 3.3 Quick insights show only urgent items from user's store
- 3.4 Category insights are store-specific

### 4. Notifications Multi-Tenancy
**As a** user  
**I want** notifications to be store-specific  
**So that** I only see alerts relevant to my store

**Acceptance Criteria:**
- 4.1 Notifications are created with `storeId`
- 4.2 Notifications are filtered by `storeId` when fetched
- 4.3 Notification counts are store-specific

## Technical Requirements

### Backend Changes
1. **Analytics Controller**
   - Verify `getRecentlySold` applies tenant filter correctly in aggregation pipeline
   - Verify `getRecentlySoldBatches` applies tenant filter correctly
   - Ensure ObjectId conversion happens before aggregation stages

2. **Alerts Controller**
   - Verify `getAlerts` applies tenant filter to Product queries
   - Verify slow-moving product detection uses tenant filter
   - Ensure AlertSettings lookup uses `storeId` correctly

3. **Predictive Analytics Service**
   - Verify `savePredictionToDatabase` includes `storeId` from product
   - Verify `getQuickInsights` filters by `storeId`
   - Verify `getCategoryInsights` filters by `storeId`

4. **Notification Model**
   - Add `storeId` field to schema
   - Update `getUnread` and `getUnreadCount` to filter by `storeId`
   - Update notification creation to include `storeId`

### Frontend Changes
1. **Error Handling**
   - Distinguish between "no data" and "network error"
   - Show appropriate empty states vs error messages
   - Add retry mechanisms for network errors

2. **Debug Logging**
   - Add console logs to track API calls
   - Log response data structure
   - Log tenant filter application

## Out of Scope
- Changing the multi-tenancy architecture
- Adding new features beyond fixing existing functionality
- Performance optimization (unless blocking functionality)

## Success Metrics
- Recently Sold tab shows data for stores with sales
- Alerts page shows data for stores with expiring products
- No false "network error" messages when data is simply empty
- Debug logs confirm tenant filter is applied correctly

## Dependencies
- Existing multi-tenancy implementation
- Tenant filter middleware
- Authentication system providing `storeId`

## Risks
- Aggregation pipelines may need ObjectId conversion at multiple stages
- Empty data vs error states may be confused in frontend
- Debug logging may reveal additional issues
