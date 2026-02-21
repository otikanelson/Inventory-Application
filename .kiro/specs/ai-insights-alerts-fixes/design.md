# AI Insights and Alerts Fixes - Design Document

## Architecture Overview

This fix addresses empty states in AI Insights badge and Alerts page by:
1. Verifying data exists and meets display criteria
2. Ensuring predictions are generated for all products with sales
3. Fixing any data gaps or calculation issues
4. Creating comprehensive test scripts for validation

## Component Design

### 1. Data Verification Script
**File**: `backend/scripts/test-ai-insights-alerts.js`

**Purpose**: Diagnose why AI Insights and Alerts show empty states

**Functionality**:
- Check if predictions exist for Temple Hill store products
- Verify predictions meet urgency criteria (risk > 70, stockout < 7)
- Check if products have expiry dates in batches
- Simulate authenticated API calls to both endpoints
- Report data gaps and provide recommendations

**Output**:
```
✅ Found X predictions for Temple Hill store
✅ Found Y urgent predictions (risk > 70)
✅ Found Z products with expiry dates
⚠️  No products meet urgency criteria
💡 Recommendation: Add products with shorter expiry dates
```

### 2. Prediction Generation Fix
**Files**: 
- `backend/src/services/predicitveAnalytics.js` (existing)
- `backend/scripts/generate-predictions.js` (new)

**Issue**: Predictions may not exist for all products, or may not meet urgency criteria

**Solution**:
- Create script to generate predictions for all products in Temple Hill store
- Ensure predictions include storeId for multi-tenancy
- Handle low-confidence scenarios with category fallbacks
- Sanitize NaN values before saving

**Algorithm**:
```javascript
for each product in Temple Hill store:
  if product has sales data:
    calculate prediction using getPredictiveAnalytics()
    save to database with storeId
    log success/failure
  else:
    log "no sales data" warning
```

### 3. Quick Insights Endpoint Analysis
**File**: `backend/src/controllers/analyticsController.js`

**Current Implementation**:
```javascript
exports.getQuickInsightsEndpoint = async (req, res) => {
  const storeId = req.user?.storeId;
  const query = {
    $or: [
      { 'metrics.riskScore': { $gte: 70 } },
      { 'metrics.daysUntilStockout': { $lte: 7 } }
    ]
  };
  if (storeId) {
    query.storeId = storeId;
  }
  const urgentPredictions = await Prediction.find(query)
    .populate('productId', 'name category imageUrl')
    .sort({ 'metrics.riskScore': -1 })
    .limit(10);
  // ...
}
```

**Potential Issues**:
1. No predictions exist in database
2. Predictions exist but risk scores are all < 70
3. Predictions exist but daysUntilStockout are all > 7
4. StoreId filter excludes all predictions

**Verification Steps**:
1. Check if predictions exist: `Prediction.countDocuments({ storeId })`
2. Check risk score distribution: `Prediction.find({ storeId }).select('metrics.riskScore')`
3. Check stockout days: `Prediction.find({ storeId }).select('metrics.daysUntilStockout')`
4. Verify storeId matches: Compare req.user.storeId with prediction.storeId

### 4. Alerts Endpoint Analysis
**File**: `backend/src/controllers/alertsController.js`

**Current Implementation**:
```javascript
exports.getAlerts = async (req, res) => {
  const storeId = req.user.storeId;
  const query = {
    isPerishable: true,
    'batches.0': { $exists: true },
    ...req.tenantFilter
  };
  const products = await Product.find(query);
  
  for (const product of products) {
    for (const batch of product.batches) {
      if (!batch.expiryDate) continue;
      const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      if (daysLeft <= effectiveThresholds.earlyWarning || daysLeft < 0) {
        alerts.push({ /* alert data */ });
      }
    }
  }
  // ...
}
```

**Potential Issues**:
1. No perishable products exist
2. Perishable products have no batches
3. Batches have no expiryDate field
4. All expiry dates are beyond earlyWarning threshold (30 days)

