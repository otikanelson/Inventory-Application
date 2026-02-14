const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
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

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://inventory-application-xjc5.onrender.com',
        'https://frontend-domain.com'
      ]
    : true, // Allow all origins in development
  credentials: true
}));

// Use appropriate logging for production
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Increase payload limits for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
  res.json({
    message: 'InventiEase API',
    status: 'healthy',
    endpoints: {
      products: '/api/products',
      analytics: '/api/analytics',
      upload: '/api/upload',
      alerts: '/api/alerts'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/alerts', require('./routes/alertsRoutes'));

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