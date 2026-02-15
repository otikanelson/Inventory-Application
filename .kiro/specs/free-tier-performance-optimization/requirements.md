# Free Tier Performance Optimization - Requirements

## Project Context
The client has reported severe performance issues with the deployed application on Render Free Tier. The budget does not allow for hosting upgrades, so we need to implement aggressive optimizations to work within free tier constraints.

---

## Problem Analysis

### Current Issues
1. **Cold Start Delays**: Server spins down after 15 minutes, takes 30-60 seconds to wake up
2. **Slow Scanner**: Takes 5-10 seconds to process barcodes
3. **Slow Dashboard**: Takes 30-60 seconds to load on first open
4. **Poor User Experience**: Users think app is broken

### Root Causes
1. Render Free Tier spins down after inactivity
2. No persistent cache between restarts
3. Multiple sequential API calls on app startup
4. Large payload sizes (images in responses)
5. No database query optimization
6. No frontend caching strategy

---

## Solution Strategy

### Three-Pronged Approach
1. **Keep Server Awake**: External ping service to prevent spin-down
2. **Backend Optimization**: Database indexes, compression, query optimization
3. **Frontend Caching**: Aggressive AsyncStorage caching with offline-first approach

---

## 1. Keep-Alive Service

### 1.1 User Story
**As a** user  
**I want** the app to respond quickly even after periods of inactivity  
**So that** I don't have to wait 30-60 seconds for the server to wake up

### 1.2 Acceptance Criteria

**AC 1.1: UptimeRobot Configuration**
- GIVEN the server spins down after 15 minutes
- WHEN implementing keep-alive service
- THEN:
  - Set up UptimeRobot free account
  - Configure HTTP(s) monitor for backend URL
  - Set ping interval to 10 minutes (within free tier limits)
  - Monitor pings `/api` endpoint
  - Verify server stays awake 24/7

**AC 1.2: Health Check Endpoint**
- GIVEN UptimeRobot needs to ping the server
- WHEN implementing health check
- THEN:
  - Create lightweight `/api/health` endpoint
  - Response time < 100ms
  - No database queries in health check
  - Returns simple JSON: `{ "status": "ok", "timestamp": "..." }`
  - Logs ping activity for monitoring

**AC 1.3: Fallback Ping Service**
- GIVEN UptimeRobot might have downtime
- WHEN implementing redundancy
- THEN:
  - Add Cron-job.org as backup ping service
  - Configure to ping every 12 minutes (offset from UptimeRobot)
  - Ensures at least one service keeps server awake
  - Both services are free

---

## 2. Backend Optimization

### 2.1 User Story
**As a** user  
**I want** API responses to be fast  
**So that** the scanner and dashboard load quickly

### 2.2 Acceptance Criteria

**AC 2.1: Database Indexing**
- GIVEN slow database queries
- WHEN implementing indexes
- THEN create indexes on:
  - `Product.barcode` (unique, for scanner lookups)
  - `Product.category` (for filtering)
  - `Product.batches.expiryDate` (for FEFO sorting)
  - `Sale.date` (for analytics queries)
  - `Sale.product` (for product sales history)
  - `GlobalProduct.barcode` (for registry lookups)

**AC 2.2: Query Optimization**
- GIVEN unnecessary data being fetched
- WHEN optimizing queries
- THEN:
  - Use field projection (`.select()`) to fetch only needed fields
  - Scanner lookup: Only fetch `name, category, imageUrl, isPerishable`
  - Product list: Don't fetch full batch arrays, use aggregation
  - Implement pagination (20 items per page)
  - Use `.lean()` for read-only queries (faster)

**AC 2.3: Response Compression**
- GIVEN large response payloads
- WHEN implementing compression
- THEN:
  - Add `compression` middleware to Express
  - Enable gzip compression for all responses
  - Reduce payload size by 60-80%
  - Faster network transfer times

**AC 2.4: Image Optimization**
- GIVEN large image URLs in responses
- WHEN optimizing image delivery
- THEN:
  - Use Cloudinary transformations for thumbnails
  - Product list: 100x100px thumbnails
  - Product detail: 400x400px images
  - Scanner: Don't include images in initial response
  - Lazy load images in frontend

