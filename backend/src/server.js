const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Try to connect to MongoDB, but don't block server startup
connectDB().catch(err => {
  console.error('⚠️  Server starting without MongoDB connection');
  console.error('⚠️  Database operations will fail until connection is established');
});

const app = express();

// Middleware - Allow all origins for mobile app
app.use(cors({
  origin: true, // Allow all origins (required for mobile apps)
  credentials: true
}));

// Enable gzip compression for faster responses
app.use(compression());

// Use appropriate logging for production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Increase payload limits for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body keys:', Object.keys(req.body));
  }
  next();
});

// Serve static files from uploads directory (for local development only)
// In production, Cloudinary handles all images
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
}

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'InventiEase API is running...',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    storage: process.env.CLOUDINARY_CLOUD_NAME ? 'Cloudinary (Production Ready)' : 'Local (Development Only)',
    cloudinary_configured: !!process.env.CLOUDINARY_CLOUD_NAME
  });
});

// API status endpoint
app.get('/api', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  
  res.json({
    message: 'InventiEase API',
    status: 'healthy',
    mongodb: {
      state: stateMap[dbState],
      connected: dbState === 1,
      uri_set: !!process.env.MONGO_URI
    },
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      analytics: '/api/analytics',
      upload: '/api/upload',
      alerts: '/api/alerts',
      categories: '/api/categories'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/author', require('./routes/authorRoutes'));
app.use('/api/stores', require('./routes/storeRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/alerts', require('./routes/alertsRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Lightweight health check for uptime monitoring (must be after other routes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// MongoDB connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const stateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    if (dbState !== 1) {
      return res.json({
        success: false,
        mongoState: stateMap[dbState],
        message: 'MongoDB not connected',
        mongoUri: process.env.MONGO_URI ? 'Set (hidden)' : 'NOT SET'
      });
    }

    // Try to query the database
    const User = require('./models/User');
    const userCount = await User.countDocuments();

    res.json({
      success: true,
      mongoState: stateMap[dbState],
      message: 'MongoDB connected successfully',
      userCount,
      dbName: mongoose.connection.name,
      host: mongoose.connection.host
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      mongoUri: process.env.MONGO_URI ? 'Set (hidden)' : 'NOT SET'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
});

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Create HTTP server for WebSocket integration
const http = require('http');
const server = http.createServer(app);

// Initialize WebSocket
const { initializeWebSocket } = require('./services/websocketService');
initializeWebSocket(server);

// Cache warming function
const warmupCache = async () => {
  try {
    console.log('🔥 Starting cache warmup...');
    
    const { getQuickInsights, batchUpdatePredictions } = require('./services/predicitveAnalytics');
    const cacheService = require('./services/cacheService');
    const Product = require('./models/Product');
    
    // Warm up quick insights (dashboard)
    await cacheService.getOrSet(
      cacheService.CACHE_KEYS.quickInsights,
      async () => await getQuickInsights(),
      30
    );
    
    // Get all active products
    const products = await Product.find().limit(50); // Limit to top 50 for initial warmup
    const productIds = products.map(p => p._id.toString());
    
    // Batch update predictions (creates if not exists)
    if (productIds.length > 0) {
      await batchUpdatePredictions(productIds);
      console.log(`✅ Cache warmed with ${productIds.length} product predictions`);
    }
    
    console.log('✅ Cache warmup completed');
  } catch (error) {
    console.error('❌ Cache warmup failed:', error.message);
  }
};

// Schedule cache refresh every 5 minutes
const scheduleCacheRefresh = () => {
  setInterval(async () => {
    console.log('🔄 Refreshing cache...');
    await warmupCache();
  }, 5 * 60 * 1000); // 5 minutes
};

server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Storage: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Cloudinary (Production Ready)' : 'Local (Development Only)'}`);
  console.log(`Cloudinary Status: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '❌ Not Configured'}`);
  console.log(`WebSocket: ✅ Enabled (Real-time predictions active)`);
  
  // Warm up cache on startup (after a short delay to let DB connect)
  setTimeout(async () => {
    await warmupCache();
    scheduleCacheRefresh();
  }, 3000); // 3 second delay
});