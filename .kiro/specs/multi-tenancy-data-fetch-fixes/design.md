# Multi-Tenancy Data Fetch Fixes - Design Document

## Overview

This design addresses critical data fetching issues in the multi-tenant inventory management system where tenant filtering is not properly applied in aggregation pipelines and notification queries. The root cause is that MongoDB aggregation pipelines require ObjectId conversion at the match stage, and the Notification model lacks storeId field for proper tenant isolation.

## Architecture

### Current State Analysis

The system has three main areas with tenant filtering issues:

1. **Analytics Controller** - Recently Sold aggregation pipelines
   - `getRecentlySold`: Groups sales by product, needs storeId filter at match stage
   - `getRecentlySoldBatches`: Returns individual sale records, needs storeId filter

2. **Alerts Controller** - Product and sales queries
   - `getAlerts`: Queries products and sales, needs consistent storeId filtering
   - Slow-moving detection: Queries sales without proper tenant filter

3. **Predictive Analytics Service** - AI predictions and notifications
   - `savePredictionToDatabase`: Creates predictions with storeId from product
   - `getQuickInsights`: Needs storeId filter for predictions
   - `getCategoryInsights`: Needs storeId filter for category-level data

4. **Notification Model** - Missing storeId field
   - Schema lacks storeId field
   - Static methods don't filter by storeId
   - Notification creation doesn't include storeId

### Key Technical Challenges

1. **Aggregation Pipeline Filtering**: MongoDB aggregation requires ObjectId conversion before the $match stage
2. **Tenant Filter Timing**: The `req.tenantFilter` must be applied at the earliest stage of aggregation
3. **Notification Isolation**: Notifications must be scoped to stores to prevent cross-tenant data leakage
4. **Frontend Error Handling**: Empty data states are confused with network errors

## Components and Interfaces

### Backend Components

#### 1. Analytics Controller (`analyticsController.js`)

**Modified Functions:**

```javascript
// getRecentlySold - Fix aggregation pipeline
exports.getRecentlySold = async (req, res) => {
  // Convert storeId to ObjectId BEFORE aggregation
  const storeIdFilter = mongoose.Types.ObjectId.isValid(req.tenantFilter.storeId)
    ? new mongoose.Types.ObjectId(req.tenantFilter.storeId)
    : req.tenantFilter.storeId;
  
  // Apply filter at FIRST stage of pipeline
  const pipeline = [
    { $match: { storeId: storeIdFilter } },  // CRITICAL: First stage
    { $sort: { saleDate: -1 } },
    { $group: { ... } },
    // ... rest of pipeline
  ];
}

// getRecentlySoldBatches - Fix aggregation pipeline
exports.getRecentlySoldBatches = async (req, res) => {
  const storeIdFilter = mongoose.Types.ObjectId.isValid(req.tenantFilter.storeId)
    ? new mongoose.Types.ObjectId(req.tenantFilter.storeId)
    : req.tenantFilter.storeId;
  
  const pipeline = [
    { $match: { storeId: storeIdFilter } },  // CRITICAL: First stage
    { $sort: { saleDate: -1 } },
    { $limit: parseInt(limit) },
    // ... rest of pipeline
  ];
}
```

**Interface:**
- Input: `req.tenantFilter.storeId` from authentication middleware
- Output: JSON response with `{ success: boolean, data: Array }`
- Error handling: Returns empty array on no data, error message on failure

#### 2. Alerts Controller (`alertsController.js`)

**Modified Functions:**

```javascript
// getAlerts - Fix product and sales queries
exports.getAlerts = async (req, res) => {
  const storeId = req.user.storeId;
  
  // Product query with tenant filter
  const query = {
    isPerishable: true,
    'batches.0': { $exists: true },
    ...req.tenantFilter  // Applies storeId filter
  };
  
  // Sales query for slow-moving detection
  const salesQuery = {
    productId: product._id,
    saleDate: { $gte: thirtyDaysAgo },
    ...req.tenantFilter  // CRITICAL: Add tenant filter
  };
}
```

**Interface:**
- Input: `req.user.storeId` and `req.tenantFilter`
- Output: JSON response with `{ success: boolean, data: { alerts: Array, summary: Object } }`
- Error handling: Returns empty alerts array on no data

#### 3. Predictive Analytics Service (`predicitveAnalytics.js`)

**Modified Functions:**

