# AI Prediction System - Design Document

## 1. System Architecture

### 1.1 High-Level Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React Native)                  │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │  Product Cards  │  Detail Pages  │  FEFO      │
│  - Badge    │  - Colored Dots │  - Predictions │  - AI Sort │
└──────────────────────┬──────────────────────────────────────┘
                       │ Real-time WebSocket + REST API
┌──────────────────────┴──────────────────────────────────────┐
│                     Backend (Node.js/Express)                │
├─────────────────────────────────────────────────────────────┤
│  Analytics Controller  │  Prediction Service  │  Cache Layer│
│  - Quick Insights      │  - Demand Forecast   │  - Redis    │
│  - Product Predictions │  - Risk Scoring      │  - In-Memory│
│  - Category Analytics  │  - Recommendations   │             │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                     Database (MongoDB)                       │
├─────────────────────────────────────────────────────────────┤
│  Products  │  Sales  │  Predictions  │  Notifications       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Real-Time System (RTS) Architecture
**Key Requirement:** Predictions must update in real-time after every sale

**Implementation Strategy:**
1. **Event-Driven Updates**
   - Sale transaction triggers prediction recalculation
   - WebSocket broadcasts updates to connected clients
   - Optimistic UI updates for instant feedback

2. **Incremental Calculations**
   - Don't recalculate all products on every sale
   - Only update affected product + category aggregates
   - Use delta updates (add new sale, don't requery all)

3. **Background Workers**
   - Periodic full recalculation (every 5 minutes as backup)
   - Cleanup expired predictions
   - Update category-level aggregates

---

## 2. Data Models

### 2.1 Prediction Schema (New Collection)
```javascript
const PredictionSchema = new mongoose.Schema({
  productId: { type: ObjectId, ref: 'Product', required: true, index: true },
  
  // Forecast Data
  forecast: {
    next7Days: Number,
    next14Days: Number,
    next30Days: Number,
    confidence: { type: String, enum: ['high', 'medium', 'low'] }
  },
  
  // Metrics
  metrics: {
    velocity: Number,              // Units per day
    movingAverage: Number,         // 7-day moving average
    trend: { type: String, enum: ['increasing', 'stable', 'decreasing'] },
    riskScore: Number,             // 0-100
    daysUntilStockout: Number,
    salesLast30Days: Number
  },
  
  // Recommendations
  recommendations: [{
    action: String,                // 'urgent_markdown', 'restock_soon', etc.
    priority: String,              // 'critical', 'high', 'medium', 'low'
    message: String,
    icon: String
  }],
  
  // Metadata
  calculatedAt: { type: Date, default: Date.now },
  dataPoints: Number,              // Number of sales records used
  
  // Indexes
}, { 
  timestamps: true,
  indexes: [
    { productId: 1 },
    { 'metrics.riskScore': -1 },
    { calculatedAt: -1 }
  ]
});
```

### 2.2 Notification Schema (New Collection)
```javascript
const NotificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['critical_risk', 'stockout_warning', 'bulk_alert'],
    required: true 
  },
  
  productId: { type: ObjectId, ref: 'Product' },
  
  title: String,
  message: String,
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'] },
  
  actionable: {
    action: String,              // 'apply_discount', 'restock', 'review'
    params: Object               // Action-specific parameters
  },
  
  read: { type: Boolean, default: false },
  dismissed: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now, expires: 604800 } // 7 days TTL
});
```

---

## 3. Backend Implementation

### 3.1 Enhanced Prediction Service
**File:** `backend/src/services/predictiveAnalytics.js`

**New Functions:**
```javascript
// Real-time update after sale
async function updatePredictionAfterSale(productId, saleData) {
  // 1. Get current prediction from cache/DB
  // 2. Add new sale data point (incremental)
  // 3. Recalculate metrics (fast path)
  // 4. Update cache + DB
  // 5. Broadcast via WebSocket
  // 6. Check if notification needed
}

// Batch update for multiple products
async function batchUpdatePredictions(productIds) {
  // Parallel processing for efficiency
  // Update all products in category after bulk sale
}

// Get quick insights for dashboard badge
async function getQuickInsights() {
  // Return only urgent items (risk > 70 or stockout < 7)
  // Lightweight response (< 1KB)
  // Cached for 30 seconds
}

// Category-level analytics
async function getCategoryInsights(category) {
  // Aggregate predictions by category
  // Compare products within category
  // Identify category trends
}
```

### 3.2 New API Endpoints
**File:** `backend/src/routes/analyticsRoutes.js`

```javascript
// Quick insights for dashboard badge
router.get('/analytics/quick-insights', async (req, res) => {
  // Returns: { urgentCount, criticalItems: [...], lastUpdate }
});

// Full prediction for single product
router.get('/analytics/product/:id/predictions', async (req, res) => {
  // Returns: Complete prediction object with forecast, risk, recommendations
});

// Category-level insights
router.get('/analytics/category/:category/insights', async (req, res) => {
  // Returns: Category performance, top/bottom products, trends
});

// Batch predictions for multiple products
router.post('/analytics/batch-predictions', async (req, res) => {
  // Body: { productIds: [...] }
  // Returns: Array of predictions
});

// Trigger notification
router.post('/analytics/notifications', async (req, res) => {
  // Create and send push notification
});

// Get user notifications
router.get('/analytics/notifications', async (req, res) => {
  // Returns: User's unread notifications
});

// Mark notification as read
router.patch('/analytics/notifications/:id/read', async (req, res) => {
  // Update notification status
});
```

### 3.3 WebSocket Integration
**File:** `backend/src/services/websocket.js` (New)

```javascript
const io = require('socket.io')(server);

// Broadcast prediction update
function broadcastPredictionUpdate(productId, prediction) {
  io.emit('prediction:update', {
    productId,
    prediction,
    timestamp: Date.now()
  });
}

// Broadcast urgent alert
function broadcastUrgentAlert(alert) {
  io.emit('alert:urgent', alert);
}

// Client connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Subscribe to specific product updates
  socket.on('subscribe:product', (productId) => {
    socket.join(`product:${productId}`);
  });
  
  // Unsubscribe
  socket.on('unsubscribe:product', (productId) => {
    socket.leave(`product:${productId}`);
  });
});
```

### 3.4 Caching Strategy
**Implementation:** In-memory cache with Redis fallback

```javascript
const NodeCache = require('node-cache');
const predictionCache = new NodeCache({ 
  stdTTL: 60,           // 1 minute default TTL
  checkperiod: 10       // Check for expired keys every 10s
});

// Cache keys
const CACHE_KEYS = {
  quickInsights: 'quick:insights',
  productPrediction: (id) => `product:${id}:prediction`,
  categoryInsights: (cat) => `category:${cat}:insights`,
  dashboardData: 'dashboard:data'
};

// Cache invalidation on sale
function invalidatePredictionCache(productId, category) {
  predictionCache.del(CACHE_KEYS.productPrediction(productId));
  predictionCache.del(CACHE_KEYS.categoryInsights(category));
  predictionCache.del(CACHE_KEYS.quickInsights);
  predictionCache.del(CACHE_KEYS.dashboardData);
}
```

---

## 4. Frontend Implementation

### 4.1 New Custom Hook: `useAIPredictions`
**File:** `hooks/useAIPredictions.ts`

```typescript
export const useAIPredictions = (productId?: string) => {
  const [predictions, setPredictions] = useState<Prediction | null>(null);
  const [quickInsights, setQuickInsights] = useState<QuickInsights | null>(null);
  const [loading, setLoading] = useState(true);
  
  // WebSocket connection
  useEffect(() => {
    const socket = io(process.env.EXPO_PUBLIC_API_URL);
    
    // Subscribe to updates
    if (productId) {
      socket.emit('subscribe:product', productId);
      
      socket.on('prediction:update', (data) => {
        if (data.productId === productId) {
          setPredictions(data.prediction);
        }
      });
    }
    
    // Listen for urgent alerts
    socket.on('alert:urgent', (alert) => {
      // Show push notification
      showNotification(alert);
    });
    
    return () => {
      if (productId) {
        socket.emit('unsubscribe:product', productId);
      }
      socket.disconnect();
    };
  }, [productId]);
  
  // Fetch initial data
  const fetchPredictions = async () => {
    if (!productId) return;
    
    try {
      const response = await axios.get(
        `${API_URL}/analytics/product/${productId}/predictions`
      );
      setPredictions(response.data);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch quick insights for dashboard
  const fetchQuickInsights = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/quick-insights`);
      setQuickInsights(response.data);
    } catch (error) {
      console.error('Failed to fetch quick insights:', error);
    }
  };
  
  return {
    predictions,
    quickInsights,
    loading,
    refresh: fetchPredictions,
    refreshQuickInsights: fetchQuickInsights
  };
};
```

### 4.2 Dashboard AI Badge Component
**File:** `components/AIInsightsBadge.tsx`

```typescript
export const AIInsightsBadge = () => {
  const { theme } = useTheme();
  const { quickInsights } = useAIPredictions();
  const [expanded, setExpanded] = useState(false);
  
  const urgentCount = quickInsights?.urgentCount || 0;
  const criticalItems = quickInsights?.criticalItems || [];
  
  return (
    <Pressable 
      onPress={() => setExpanded(!expanded)}
      style={[styles.badge, { backgroundColor: theme.surface }]}
    >
      {/* Badge Header */}
      <View style={styles.badgeHeader}>
        <Ionicons name="bulb" size={16} color={theme.primary} />
        <Text style={[styles.badgeTitle, { color: theme.text }]}>
          AI Insights
        </Text>
        {urgentCount > 0 && (
          <View style={[styles.urgentDot, { backgroundColor: '#FF4444' }]}>
            <Text style={styles.urgentCount}>{urgentCount}</Text>
          </View>
        )}
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={theme.subtext} 
        />
      </View>
      
      {/* Expanded Content */}
      {expanded && (
        <View style={styles.badgeContent}>
          {criticalItems.slice(0, 3).map((item) => (
            <View key={item.productId} style={styles.insightItem}>
              <View style={[styles.riskDot, { backgroundColor: getRiskColor(item.riskScore) }]} />
              <Text style={[styles.insightText, { color: theme.text }]}>
                {item.productName}: {item.recommendation}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
};
```

### 4.3 Product Card Risk Dot
**File:** `components/ProductCard.tsx` (Enhancement)

```typescript
// Add to existing ProductCard component
const { predictions } = useAIPredictions(item._id);
const riskScore = predictions?.metrics?.riskScore || 0;

// In render:
<View style={styles.card}>
  {/* Existing card content */}
  
  {/* Risk Indicator Dot */}
  {riskScore > 0 && (
    <View 
      style={[
        styles.riskDot, 
        { backgroundColor: getRiskColor(riskScore) }
      ]} 
    />
  )}
</View>

// Styles
const styles = StyleSheet.create({
  riskDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  }
});
```

### 4.4 Product Detail Prediction Card
**File:** `components/PredictionCard.tsx` (New)

```typescript
export const PredictionCard = ({ productId }: { productId: string }) => {
  const { theme } = useTheme();
  const { predictions, loading } = useAIPredictions(productId);
  const [expanded, setExpanded] = useState(false);
  
  if (loading) return <PredictionCardSkeleton />;
  if (!predictions) return null;
  
  const { forecast, metrics, recommendations } = predictions;
  const confidence = forecast.confidence;
  
  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      {/* Header */}
      <Pressable 
        onPress={() => setExpanded(!expanded)}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={18} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>
            AI Predictions
          </Text>
          {confidence === 'low' && (
            <View style={[styles.warningBadge, { backgroundColor: '#FF9500' + '20' }]}>
              <Text style={[styles.warningText, { color: '#FF9500' }]}>
                Low Confidence
              </Text>
            </View>
          )}
        </View>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={16} 
          color={theme.subtext} 
        />
      </Pressable>
      
      {/* Expanded Content */}
      {expanded && (
        <View style={styles.content}>
          {/* Forecast */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.subtext }]}>
              Demand Forecast
            </Text>
            <View style={styles.forecastGrid}>
              <ForecastItem label="7 Days" value={forecast.next7Days} />
              <ForecastItem label="14 Days" value={forecast.next14Days} />
              <ForecastItem label="30 Days" value={forecast.next30Days} />
            </View>
          </View>
          
          {/* Risk Score */}
          {metrics.riskScore > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.subtext }]}>
                Expiry Risk
              </Text>
              <View style={styles.riskMeter}>
                <View 
                  style={[
                    styles.riskFill, 
                    { 
                      width: `${metrics.riskScore}%`,
                      backgroundColor: getRiskColor(metrics.riskScore)
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.riskText, { color: theme.text }]}>
                {metrics.riskScore}/100 - {getRiskLabel(metrics.riskScore)}
              </Text>
            </View>
          )}
          
          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.subtext }]}>
                Recommendations
              </Text>
              {recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendation}>
                  <Ionicons name={rec.icon} size={16} color={getPriorityColor(rec.priority)} />
                  <Text style={[styles.recText, { color: theme.text }]}>
                    {rec.message}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
};
```

### 4.5 FEFO AI Sorting
**File:** `app/(tabs)/FEFO.tsx` (Enhancement)

```typescript
// Add sort option
const [sortBy, setSortBy] = useState<'expiry' | 'ai-risk'>('expiry');

