# AI Insights and Alerts Fixes - Implementation Tasks

## Task List

- [x] 1. Create diagnostic test script
  - [x] 1.1 Create `backend/scripts/test-ai-insights-alerts.js`
  - [x] 1.2 Add prediction existence check
  - [x] 1.3 Add urgency criteria verification
  - [x] 1.4 Add product expiry date check
  - [x] 1.5 Add simulated API call tests
  - [x] 1.6 Run script and document findings

- [x] 2. Create prediction generation script
  - [x] 2.1 Create `backend/scripts/generate-predictions.js`
  - [x] 2.2 Add logic to find all products with sales
  - [x] 2.3 Add prediction generation for each product
  - [x] 2.4 Add storeId validation
  - [x] 2.5 Add error handling and logging
  - [x] 2.6 Run script and verify predictions created

- [x] 3. Verify quick insights endpoint
  - [x] 3.1 Test endpoint with curl/Postman
  - [x] 3.2 Verify storeId filtering works
  - [x] 3.3 Verify urgency criteria applied correctly
  - [x] 3.4 Check response format matches frontend expectations
  - [x] 3.5 Test with different risk score scenarios

- [x] 4. Verify alerts endpoint
  - [x] 4.1 Test endpoint with curl/Postman
  - [x] 4.2 Verify perishable product filtering
  - [x] 4.3 Verify expiry date calculations
  - [x] 4.4 Verify alert threshold logic
  - [x] 4.5 Test slow-moving product detection

- [x] 5. Create test data (if needed)
  - [x] 5.1 Create `backend/scripts/create-test-data-for-alerts.js`
  - [x] 5.2 Add products with critical expiry dates (3-5 days)
  - [x] 5.3 Add products with high urgency expiry dates (10-12 days)
  - [x] 5.4 Add slow-moving non-perishable products
  - [x] 5.5 Add sales history for velocity calculations
  - [x] 5.6 Run script and verify data created

- [x] 6. Run comprehensive validation
  - [x] 6.1 Re-run diagnostic script
  - [x] 6.2 Verify all data gaps resolved
  - [x] 6.3 Test both endpoints return data
  - [x] 6.4 Verify multi-tenancy isolation
  - [x] 6.5 Document final state

- [x] 7. User acceptance testing
  - [ ] 7.1 User tests AI Insights badge in app
  - [ ] 7.2 User tests Alerts page in app
  - [ ] 7.3 User confirms fixes work as expected
  - [ ] 7.4 Address any remaining issues

## Task Details

### Task 1: Create diagnostic test script
**Goal**: Identify why AI Insights and Alerts show empty states

**Script Structure**:
```javascript
// Test 1: Check predictions exist
// Test 2: Check urgency criteria
// Test 3: Check product expiry dates
// Test 4: Simulate API calls
// Test 5: Report findings
```

**Success Criteria**:
- Script runs without errors
- Script identifies specific data gaps
- Script provides actionable recommendations

### Task 2: Create prediction generation script
**Goal**: Generate predictions for all products with sales data

**Script Structure**:
```javascript
// 1. Connect to database
// 2. Find all products for Temple Hill store
// 3. For each product with sales:
//    - Generate prediction
//    - Save with storeId
//    - Log result
// 4. Report summary
```

**Success Criteria**:
- Predictions created for all products with sales
- All predictions have correct storeId
- No NaN values in predictions
- Script logs success/failure for each product

### Task 3: Verify quick insights endpoint
**Goal**: Ensure endpoint returns urgent predictions correctly

**Test Commands**:
```bash
# Get auth token
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@templehill.com","password":"password"}'

# Test quick insights
curl -X GET http://localhost:8000/api/analytics/quick-insights \
  -H "Authorization: Bearer <token>"
```

**Success Criteria**:
- Endpoint returns 200 status
- Response includes urgentCount and criticalItems
- Data is filtered by user's storeId
- Urgency criteria applied correctly

### Task 4: Verify alerts endpoint
**Goal**: Ensure endpoint returns expiring products correctly

**Test Commands**:
```bash
# Test alerts
curl -X GET http://localhost:8000/api/alerts \
  -H "Authorization: Bearer <token>"
```

**Success Criteria**:
- Endpoint returns 200 status
- Response includes alerts array and summary
- Alerts filtered by user's storeId
- Alert levels calculated correctly
- Recommended actions included

### Task 5: Create test data (if needed)
**Goal**: Add realistic test data if Temple Hill store lacks alert-triggering products

**Data Requirements**:
- 2-3 products expiring in 3-5 days (critical)
- 2-3 products expiring in 10-12 days (high urgency)
- 1-2 slow-moving products
- Sales history for each product

**Success Criteria**:
- Test data created with correct storeId
- Products have realistic attributes
- Expiry dates trigger alerts
- Sales history enables velocity calculations

### Task 6: Run comprehensive validation
**Goal**: Verify all fixes work end-to-end

**Validation Steps**:
1. Run diagnostic script - should show no data gaps
2. Test quick insights endpoint - should return urgent items
3. Test alerts endpoint - should return expiring products
4. Verify multi-tenancy - other stores not affected
5. Check logs for errors

**Success Criteria**:
- All tests pass
- No data gaps reported
- Both endpoints return expected data
- Multi-tenancy isolation maintained

### Task 7: User acceptance testing
**Goal**: Confirm fixes work in production app

**Test Scenarios**:
1. User logs into app
2. User views dashboard - AI Insights badge shows count
3. User taps badge - navigates to insights
4. User navigates to Alerts page - sees expiring products
5. User confirms data is accurate

**Success Criteria**:
- User confirms AI Insights badge shows correct count
- User confirms Alerts page displays expiring products
- User reports no errors or issues
- User accepts fixes as complete

## Dependencies

- Task 2 depends on Task 1 (need diagnosis before generating predictions)
- Task 3 depends on Task 2 (need predictions to test quick insights)
- Task 5 depends on Task 1 (only create test data if needed)
- Task 6 depends on Tasks 2-5 (validate after all fixes applied)
- Task 7 depends on Task 6 (user testing after validation)

## Estimated Timeline

- Task 1: 30 minutes
- Task 2: 30 minutes
- Task 3: 20 minutes
- Task 4: 20 minutes
- Task 5: 30 minutes (if needed)
- Task 6: 20 minutes
- Task 7: User-dependent

**Total**: ~2.5 hours (excluding user testing)

## Rollback Procedure

If issues arise:
1. Stop execution at current task
2. Document issue encountered
3. Revert database changes (delete test data/predictions)
4. Clear prediction cache
5. Restart backend server
6. Report issue to user

## Notes

- All scripts must connect to correct database (local vs production)
- All scripts must use Temple Hill store ID: `69921ce87d826e56d4743867`
- All scripts must handle errors gracefully
- All scripts must log detailed output for debugging
- User testing (Task 7) should be done in production app, not local