```javascript
// getQuickInsights - Add storeId filter
const getQuickInsights = async (storeId) => {
  const urgentPredictions = await Prediction.find({
    storeId: storeId,  // CRITICAL: Add storeId filter
    $or: [
      { 'metrics.riskScore': { $gte: 70 } },
      { 'metrics.daysUntilStockout': { $lte: 7 } }
    ]
  });
}

// getCategoryInsights - Add storeId filter
const getCategoryInsights = async (category, storeId) => {
  const products = await Product.find({ 
    category,
    storeId: storeId  // CRITICAL: Add storeId filter
  });
  
  const predictions = await Prediction.find({
    productId: { $in: productIds },
    storeId: storeId  // CRITICAL: Add storeId filter
  });
}

// checkAndSendNotification - Add storeId to notification
const checkAndSendNotification = async (product, prediction) => {
  await Notification.create({
    storeId: product.storeId,  // CRITICAL: Add storeId
    type: 'critical_risk',
    productId: product._id,
    // ... rest of fields
  });
}
```

**Interface:**
- Input: `storeId` parameter passed from controller
- Output: Prediction objects with store-specific data
- Error handling: Returns null or empty arrays on failure

#### 4. Notification Model (`Notification.js`)

**Schema Changes:**

```javascript
const NotificationSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true  // CRITICAL: Index for query performance
  },
  // ... existing fields
});

// Update compound indexes
NotificationSchema.index({ storeId: 1, userId: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ storeId: 1, productId: 1, type: 1 });

// Update static methods
NotificationSchema.statics.getUnread = async function(userId, storeId) {
  const query = {
    userId,
    storeId: storeId,  // CRITICAL: Add storeId filter
    read: false,
    dismissed: false
  };
  return this.find(query).populate('productId').sort({ priority: 1, createdAt: -1 });
};

NotificationSchema.statics.getUnreadCount = async function(userId, storeId) {
  return this.countDocuments({
    userId,
    storeId: storeId,  // CRITICAL: Add storeId filter
    read: false,
    dismissed: false
  });
};

NotificationSchema.statics.existsSimilar = async function(productId, type, storeId, hoursAgo = 24) {
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return this.findOne({
    productId,
    type,
    storeId: storeId,  // CRITICAL: Add storeId filter
    createdAt: { $gte: cutoff }
  });
};
```

**Migration Required:**
- Add storeId to existing notifications (backfill from product.storeId)
- Update all notification creation calls to include storeId

### Frontend Components

#### 1. useProducts Hook (`hooks/useProducts.ts`)

**Error Handling Improvements:**

```typescript
const fetchRecentlySold = useCallback(async () => {
  try {
    const response = await axios.get(`${ANALYTICS_URL}/recently-sold?limit=10`, { 
      timeout: 5000 
    });
    
    if (response.data.success) {
      const data = response.data.data || [];
      setRecentlySold(data);
      
      // Log for debugging
      console.log('[useProducts] Recently sold fetched:', data.length, 'items');
      
      // Distinguish between empty data and error
      if (data.length === 0) {
        console.log('[useProducts] No recently sold items (empty data, not an error)');
      }
    }
  } catch (err: any) {
    console.error('[useProducts] Recently sold fetch error:', err.message);
    
    // Distinguish between network error and empty data
    if (err.response?.status === 200 && err.response?.data?.success) {
      // Success with empty data
      setRecentlySold([]);
    } else {
      // Actual error - set empty array but log error
      setRecentlySold([]);
      // Don't show error toast for recently sold - it's not critical
    }
  }
}, [ANALYTICS_URL]);
```

**Interface:**
- Returns: `{ recentlySold: Product[], loading: boolean, error: string | null }`
- Error states: Distinguishes between empty data and network errors

#### 2. useAlerts Hook (`hooks/useAlerts.ts`)

**Error Handling Improvements:**

```typescript
const fetchAlerts = useCallback(async () => {
  try {
    setLoading(true);
    const response = await axios.get(API_URL, { timeout: 8000 });

    const backendData = response.data.data;
    const rawAlerts = backendData.alerts || [];

    // Log for debugging
    console.log('[useAlerts] Alerts fetched:', rawAlerts.length, 'items');
    
    if (rawAlerts.length === 0) {
      console.log('[useAlerts] No alerts (empty data, not an error)');
    }

    setAlerts(processed);
    setSummary(backendData.summary);
    setError(null);  // Clear error on success
  } catch (err: any) {
    console.error('[useAlerts] Fetch error:', err.message);
    
    // Distinguish between network error and empty data
    if (err.response?.status === 200) {
      // Success with empty data
      setAlerts([]);
      setSummary(null);
      setError(null);
    } else {
      // Actual error
      setError("Failed to fetch alerts");
      setAlerts([]);
    }
  } finally {
    setLoading(false);
  }
}, [API_URL]);
```

**Interface:**
- Returns: `{ alerts: Alert[], summary: AlertSummary | null, loading: boolean, error: string | null }`
- Error states: Distinguishes between empty data and network errors

## Data Models

### Notification Model Updates

