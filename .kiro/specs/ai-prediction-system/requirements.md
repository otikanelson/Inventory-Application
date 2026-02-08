# AI Prediction System - Requirements Document

## Project Overview
Design and implement a seamless, non-intrusive AI prediction system that helps inventory managers make data-driven decisions without overwhelming them. The system should work quietly in the background, surfacing insights at the right moments.

---

## 1. End User Goals & Benefits

### 1.1 Primary Goals
**What the system should help users achieve:**

1. **Prevent Waste**
   - Identify products at risk of expiring before they sell
   - Suggest optimal discount strategies to move expiring stock
   - Alert users to overstocked items with low demand

2. **Optimize Restocking**
   - Predict when products will run out based on sales velocity
   - Recommend optimal reorder quantities
   - Identify fast-moving products that need frequent restocking

3. **Maximize Profitability**
   - Identify high-margin, high-velocity products to prioritize
   - Suggest pricing adjustments based on demand trends
   - Highlight slow-moving products that tie up capital

4. **Reduce Manual Analysis**
   - Automatically calculate demand trends and patterns
   - Surface actionable insights without requiring spreadsheets
   - Provide confidence scores so users know when to trust predictions

5. **Improve Decision Making**
   - Show historical patterns to inform future purchases
   - Predict seasonal demand fluctuations
   - Identify products with declining vs growing demand

---

## 2. Core Prediction Features

### 2.1 Demand Forecasting
- **7-day, 14-day, and 30-day demand predictions** for each product
- **Confidence levels** (High/Medium/Low) based on data availability
- **Trend indicators** (Increasing/Stable/Decreasing)
- **Velocity metrics** (units sold per day)

### 2.2 Expiry Risk Analysis
- **Risk scores (0-100)** for perishable products
- **Days until expiry** vs **days until stockout** comparison
- **Urgency levels** (Critical/High/Medium/Low)
- **Recommended actions** (discount %, promotion ideas)

### 2.3 Restock Recommendations
- **Predicted stockout dates** based on current velocity
- **Optimal reorder quantities** based on demand patterns
- **Reorder point alerts** (when to place next order)
- **Safety stock suggestions** to prevent stockouts

### 2.4 Product Performance Insights
- **Sales velocity trends** (accelerating/decelerating)
- **Turnover rate** (how quickly inventory moves)
- **Profitability indicators** (if pricing data available)
- **Category performance** comparisons

---

## 3. User Experience Principles

### 3.1 Seamless Integration
**The AI should feel like a helpful assistant, not a separate feature:**

- ✅ Insights appear contextually where users already work
- ✅ No separate "AI Dashboard" that users must visit
- ✅ Predictions surface naturally in existing workflows
- ✅ Visual indicators are subtle but noticeable
- ✅ Users can ignore predictions without breaking their flow

### 3.2 Non-Intrusive Design
**Users should benefit without feeling overwhelmed:**

- ✅ Small badges/indicators on product cards (not pop-ups)
- ✅ Expandable sections for detailed insights (collapsed by default)
- ✅ Color-coded risk levels (red/orange/yellow/green)
- ✅ Icon-based quick indicators (⚡ fast-moving, ⚠️ at-risk, etc.)
- ✅ Optional notifications (user can disable)

### 3.3 Actionable Insights
**Every prediction should suggest a clear next step:**

- ✅ "Apply 30% discount" (not just "high risk")
- ✅ "Restock in 5 days" (not just "low stock")
- ✅ "Reduce next order by 50%" (not just "slow-moving")
- ✅ One-tap actions where possible (e.g., "Create Discount")

---

## 4. Frontend Integration Points

### 4.1 Dashboard (Main Screen)
**Subtle AI indicators without cluttering the interface:**

- **Quick Stats Card** (top of dashboard)
  - Small "AI Insights" badge showing count of urgent items
  - Expandable to show top 3 recommendations
  - Dismissible after user acknowledges

- **Product Cards** (inventory grid)
  - Small colored dot indicator (risk level)
  - Velocity arrow (↑ fast-moving, ↓ slow-moving)
  - No text labels (keep cards clean)

- **Recently Sold Section**
  - Trend arrows next to product names
  - Subtle "Restock Soon" badge for fast movers

### 4.2 Product Detail Page
**Detailed insights when user wants to dig deeper:**

- **Prediction Card** (collapsible section)
  - Forecast for next 7/14/30 days
  - Confidence level indicator
  - Historical sales mini-chart
  - Trend analysis

- **Risk Assessment** (for perishable items)
  - Risk score with color indicator
  - Days until expiry vs days until stockout
  - Recommended actions (discount suggestions)

- **Restock Recommendations**
  - Predicted stockout date
  - Suggested reorder quantity
  - Optimal reorder timing

### 4.3 FEFO Queue Page
**AI-enhanced expiry management:**

- **Smart Sorting Options**
  - "By AI Risk Score" (in addition to expiry date)
  - Combines expiry date + demand velocity
  - Highlights items that won't sell in time

- **Batch-Level Predictions**
  - Show which batches are at highest risk
  - Suggest which batches to discount first

### 4.4 Admin Stats Page (Existing)
**Keep current implementation but enhance it:**