**Verification Steps**:
1. Check perishable products: `Product.countDocuments({ storeId, isPerishable: true })`
2. Check products with batches: `Product.countDocuments({ storeId, 'batches.0': { $exists: true } })`
3. Check expiry dates: `Product.find({ storeId }).select('batches.expiryDate')`
4. Check alert thresholds: `AlertSettings.findOne({ storeId })`

### 5. Test Data Creation (if needed)
**File**: `backend/scripts/create-test-data-for-alerts.js`

**Purpose**: Create realistic test data if Temple Hill store lacks products that trigger alerts

**Data to Create**:
- 2-3 perishable products with expiry dates in 3-5 days (critical alerts)
- 2-3 perishable products with expiry dates in 10-12 days (high urgency)
- 1-2 non-perishable slow-moving products
- Sales history for velocity calculations

**Schema**:
```javascript
{
  storeId: ObjectId("69921ce87d826e56d4743867"),
  name: "Test Milk",
  category: "Dairy",
  isPerishable: true,
  batches: [{
    batchNumber: "BATCH001",
    quantity: 20,
    expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days
    receivedDate: new Date()
  }]
}
```

## Data Flow

### AI Insights Badge Flow
```
1. User loads dashboard
2. Frontend calls /api/analytics/quick-insights
3. Backend authenticates user, gets storeId
4. Backend queries Prediction collection with storeId filter
5. Backend filters predictions by urgency criteria
6. Backend returns urgentCount and criticalItems
7. Frontend displays badge with count
```

### Alerts Page Flow
```
1. User navigates to Alerts page
2. Frontend calls /api/alerts
3. Backend authenticates user, gets storeId
4. Backend queries Product collection for perishable items
5. Backend iterates batches, calculates daysLeft
6. Backend filters by alert thresholds
7. Backend adds slow-moving product alerts
8. Backend returns alerts array with summary
9. Frontend displays alerts with actions
```

## Error Handling

### No Predictions Exist
**Symptom**: `urgentCount: 0`, `criticalItems: []`

**Diagnosis**:
```javascript
const predictionCount = await Prediction.countDocuments({ storeId });
if (predictionCount === 0) {
  console.log('No predictions exist - need to generate');
}
```

**Fix**: Run `generate-predictions.js` script

### No Urgent Predictions
**Symptom**: Predictions exist but all have low risk scores

**Diagnosis**:
```javascript
const predictions = await Prediction.find({ storeId });
const maxRisk = Math.max(...predictions.map(p => p.metrics.riskScore));
console.log(`Max risk score: ${maxRisk}`);
```

**Fix**: 
- If maxRisk < 70, this is expected behavior (no urgent items)
- Consider adjusting urgency threshold or creating test data

### No Expiring Products
**Symptom**: `alerts: []`, `summary.total: 0`

**Diagnosis**:
```javascript
const perishableCount = await Product.countDocuments({ 
  storeId, 
  isPerishable: true,
  'batches.0': { $exists: true }
});
const withExpiry = await Product.countDocuments({
  storeId,
  'batches.expiryDate': { $exists: true }
});
console.log(`Perishable: ${perishableCount}, With expiry: ${withExpiry}`);
```

**Fix**:
- If withExpiry === 0, products need expiry dates
- Run `create-test-data-for-alerts.js` or manually add expiry dates

### StoreId Mismatch
**Symptom**: Data exists but queries return empty

**Diagnosis**:
```javascript
console.log('User storeId:', req.user.storeId, typeof req.user.storeId);
console.log('Prediction storeIds:', predictions.map(p => p.storeId));
```

**Fix**: Ensure storeId is ObjectId type in queries

## Testing Strategy

### Unit Tests
- Test `getQuickInsights()` with various risk scores
- Test `getAlerts()` with various expiry dates
- Test prediction generation with low data points
- Test NaN sanitization

### Integration Tests
- Test full API flow with authentication
- Test multi-tenancy isolation
- Test cache invalidation