**AC 2.5: API Response Caching**
- GIVEN repeated requests for same data
- WHEN implementing server-side caching
- THEN:
  - Cache product registry lookups (5 minutes)
  - Cache dashboard insights (10 minutes)
  - Cache category lists (30 minutes)
  - Use existing node-cache service
  - Clear cache on data mutations

**AC 2.6: Request Batching Endpoint**
- GIVEN multiple sequential API calls
- WHEN implementing batch endpoint
- THEN:
  - Create `/api/batch` endpoint
  - Accept array of requests
  - Process in parallel
  - Return array of responses
  - Reduce round trips from 5+ to 1

---

## 3. Frontend Caching & Optimization

### 3.1 User Story
**As a** user  
**I want** the app to load instantly with cached data  
**So that** I can start working immediately without waiting

### 3.2 Acceptance Criteria

**AC 3.1: AsyncStorage Caching Strategy**
- GIVEN slow API responses
- WHEN implementing frontend caching
- THEN cache:
  - Product list (refresh every 5 minutes)
  - Dashboard insights (refresh every 10 minutes)
  - Category list (refresh every 30 minutes)
  - User settings (persist indefinitely)
  - Last sync timestamp for each cache

**AC 3.2: Offline-First Loading**
- GIVEN cached data exists
- WHEN app opens
- THEN:
  - Show cached data immediately (< 1 second)
  - Display "Syncing..." indicator
  - Fetch fresh data in background
  - Update UI when fresh data arrives
  - Show last sync time

**AC 3.3: Optimistic UI Updates**
- GIVEN user performs an action
- WHEN updating data
- THEN:
  - Update UI immediately (optimistic)
  - Send API request in background
  - Revert if API request fails
  - Show success/error feedback
  - Update cache on success

**AC 3.4: Smart Cache Invalidation**
- GIVEN cached data might be stale
- WHEN determining cache validity
- THEN:
  - Check timestamp on each cache read
  - Invalidate if older than TTL
  - Force refresh on user pull-to-refresh
  - Clear cache on logout
  - Clear specific cache on related mutations

**AC 3.5: Cold Start Detection**
- GIVEN server might be asleep
- WHEN making first API request
- THEN:
  - Set timeout to 5 seconds
  - If timeout, show "Waking up server..." message
  - Retry with 60 second timeout
  - Show progress indicator
  - Use cached data while waiting

**AC 3.6: Scanner Optimization**
- GIVEN scanner is critical feature
- WHEN optimizing scanner performance
- THEN:
  - Pre-cache registry data on app start
  - Check local cache before API call
  - Show instant feedback for known products
  - Only call API for unknown barcodes
  - Cache scan results for 1 hour

---

## 4. Database Query Optimization

### 4.1 User Story
**As a** developer  
**I want** database queries to be fast  
**So that** API responses are quick

### 4.2 Acceptance Criteria

**AC 4.1: Product List Query**
- GIVEN slow product list loading
- WHEN optimizing query
- THEN:
  ```javascript
  // Before (slow)
  Product.find()
  
  // After (fast)
  Product.find()
    .select('name barcode category totalQuantity imageUrl')
    .limit(20)
    .skip(page * 20)
    .lean()
  ```

**AC 4.2: Scanner Lookup Query**
- GIVEN slow scanner response
- WHEN optimizing registry lookup
- THEN:
  ```javascript
  // Before (slow)
  GlobalProduct.findOne({ barcode })
  
  // After (fast)
  GlobalProduct.findOne({ barcode })
    .select('name category imageUrl isPerishable')
    .lean()
  ```

**AC 4.3: Dashboard Query**
- GIVEN slow dashboard loading
- WHEN optimizing insights query
- THEN:
  - Use aggregation pipeline
  - Calculate totals in database
  - Don't fetch full documents
  - Cache results for 10 minutes

**AC 4.4: FEFO Query**
- GIVEN slow FEFO page loading
- WHEN optimizing expiry query
- THEN:
  ```javascript
  // Use aggregation to unwind batches
  Product.aggregate([
    { $unwind: '$batches' },
    { $match: { 'batches.expiryDate': { $lte: threshold } } },
    { $sort: { 'batches.expiryDate': 1 } },
    { $limit: 50 }
  ])
  ```

---

## 5. Network Optimization

### 5.1 User Story
**As a** user  
**I want** data to transfer quickly  
**So that** the app feels responsive

### 5.2 Acceptance Criteria