**Before:**
```javascript
{
  type: String,
  productId: ObjectId,
  title: String,
  message: String,
  priority: String,
  userId: String,
  read: Boolean,
  createdAt: Date
}
```

**After:**
```javascript
{
  storeId: ObjectId,  // NEW: Required field for tenant isolation
  type: String,
  productId: ObjectId,
  title: String,
  message: String,
  priority: String,
  userId: String,
  read: Boolean,
  createdAt: Date
}
```

**Indexes:**
- `{ storeId: 1, userId: 1, read: 1, createdAt: -1 }` - For getUnread queries
- `{ storeId: 1, productId: 1, type: 1 }` - For existsSimilar queries

### Prediction Model (No Changes)

Already has storeId field - no changes needed.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Tenant Isolation in Data Queries

*For any* store and any data query (recently sold, alerts, predictions), all returned results should only include data where the storeId matches the querying user's storeId.

**Validates: Requirements 1.1, 1.2, 2.1**

### Property 2: Alert Level Categorization

*For any* product with batches and sales history, the calculated alert level (critical, high, early, slow-moving, normal) should correctly reflect the product's expiry status and sales velocity according to the configured thresholds.

**Validates: Requirements 2.2**

### Property 3: Custom Threshold Application

*For any* product in a category with custom alert thresholds, the alert level calculation should use the category's custom thresholds instead of global thresholds.

**Validates: Requirements 2.4**

### Property 4: Prediction Store Inheritance

*For any* product with a storeId, when a prediction is created for that product, the prediction's storeId should match the product's storeId.

**Validates: Requirements 3.1**

### Property 5: Prediction Query Filtering

*For any* store, when querying predictions (quick insights, category insights, or direct queries), all returned predictions should have a storeId matching the specified store.

**Validates: Requirements 3.2, 3.3, 3.4**

### Property 6: Notification Store Association

*For any* notification created from a product event, the notification's storeId should match the product's storeId.

**Validates: Requirements 4.1**

### Property 7: Notification Query Filtering

*For any* store, when querying notifications (getUnread, getUnreadCount), all returned notifications should have a storeId matching the specified store.

**Validates: Requirements 4.2, 4.3**

## Error Handling

### Backend Error Handling

**Aggregation Pipeline Errors:**
- Validate storeId exists before creating ObjectId
- Log aggregation pipeline stages for debugging
- Return empty array with success=true when no data exists
- Return error response only on actual database errors

**Query Errors:**
- Validate storeId exists in req.user before queries
- Return 400 error if storeId is missing
- Log query parameters for debugging
- Distinguish between "no results" and "query failed"

**Notification Errors:**
- Validate storeId exists before creating notification
- Log notification creation failures
- Don't fail parent operation if notification creation fails
- Retry notification creation on transient errors

### Frontend Error Handling

**Empty Data vs Errors:**
```typescript
// Good: Distinguish between empty data and errors
if (response.data.success && response.data.data.length === 0) {
  // Empty data - show empty state UI
  setData([]);
  setError(null);
} else if (!response.data.success) {
  // Error - show error message
  setError(response.data.error);
  setData([]);
}

// Bad: Treat empty data as error
if (response.data.data.length === 0) {
  setError("No data found");  // Wrong!
}
```

**Loading States:**
- Show loading spinner during initial fetch
- Show skeleton screens during refresh
- Don't show loading for background refreshes
- Timeout after 10 seconds with error message

**Error Messages:**
- Network errors: "Unable to connect. Check your internet connection."
- Server errors: "Server error. Please try again later."
- Empty data: Show empty state UI, not error message
- Timeout errors: "Request timed out. Please try again."

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

**Unit Tests** - Verify specific scenarios:
- Empty data returns success with empty array
- Invalid storeId returns 400 error
- Missing storeId in req.user returns 400 error
- Aggregation pipeline with valid storeId returns filtered data
- Notification creation includes storeId from product

**Property-Based Tests** - Verify universal properties:
- All data queries respect tenant isolation (Property 1)
- Alert levels are correctly calculated (Property 2)
- Custom thresholds are applied correctly (Property 3)
- Predictions inherit storeId from products (Property 4)
- Prediction queries filter by storeId (Property 5)
- Notifications inherit storeId from products (Property 6)
- Notification queries filter by storeId (Property 7)

### Property-Based Testing Configuration

**Testing Library:** Use `fast-check` for JavaScript/TypeScript property-based testing

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: multi-tenancy-data-fetch-fixes, Property N: [property text]`
- Generate random storeIds, products, sales, and predictions
- Verify properties hold across all generated inputs

**Example Property Test Structure:**
```javascript
const fc = require('fast-check');