// Fetch predictions for all products
const { predictions: allPredictions } = useAIPredictions();

// Sort logic
const sortedProducts = useMemo(() => {
  if (sortBy === 'ai-risk') {
    return [...products].sort((a, b) => {
      const aRisk = allPredictions?.[a._id]?.metrics?.riskScore || 0;
      const bRisk = allPredictions?.[b._id]?.metrics?.riskScore || 0;
      return bRisk - aRisk; // Highest risk first
    });
  }
  // Default expiry sort
  return [...products].sort((a, b) => 
    new Date(a.expiryDate) - new Date(b.expiryDate)
  );
}, [products, sortBy, allPredictions]);

// UI
<View style={styles.sortButtons}>
  <Pressable 
    onPress={() => setSortBy('expiry')}
    style={[styles.sortBtn, sortBy === 'expiry' && styles.sortBtnActive]}
  >
    <Text>By Expiry</Text>
  </Pressable>
  <Pressable 
    onPress={() => setSortBy('ai-risk')}
    style={[styles.sortBtn, sortBy === 'ai-risk' && styles.sortBtnActive]}
  >
    <Ionicons name="analytics" size={14} />
    <Text>By AI Risk</Text>
  </Pressable>
</View>
```

---

## 5. Push Notifications

### 5.1 Notification Service
**File:** `backend/src/services/notificationService.js` (New)

```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send push notification
async function sendPushNotification(userId, notification) {
  const message = {
    notification: {
      title: notification.title,
      body: notification.message,
    },
    data: {
      type: notification.type,
      productId: notification.productId?.toString(),
      action: notification.actionable?.action
    },
    token: userDeviceToken // Get from user profile
  };
  
  try {
    await admin.messaging().send(message);
    console.log('Notification sent successfully');
  } catch (error) {
    console.error('Notification failed:', error);
  }
}