**AC 5.1: Request Deduplication**
- GIVEN multiple components requesting same data
- WHEN implementing request deduplication
- THEN:
  - Track in-flight requests
  - Return same promise for duplicate requests
  - Prevent redundant API calls
  - Share response across components

**AC 5.2: Request Prioritization**
- GIVEN multiple pending requests
- WHEN implementing prioritization
- THEN:
  - Critical requests (scanner): High priority
  - User-initiated (button click): Medium priority
  - Background sync: Low priority
  - Cancel low priority on new high priority

**AC 5.3: Retry Strategy**
- GIVEN network failures
- WHEN implementing retry logic
- THEN:
  - Retry failed requests up to 3 times
  - Exponential backoff (1s, 2s, 4s)
  - Don't retry on 4xx errors
  - Show error after final retry
  - Queue for later if offline

---

## 6. Monitoring & Feedback

### 6.1 User Story
**As a** user  
**I want** to know when the app is loading data  
**So that** I understand what's happening

### 6.2 Acceptance Criteria

**AC 6.1: Loading States**
- GIVEN data is being fetched
- WHEN showing loading indicators
- THEN:
  - Show skeleton loaders (not spinners)
  - Display "Using cached data" badge
  - Show "Syncing..." when refreshing
  - Display last sync time
  - Show progress for long operations

**AC 6.2: Error Handling**
- GIVEN API request fails
- WHEN handling errors
- THEN:
  - Show user-friendly error messages
  - Offer retry button
  - Fall back to cached data if available
  - Log errors for debugging
  - Don't crash the app

**AC 6.3: Performance Monitoring**
- GIVEN need to track improvements
- WHEN implementing monitoring
- THEN:
  - Log API response times
  - Track cache hit rates
  - Monitor cold start frequency
  - Log slow queries (> 1 second)
  - Store metrics in AsyncStorage

---

## 7. Implementation Scripts

### 7.1 User Story
**As a** developer  
**I want** automated scripts to set up optimizations  
**So that** implementation is quick and error-free

### 7.2 Acceptance Criteria

**AC 7.1: Database Index Creation Script**
- GIVEN need to create indexes
- WHEN running setup script
- THEN:
  - Create `backend/scripts/create-indexes.js`
  - Connect to MongoDB
  - Create all required indexes
  - Verify index creation
  - Log results

**AC 7.2: Cache Warmup Script**
- GIVEN cold cache on server restart
- WHEN running warmup script
- THEN:
  - Pre-populate frequently accessed data
  - Cache dashboard insights
  - Cache product registry
  - Run on server startup
  - Complete in < 10 seconds

**AC 7.3: Performance Test Script**
- GIVEN need to measure improvements
- WHEN running performance tests
- THEN:
  - Test API response times
  - Test scanner speed
  - Test dashboard load time
  - Compare before/after
  - Generate report

---

## Expected Performance Improvements

### Before Optimization
- Cold start: 30-60 seconds
- Scanner: 5-10 seconds
- Dashboard: 30-60 seconds (cold), 5-10 seconds (warm)
- Product list: 3-5 seconds

### After Optimization (Target)
- Cold start: 5-10 seconds (with keep-alive: 0 seconds)
- Scanner: 1-2 seconds (cached: < 0.5 seconds)
- Dashboard: 2-3 seconds (cached: < 1 second)
- Product list: 1-2 seconds (cached: < 0.5 seconds)

### Improvement Metrics
- 80-90% reduction in cold start frequency (keep-alive)
- 70-80% reduction in API response times (caching + optimization)
- 90%+ reduction in perceived load time (offline-first)
- 60-80% reduction in network payload size (compression)

---

## Implementation Priority

### Phase 1: Quick Wins (Day 1)
1. Set up UptimeRobot keep-alive service (15 minutes)
2. Add response compression (10 minutes)
3. Create database indexes (30 minutes)
4. Deploy and test

**Expected improvement**: 60-70% better

### Phase 2: Backend Optimization (Day 2)
1. Optimize database queries
2. Implement API response caching
3. Add image optimization
4. Create batch endpoint

**Expected improvement**: 75-85% better

### Phase 3: Frontend Caching (Day 3)
1. Implement AsyncStorage caching
2. Add offline-first loading
3. Implement optimistic UI
4. Add cold start detection

**Expected improvement**: 85-95% better