- **Current Features** (keep as-is)
  - High Risk Products list
  - Top Selling Products list
  - Sales Performance summary
  - AI Recommendations section

- **Enhancements** (add to existing)
  - Category-level insights
  - Trend charts (7-day/30-day comparison)
  - Prediction accuracy tracking
  - Export insights as PDF/CSV

### 4.5 Inventory Page
**Subtle indicators on product list:**

- **List View Enhancements**
  - Small colored dot next to product name (risk level)
  - Velocity indicator (⚡ icon for fast movers)
  - Optional "AI Sort" button (sort by risk/velocity)

### 4.6 Add Products Page
**Smart suggestions when adding stock:**

- **Historical Context** (when adding to existing product)
  - "Last batch sold in X days"
  - "Typical demand: Y units/week"
  - "Suggested quantity: Z units"

---

## 5. Visual Design Guidelines

### 5.1 Color Coding (Risk Levels)
- 🔴 **Critical (70-100)**: Red (#FF4444) - Urgent action needed
- 🟠 **High (50-69)**: Orange (#FF9500) - Monitor closely
- 🟡 **Medium (30-49)**: Yellow (#FFCC00) - Watch for changes
- 🟢 **Low (0-29)**: Green (#34C759) - Healthy status

### 5.2 Icon System
- ⚡ **Fast-moving** (velocity > 5 units/day)
- 🐌 **Slow-moving** (velocity < 0.5 units/day)
- ⚠️ **At-risk** (expiry risk > 50)
- 📈 **Trending up** (demand increasing)
- 📉 **Trending down** (demand decreasing)
- 🎯 **Restock soon** (< 7 days until stockout)

### 5.3 Badge Design
- **Small, rounded badges** (not rectangular boxes)
- **Minimal text** (1-2 words max)
- **Semi-transparent backgrounds** (don't block content)
- **Positioned in corners** (top-right or bottom-right)

---

## 6. Backend Requirements

### 6.1 Existing System (Keep & Enhance)
**Current `predictiveAnalytics.js` service:**
- ✅ Moving average calculations
- ✅ Trend analysis
- ✅ Velocity calculations
- ✅ Expiry risk scoring
- ✅ Recommendation generation
- ✅ Dashboard analytics

**Enhancements Needed:**
- Add caching layer (predictions valid for 1 hour)
- Batch processing for multiple products
- Historical prediction accuracy tracking
- Category-level aggregations

### 6.2 New API Endpoints
```
GET /api/analytics/product/:id/predictions
  - Returns full prediction data for one product
  - Includes forecast, risk, recommendations

GET /api/analytics/quick-insights
  - Returns minimal data for dashboard badges
  - Only urgent items (risk > 70 or stockout < 7 days)
  - Lightweight response (< 1KB)

GET /api/analytics/category/:category/insights
  - Category-level performance metrics
  - Compare products within category

POST /api/analytics/feedback
  - Allow users to mark predictions as helpful/not helpful
  - Improve accuracy over time
```

### 6.3 Data Requirements
**Minimum data for predictions:**
- At least 7 days of sales history (Medium confidence)
- At least 14 days of sales history (High confidence)
- Less than 7 days (Low confidence - show warning)

**Fallback behavior:**
- If no sales history: Show "Insufficient data" message
- If product is new: Use category averages as baseline
- If category is new: Use overall store averages

---

## 7. Performance Considerations

### 7.1 Optimization Strategies
- **Cache predictions** for 1 hour (refresh on demand)
- **Lazy load** detailed insights (only when user expands)
- **Batch API calls** (fetch multiple products at once)
- **Background processing** (calculate predictions during off-peak hours)

### 7.2 Loading States
- **Skeleton loaders** for prediction cards
- **Stale-while-revalidate** pattern (show old data while fetching new)
- **Progressive enhancement** (show basic info first, add predictions after)

---

## 8. Settings & Customization

### 8.1 User Preferences (Admin Settings)
- **Enable/Disable AI Features** (global toggle)
- **Risk Threshold Adjustments** (customize what counts as "high risk")
- **Notification Preferences** (which alerts to receive)
- **Confidence Level Filter** (hide low-confidence predictions)

### 8.2 Per-Product Overrides
- **Exclude from predictions** (for irregular items)
- **Custom demand patterns** (seasonal products)
- **Manual forecast adjustments** (override AI suggestions)

---

## 9. Success Metrics

### 9.1 User Engagement
- % of users who expand AI insights
- % of users who act on recommendations
- Time spent on prediction features

### 9.2 Business Impact
- Reduction in expired product waste
- Improvement in stockout prevention
- Increase in inventory turnover rate
- Reduction in overstock situations

### 9.3 Prediction Accuracy
- Forecast accuracy (predicted vs actual sales)
- Risk score accuracy (did high-risk items actually expire?)
- Restock timing accuracy (did stockouts occur as predicted?)

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1)
- Enhance existing backend service
- Add caching layer
- Create new API endpoints
- Test prediction accuracy

### Phase 2: Dashboard Integration (Week 2)
- Add subtle indicators to product cards
- Create expandable insights section
- Implement quick stats badge
- Add loading states

### Phase 3: Detail Pages (Week 3)
- Product detail prediction card
- FEFO AI sorting
- Inventory list indicators
- Add products suggestions

### Phase 4: Polish & Optimize (Week 4)
- Performance optimization
- User settings
- Feedback mechanism
- Documentation

---

## 11. Out of Scope (Future Enhancements)

**Not included in initial implementation:**
- Machine learning models (using statistical methods for now)
- External data integration (weather, holidays, etc.)
- Automated ordering (just recommendations)
- Price optimization algorithms
- Multi-location predictions
- Supplier lead time integration

---

## 12. Key Design Principles Summary

1. **Invisible by Default** - Users shouldn't notice AI unless they need it
2. **Contextual Surfacing** - Show insights where users already work
3. **Actionable Always** - Every prediction includes a clear next step
4. **Confidence Transparency** - Always show how reliable predictions are
5. **Progressive Disclosure** - Basic info first, details on demand
6. **Performance First** - Never slow down the app for AI features
7. **User Control** - Easy to disable or customize
8. **Graceful Degradation** - App works fine without AI data

---

## Design Decisions (APPROVED)

1. **Dashboard Integration**: ✅ AI Insights badge always visible
2. **Product Cards**: ✅ Colored dot only (subtle and neat)
3. **Admin Stats Page**: ✅ Merge insights into other pages + extensive dialogue in admin stats
4. **Notifications**: ✅ Push notifications for critical predictions
5. **Confidence Levels**: ✅ Show low-confidence predictions with warning
6. **Historical Data**: ✅ 30 days lookback period
7. **Batch Processing**: ✅ **Real-time updates (RTS - Real-Time System)**
8. **User Feedback**: ❌ No "Was this helpful?" button

---

## User Stories & Acceptance Criteria

### US-1: Dashboard AI Insights Badge
**As a** store manager  
**I want to** see an always-visible AI insights badge on my dashboard  
**So that** I'm immediately aware of urgent inventory issues

**Acceptance Criteria:**
- Badge shows count of urgent items (risk > 70 or stockout < 7 days)
- Badge is expandable to show top 3 recommendations
- Badge updates in real-time when inventory changes
- Badge uses color coding (red for critical, orange for warnings)

### US-2: Product Card Risk Indicators
**As a** store manager  
**I want to** see subtle colored dots on product cards  
**So that** I can quickly identify at-risk products without clutter

**Acceptance Criteria:**
- Small colored dot in top-right corner of product card
- Color indicates risk level (red/orange/yellow/green)
- Dot appears for all products with predictions
- No text labels (keep cards clean)
- Tapping product shows detailed insights

### US-3: Product Detail Predictions
**As a** store manager  
**I want to** see detailed AI predictions on product detail pages  
**So that** I can make informed decisions about specific products

**Acceptance Criteria:**
- Collapsible "AI Predictions" section
- Shows 7/14/30-day demand forecast
- Displays confidence level with visual indicator
- Shows risk score for perishable items
- Provides actionable recommendations
- Updates in real-time when sales occur

### US-4: FEFO AI Sorting
**As a** store manager  
**I want to** sort FEFO queue by AI risk score  
**So that** I prioritize products that won't sell before expiring

**Acceptance Criteria:**
- "Sort by AI Risk" option in FEFO page
- Combines expiry date + demand velocity
- Highlights batches at highest risk
- Shows recommended discount percentages
- Updates in real-time

### US-5: Critical Predictions Notifications
**As a** store manager  
**I want to** receive push notifications for critical predictions  
**So that** I can take immediate action on urgent issues

**Acceptance Criteria:**
- Notification when product risk score reaches 70+
- Notification when stockout predicted within 3 days
- Notification when 5+ products need urgent attention
- Notifications include actionable suggestions
- User can customize notification thresholds in settings

### US-6: Low-Confidence Warnings
**As a** store manager  
**I want to** see predictions even with limited data  
**So that** I have some guidance while building sales history

**Acceptance Criteria:**
- Show predictions with < 7 days of data
- Display clear "Low Confidence" warning badge
- Explain why confidence is low (e.g., "Only 3 days of sales data")
- Suggest waiting for more data before major decisions
- Use category/store averages as baseline

### US-7: Real-Time Prediction Updates
**As a** store manager  
**I want to** see predictions update immediately after sales  
**So that** I always have current information

**Acceptance Criteria:**
- Predictions recalculate after each sale transaction
- Dashboard badges update within 1 second
- Product detail predictions refresh automatically
- No manual refresh required
- Optimistic UI updates (show immediately, validate in background)

### US-8: Admin Stats Comprehensive View
**As a** store owner  
**I want to** see extensive AI insights in the admin stats page  
**So that** I can analyze overall inventory performance

**Acceptance Criteria:**
- Keep existing high-risk and top-selling lists
- Add category-level performance insights
- Show trend charts (7-day vs 30-day comparison)
- Display prediction accuracy metrics
- Include store-wide recommendations
- Export insights as PDF for reporting

---

**Status:** ✅ Requirements Approved  
**Next Step:** Create design.md with technical architecture and implementation details