// Check if notification should be sent
function shouldSendNotification(prediction) {
  const { metrics, recommendations } = prediction;
  
  // Critical risk
  if (metrics.riskScore >= 70) {
    return {
      type: 'critical_risk',
      title: 'Urgent: Product Expiring Soon',
      message: `${prediction.productName} has high expiry risk. ${recommendations[0]?.message}`,
      priority: 'critical'
    };
  }
  
  // Stockout warning
  if (metrics.daysUntilStockout <= 3) {
    return {
      type: 'stockout_warning',
      title: 'Low Stock Alert',
      message: `${prediction.productName} will run out in ${metrics.daysUntilStockout} days`,
      priority: 'high'
    };
  }
  
  return null;
}
```

### 5.2 Frontend Notification Handler
**File:** `hooks/useNotifications.ts` (New)

```typescript
import * as Notifications from 'expo-notifications';

export const useNotifications = () => {
  useEffect(() => {
    // Request permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Notification permissions denied');
      }
    };
    
    requestPermissions();
    
    // Handle notification received
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });
    
    // Handle notification tapped
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Navigate to product detail
      if (data.productId) {
        router.push(`/product/${data.productId}`);
      }
    });
    
    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);
};
```

---

## 6. Performance Optimizations

### 6.1 Incremental Updates
```javascript
// Instead of recalculating from scratch
async function incrementalPredictionUpdate(productId, newSale) {
  const currentPrediction = await Prediction.findOne({ productId });
  
  if (!currentPrediction) {
    // First sale - do full calculation
    return await calculateFullPrediction(productId);
  }
  
  // Update metrics incrementally
  const updatedMetrics = {
    ...currentPrediction.metrics,
    velocity: calculateNewVelocity(currentPrediction.metrics.velocity, newSale),
    salesLast30Days: currentPrediction.metrics.salesLast30Days + newSale.quantity
  };
  
  // Only recalculate risk if needed
  if (shouldRecalculateRisk(updatedMetrics)) {
    updatedMetrics.riskScore = await calculateRiskScore(productId, updatedMetrics);
  }
  
  currentPrediction.metrics = updatedMetrics;
  currentPrediction.calculatedAt = new Date();
  await currentPrediction.save();
  
  return currentPrediction;
}
```

### 6.2 Batch Processing
```javascript
// Process multiple products in parallel
async function batchUpdatePredictions(productIds) {
  const promises = productIds.map(id => 
    updatePredictionAfterSale(id).catch(err => {
      console.error(`Failed to update ${id}:`, err);
      return null;
    })
  );
  
  const results = await Promise.all(promises);
  return results.filter(r => r !== null);
}
```

### 6.3 Database Indexes
```javascript
// Ensure optimal query performance
db.predictions.createIndex({ productId: 1 });
db.predictions.createIndex({ 'metrics.riskScore': -1 });
db.predictions.createIndex({ calculatedAt: -1 });
db.sales.createIndex({ productId: 1, saleDate: -1 });
```

---

## 7. Error Handling & Fallbacks

### 7.1 Graceful Degradation
```typescript
// If predictions fail to load, app still works
const { predictions, loading, error } = useAIPredictions(productId);