### Phase 4: Polish (Day 4)
1. Add loading states
2. Improve error handling
3. Add performance monitoring
4. Final testing

**Expected improvement**: 90-95% better

---

## Success Criteria

### Must Have
- ✅ Server stays awake 24/7 (keep-alive service)
- ✅ Scanner responds in < 2 seconds
- ✅ Dashboard loads in < 3 seconds
- ✅ App shows cached data immediately
- ✅ No "server waking up" delays for users

### Should Have
- ✅ Scanner uses cached data (< 0.5 seconds)
- ✅ Offline-first experience
- ✅ Optimistic UI updates
- ✅ Performance monitoring

### Nice to Have
- ✅ Request batching
- ✅ Request prioritization
- ✅ Advanced retry strategies

---

## Technical Considerations

### Keep-Alive Service
- UptimeRobot free tier: 50 monitors, 5-minute intervals
- We'll use 10-minute intervals to be safe
- Cron-job.org as backup: 60 monitors, 1-minute intervals
- Combined: 99.9% uptime for keep-alive

### Caching Strategy
- AsyncStorage limit: 6MB (plenty for our needs)
- Cache invalidation: Time-based + manual
- Cache keys: Namespaced by feature
- Cache versioning: Clear on app updates

### Database Indexes
- Indexes speed up reads, slow down writes
- Our app is read-heavy (good for indexes)
- Monitor index usage with MongoDB Atlas
- Remove unused indexes if needed

### Compression
- Gzip compression: 60-80% size reduction
- Minimal CPU overhead
- Supported by all modern clients
- Automatic with Express middleware

---

## Risk Mitigation

### Risk 1: Keep-Alive Service Fails
**Mitigation**: 
- Use two services (UptimeRobot + Cron-job.org)
- Monitor both services
- Alert if both fail
- Fallback: Show "waking up" message

### Risk 2: Cache Becomes Stale
**Mitigation**:
- Time-based invalidation
- Manual refresh option (pull-to-refresh)
- Show last sync time
- Force refresh on critical actions

### Risk 3: AsyncStorage Quota Exceeded
**Mitigation**:
- Monitor storage usage
- Implement LRU eviction
- Clear old cache entries
- Limit cache size per feature

### Risk 4: Optimizations Don't Help Enough
**Mitigation**:
- Measure before/after
- Iterate on slow areas
- Consider alternative free hosting (Railway, Fly.io)
- Document limitations for client

---

## Testing Strategy

### Performance Testing
1. Measure baseline (before optimization)
2. Implement Phase 1, measure improvement
3. Implement Phase 2, measure improvement
4. Implement Phase 3, measure improvement
5. Compare final vs baseline

### User Testing
1. Test on slow network (3G simulation)
2. Test cold start scenario
3. Test with empty cache
4. Test with full cache
5. Test offline mode

### Load Testing
1. Simulate multiple concurrent users
2. Test cache hit rates
3. Monitor server resource usage
4. Verify keep-alive service works

---

## Documentation

### For Client
- Explain optimizations implemented
- Set expectations (still free tier, has limits)
- Provide performance comparison
- Document known limitations

### For Future Developers
- Document caching strategy
- Explain keep-alive setup
- List all optimizations
- Provide troubleshooting guide

---

## Cost Analysis

### Current Cost: $0/month
- Render Free Tier: $0
- UptimeRobot: $0 (free tier)
- Cron-job.org: $0 (free tier)
- MongoDB Atlas: $0 (free tier)
- Cloudinary: $0 (free tier)

### After Optimization: $0/month
- No additional costs
- All optimizations use free services
- Development time: 3-4 days

### ROI
- Cost: $0
- Improvement: 85-95% better performance
- Client satisfaction: High
- Infinite ROI 🎉

---

## Next Steps

1. **Review & Approve Requirements** (this document)
2. **Create Design Document** (technical implementation details)
3. **Create Tasks Document** (step-by-step implementation)
4. **Execute Phase 1** (quick wins)
5. **Test & Measure** (verify improvements)
6. **Execute Phases 2-4** (complete optimization)
7. **Final Testing** (end-to-end validation)
8. **Deploy to Production** (rebuild APK)
9. **Monitor Performance** (track metrics)
10. **Document Results** (share with client)

---

*Requirements Version: 1.0*  
*Created: February 14, 2026*  
*Status: Ready for Review*