// Feature: multi-tenancy-data-fetch-fixes, Property 1: Tenant Isolation in Data Queries
test('all data queries respect tenant isolation', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(storeArbitrary),
      fc.array(productArbitrary),
      fc.array(saleArbitrary),
      async (stores, products, sales) => {
        // Setup: Create test data
        await setupTestData(stores, products, sales);
        
        // Test: Query for each store
        for (const store of stores) {
          const recentlySold = await getRecentlySold(store._id);
          const alerts = await getAlerts(store._id);
          
          // Verify: All results match the queried storeId
          expect(recentlySold.every(item => item.storeId.equals(store._id))).toBe(true);
          expect(alerts.every(alert => alert.storeId.equals(store._id))).toBe(true);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Test Scenarios:**
1. Create multiple stores with products and sales
2. Query recently sold for each store
3. Verify each store only sees its own data
4. Query alerts for each store
5. Verify each store only sees its own alerts
6. Create predictions for products
7. Verify predictions have correct storeId
8. Query predictions for each store
9. Verify each store only sees its own predictions
10. Create notifications from product events
11. Verify notifications have correct storeId
12. Query notifications for each store
13. Verify each store only sees its own notifications

### Debug Logging

**Backend Logging:**
```javascript
console.log('getRecentlySold - tenantFilter:', req.tenantFilter);
console.log('getRecentlySold - user:', { storeId: req.user?.storeId, role: req.user?.role });
console.log('getRecentlySold - Applying storeId filter:', storeIdFilter);
console.log('getRecentlySold - Found', recentSales.length, 'sales');
```

**Frontend Logging:**
```typescript
console.log('[useProducts] Recently sold fetched:', data.length, 'items');
console.log('[useProducts] No recently sold items (empty data, not an error)');
console.log('[useAlerts] Alerts fetched:', rawAlerts.length, 'items');
console.log('[useAlerts] No alerts (empty data, not an error)');
```

**Log Levels:**
- INFO: Successful operations with data counts
- WARN: Empty data (not an error, but worth noting)
- ERROR: Actual errors with stack traces

## Implementation Notes

### Migration Strategy

**Phase 1: Add storeId to Notifications**
1. Add storeId field to Notification schema
2. Create migration script to backfill storeId from products
3. Update all notification creation calls to include storeId
4. Deploy schema changes

**Phase 2: Fix Aggregation Pipelines**
1. Update getRecentlySold to convert storeId to ObjectId
2. Update getRecentlySoldBatches to convert storeId to ObjectId
3. Add debug logging to track filter application
4. Deploy controller changes

**Phase 3: Fix Alerts and Predictions**
1. Update getAlerts to apply tenant filter to sales queries
2. Update predictive analytics service to accept storeId parameter
3. Update all prediction queries to filter by storeId
4. Deploy service changes

**Phase 4: Frontend Error Handling**
1. Update useProducts hook to distinguish empty data from errors
2. Update useAlerts hook to distinguish empty data from errors
3. Add debug logging to track API responses
4. Deploy frontend changes

### Rollback Plan

If issues occur:
1. Revert frontend changes (safe - only affects error messages)
2. Revert controller changes (requires testing - affects data filtering)
3. Revert notification schema changes (requires migration rollback)

### Performance Considerations

**Aggregation Pipeline Performance:**
- ObjectId conversion is fast (microseconds)
- Index on storeId ensures fast filtering
- Pipeline stages are optimized (match first, then group)

**Query Performance:**
- Compound indexes on (storeId, userId, read, createdAt) for notifications
- Index on storeId for predictions
- Existing indexes on storeId for products and sales

**Expected Impact:**
- No performance degradation
- Queries may be slightly faster due to better index usage
- Reduced data transfer (only relevant data returned)

## Security Considerations

**Tenant Isolation:**
- All queries MUST filter by storeId
- No query should return data from other stores
- Aggregation pipelines MUST apply storeId filter at first stage

**Data Leakage Prevention:**
- Validate storeId exists before queries
- Log all tenant filter applications
- Monitor for cross-tenant data access
- Audit logs for security review

**Authentication:**
- Rely on existing authentication middleware
- Validate req.user.storeId exists
- Return 400 error if storeId is missing
- Don't expose storeId in error messages

## Deployment Checklist

- [ ] Run notification migration script
- [ ] Verify all notifications have storeId
- [ ] Deploy backend changes
- [ ] Verify debug logs show correct filtering
- [ ] Test recently sold tab with multiple stores
- [ ] Test alerts page with multiple stores
- [ ] Deploy frontend changes
- [ ] Verify empty states show correctly
- [ ] Verify error messages are appropriate
- [ ] Monitor logs for errors
- [ ] Run property-based tests
- [ ] Verify all properties pass

