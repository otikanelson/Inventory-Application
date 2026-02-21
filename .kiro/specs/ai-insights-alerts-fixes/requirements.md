# AI Insights and Alerts Fixes - Requirements

## Overview
Fix AI Insights badge and Alerts page which are currently showing empty/no data despite the Recently Sold tab working correctly. The backend endpoints are properly filtering by storeId, but may not have data that meets the display criteria.

## Background
- **Working**: Recently Sold tab shows data correctly after multi-tenancy fixes
- **Not Working**: AI Insights badge shows "All Clear" (should show urgent items)
- **Not Working**: Alerts page shows 0 alerts (should show expiring products)
- **Database**: Temple Hill store has 2 products, 5 sales, 3 predictions
- **Backend**: Production backend on Vercel, local backend for testing

## User Stories

### 1. AI Insights Badge
**As a** store admin  
**I want to** see urgent AI predictions in the dashboard badge  
**So that** I can quickly identify products that need immediate attention

**Acceptance Criteria:**
- 1.1 Badge shows count of urgent items (risk > 70 or stockout < 7 days)
- 1.2 Badge displays "All Clear" only when there are truly no urgent items
- 1.3 Badge data is filtered by authenticated user's storeId
- 1.4 Badge updates when new predictions are created or updated
- 1.5 If no predictions exist, system creates them automatically

### 2. Alerts Page
**As a** store admin  
**I want to** see alerts for expiring products and slow-moving items  
**So that** I can take action before products expire or become dead stock

**Acceptance Criteria:**
- 2.1 Alerts page shows expiring products within threshold (7/14/30 days)
- 2.2 Alerts page shows slow-moving non-perishable products
- 2.3 Alerts are filtered by authenticated user's storeId
- 2.4 Alerts display correct urgency levels (expired, critical, high, early)
- 2.5 Alerts show recommended actions for each item
- 2.6 If no products have expiry dates, appropriate message is shown

### 3. Prediction Generation
**As a** system  
**I want to** automatically generate predictions for products with sales data  
**So that** AI insights are available without manual intervention

**Acceptance Criteria:**
- 3.1 Predictions are created automatically when products have sales data
- 3.2 Predictions include storeId for multi-tenancy
- 3.3 Predictions handle low-confidence scenarios (< 7 data points)
- 3.4 Predictions use category averages as fallback when data is insufficient
- 3.5 NaN values are sanitized before saving to database

### 4. Data Verification
**As a** developer  
**I want to** verify that data exists and meets display criteria  
**So that** I can diagnose why UI shows empty states

**Acceptance Criteria:**
- 4.1 Test script verifies predictions exist for Temple Hill store
- 4.2 Test script checks if predictions meet urgency criteria (risk > 70)
- 4.3 Test script verifies products have expiry dates in batches
- 4.4 Test script simulates authenticated API calls
- 4.5 Test script reports data gaps and recommendations

## Technical Requirements

### Backend Endpoints
- `/api/analytics/quick-insights` - Returns urgent predictions
- `/api/alerts` - Returns expiring products and slow-moving items

### Data Models
- `Prediction` - AI predictions with risk scores and forecasts
- `Product` - Products with batches and expiry dates
- `Sale` - Sales history for velocity calculations
- `AlertSettings` - Configurable alert thresholds

### Multi-Tenancy
- All queries must filter by `storeId`
- StoreId must be ObjectId in aggregation pipelines
- Tenant filter applied at first stage of aggregations

## Out of Scope
- Frontend UI changes (will be addressed after backend fixes confirmed)
- New alert types beyond expiry and slow-moving
- Email/push notifications for alerts
- Historical alert tracking

## Success Metrics
- AI Insights badge shows correct count of urgent items
- Alerts page displays all expiring products within thresholds
- Test scripts pass with 100% success rate
- User confirms fixes work in production app

## Dependencies
- MongoDB database with Temple Hill store data
- Authenticated user session with valid storeId
- Products with sales history and expiry dates

## Assumptions
- Temple Hill store has at least some products with expiry dates
- Sales data exists for velocity calculations
- Backend authentication middleware is working correctly
- Multi-tenancy tenant filter is applied to all requests
