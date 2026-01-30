const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const colors = require('colors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();
connectDB(); // Connect to Atlas

const app = express();
app.use(express.json());

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('InventiEase API is running...');
});

const PORT = process.env.PORT || 5000;

// Routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/upload', require('./routes/uploadRoutes'));

app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/alerts', require('./routes/alertsRoutes'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`.yellow.bold));