### Manual Testing
1. Run `test-ai-insights-alerts.js` script
2. Verify output shows data exists
3. Test endpoints with curl/Postman
4. Test in production app

## Correctness Properties

### Property 1: Prediction Existence
**Statement**: For every product with sales data, a prediction must exist

**Test**:
```javascript
const productsWithSales = await Product.find({ storeId }).select('_id');
for (const product of productsWithSales) {
  const salesCount = await Sale.countDocuments({ productId: product._id });
  if (salesCount > 0) {
    const prediction = await Prediction.findOne({ productId: product._id });
    assert(prediction !== null, `Prediction missing for product ${product._id}`);
  }
}
```

### Property 2: StoreId Consistency
**Statement**: All predictions must have the same storeId as their associated product

**Test**:
```javascript
const predictions = await Prediction.find({ storeId }).populate('productId');
for (const prediction of predictions) {
  assert(
    prediction.storeId.equals(prediction.productId.storeId),
    `StoreId mismatch: prediction ${prediction.storeId} vs product ${prediction.productId.storeId}`
  );
}
```

### Property 3: Urgency Criteria
**Statement**: Quick insights must only return predictions meeting urgency criteria

**Test**:
```javascript
const insights = await getQuickInsights(storeId);
for (const item of insights.criticalItems) {
  const prediction = await Prediction.findOne({ productId: item.productId });
  assert(
    prediction.metrics.riskScore >= 70 || prediction.metrics.daysUntilStockout <= 7,
    `Item ${item.productId} does not meet urgency criteria`
  );
}
```

### Property 4: Alert Threshold Compliance
**Statement**: Alerts must only include products within configured thresholds

**Test**:
```javascript
const settings = await AlertSettings.findOne({ storeId });
const alerts = await getAlerts(req, res);
for (const alert of alerts.data.alerts) {
  if (alert.level !== 'slow-moving') {
    assert(
      alert.daysLeft <= settings.thresholds.earlyWarning || alert.daysLeft < 0,
      `Alert ${alert.alertId} exceeds threshold: ${alert.daysLeft} days`
    );
  }
}
```

### Property 5: No NaN Values
**Statement**: Predictions must never contain NaN values in metrics or forecast

**Test**:
```javascript
const predictions = await Prediction.find({ storeId });
for (const prediction of predictions) {
  const metrics = Object.values(prediction.metrics);
  const forecast = Object.values(prediction.forecast).filter(v => typeof v === 'number');
  
  assert(
    !metrics.some(v => typeof v === 'number' && isNaN(v)),
    `NaN found in metrics for prediction ${prediction._id}`
  );
  assert(
    !forecast.some(v => isNaN(v)),
    `NaN found in forecast for prediction ${prediction._id}`
  );
}
```

## Implementation Plan

### Phase 1: Diagnosis (Priority: Critical)
1. Create `test-ai-insights-alerts.js` script
2. Run script to identify data gaps
3. Document findings

### Phase 2: Data Generation (Priority: High)
1. Create `generate-predictions.js` script
2. Run script to create predictions for all products
3. Verify predictions saved with correct storeId

### Phase 3: Test Data (Priority: Medium, if needed)
1. Create `create-test-data-for-alerts.js` script
2. Add products with expiry dates if none exist
3. Verify alerts endpoint returns data

### Phase 4: Validation (Priority: Critical)
1. Re-run `test-ai-insights-alerts.js` script
2. Test endpoints with curl/Postman
3. Test in production app
4. Confirm with user

## Rollback Plan

If fixes cause issues:
1. Revert any database changes (delete test data)
2. Restore original prediction generation logic
3. Clear prediction cache
4. Restart backend server

## Monitoring

After deployment:
- Monitor prediction generation success rate
- Track API response times for quick-insights and alerts
- Log any NaN validation errors
- Monitor cache hit rates

## Security Considerations

- All queries must filter by authenticated user's storeId
- Test scripts must not expose sensitive data
- Prediction generation must respect tenant boundaries
- Cache keys must include storeId to prevent cross-tenant leaks