if (error) {
  // Show basic product info without predictions
  return <ProductDetailWithoutAI product={product} />;
}

if (loading) {
  // Show skeleton loader
  return <PredictionCardSkeleton />;
}

// Show full predictions
return <PredictionCard predictions={predictions} />;
```

### 7.2 Low Data Handling
```javascript
// When insufficient sales data
function calculatePredictionWithFallback(product, salesHistory) {
  if (salesHistory.length < 3) {
    // Use category average as baseline
    const categoryAvg = await getCategoryAverageSales(product.category);
    
    return {
      forecast: {
        next7Days: Math.round(categoryAvg * 7),
        next14Days: Math.round(categoryAvg * 14),
        next30Days: Math.round(categoryAvg * 30),
        confidence: 'low'
      },
      warning: `Only ${salesHistory.length} days of sales data. Using category average.`
    };
  }
  
  // Normal calculation
  return calculateNormalPrediction(salesHistory);
}
```

---

## 8. Testing Strategy

### 8.1 Unit Tests
```javascript
// Test prediction calculations
describe('Prediction Service', () => {
  test('calculates velocity correctly', () => {
    const sales = [
      { quantitySold: 5, saleDate: '2024-01-01' },
      { quantitySold: 3, saleDate: '2024-01-02' },
      { quantitySold: 7, saleDate: '2024-01-03' }
    ];
    
    const velocity = calculateVelocity(sales, 3);
    expect(velocity).toBe(5); // (5+3+7)/3 = 5
  });
  
  test('handles low confidence predictions', () => {
    const sales = [{ quantitySold: 2, saleDate: '2024-01-01' }];
    const prediction = calculatePrediction(sales);
    
    expect(prediction.forecast.confidence).toBe('low');
    expect(prediction.warning).toBeDefined();
  });
});
```

### 8.2 Integration Tests
```javascript
// Test real-time updates
describe('Real-time Prediction Updates', () => {
  test('updates prediction after sale', async () => {
    const productId = 'test-product-123';
    
    // Make a sale
    await processSale({ productId, quantity: 5 });
    
    // Wait for prediction update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check prediction was updated
    const prediction = await Prediction.findOne({ productId });
    expect(prediction.calculatedAt).toBeGreaterThan(Date.now() - 1000);
  });
});
```

---

## 9. Deployment Checklist

### 9.1 Backend
- [ ] Deploy updated prediction service
- [ ] Set up WebSocket server
- [ ] Configure Redis cache
- [ ] Add database indexes
- [ ] Set up Firebase Admin SDK
- [ ] Configure notification service
- [ ] Test API endpoints
- [ ] Monitor performance

### 9.2 Frontend
- [ ] Update ProductCard component
- [ ] Add AIInsightsBadge to dashboard
- [ ] Implement PredictionCard component
- [ ] Add FEFO AI sorting
- [ ] Set up WebSocket connection
- [ ] Configure push notifications
- [ ] Test real-time updates
- [ ] Add loading states

### 9.3 Database
- [ ] Create Prediction collection
- [ ] Create Notification collection
- [ ] Add indexes
- [ ] Migrate existing data
- [ ] Set up TTL for notifications

---

## 10. Monitoring & Analytics

### 10.1 Key Metrics to Track
- Prediction calculation time (target: < 100ms)
- WebSocket connection stability
- Cache hit rate (target: > 80%)
- Notification delivery rate
- User engagement with predictions
- Prediction accuracy over time

### 10.2 Logging
```javascript
// Log prediction updates
logger.info('Prediction updated', {
  productId,
  riskScore: prediction.metrics.riskScore,
  calculationTime: Date.now() - startTime,
  dataPoints: prediction.dataPoints
});

// Log notification sent
logger.info('Notification sent', {
  type: notification.type,
  productId: notification.productId,
  priority: notification.priority
});
```

---

**Status:** ✅ Design Complete  
**Next Step:** Create tasks.md with implementation breakdown
