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
app.use(express.json()); // Allows the server to read JSON from the frontend
app.use(cors());         // Allows your Expo app to communicate with this server
app.use(morgan('dev'));  // Logs API requests to the terminal

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('InventiEase API is running...');
});

const PORT = process.env.PORT || 5000;

app.use('/api/products', require('./routes/productRoutes'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`.yellow.bold));
