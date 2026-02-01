const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const colors = require('colors');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();
connectDB(); // Connect to Atlas

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] // Add your frontend domain if you have one
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

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'InventiEase API is running...',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.yellow.bold);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`.cyan);
});