/**
 * TensorFlow.js Service for Demand Forecasting
 * Uses LSTM neural networks for time-series prediction
 */

const tf = require('@tensorflow/tfjs');
require('@tensorflow/tfjs-backend-cpu');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

/**
 * Prepare time-series data for LSTM training
 * @param {Array} salesHistory - Array of sale records
 * @param {Number} lookbackDays - Number of days to look back (sequence length)
 * @returns {Object} - Prepared tensors for training
 */
const prepareTimeSeriesData = (salesHistory, lookbackDays = 7) => {
  // Group sales by day
  const dailySales = {};
  
  salesHistory.forEach(sale => {
    const dateKey = new Date(sale.saleDate).toISOString().split('T')[0];
    if (!dailySales[dateKey]) {
      dailySales[dateKey] = 0;
    }
    dailySales[dateKey] += sale.quantitySold;
  });
  
  // Convert to array sorted by date
  const dates = Object.keys(dailySales).sort();
  const values = dates.map(date => dailySales[date]);
  
  // Need at least lookbackDays + 1 data points
  if (values.length < lookbackDays + 1) {
    return null;
  }
  
  // Normalize data (min-max scaling)
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1; // Avoid division by zero
  
  const normalized = values.map(v => (v - min) / range);
  
  // Create sequences for LSTM
  const sequences = [];
  const targets = [];
  
  for (let i = 0; i < normalized.length - lookbackDays; i++) {
    sequences.push(normalized.slice(i, i + lookbackDays));
    targets.push(normalized[i + lookbackDays]);
  }
  
  return {
    sequences,
    targets,
    min,
    max,
    range,
    originalValues: values
  };
};

/**
 * Create LSTM model for demand forecasting
 * @param {Number} lookbackDays - Sequence length
 * @returns {tf.Sequential} - Compiled TensorFlow model
 */
const createLSTMModel = (lookbackDays = 7) => {
  const model = tf.sequential();
  
  // LSTM layer
  model.add(tf.layers.lstm({
    units: 32,
    returnSequences: false,
    inputShape: [lookbackDays, 1]
  }));
  
  // Dropout for regularization
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  // Dense output layer
  model.add(tf.layers.dense({ units: 1 }));
  
  // Compile model
  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });
  
  return model;
};

/**
 * Train LSTM model on product sales data
 * @param {String} productId - Product ID
 * @param {Number} lookbackDays - Sequence length
 * @returns {Object} - Trained model and metadata
 */
const trainProductModel = async (productId, lookbackDays = 7) => {
  try {
    // Get sales history (last 90 days for better training)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const salesHistory = await Sale.find({
      productId,
      saleDate: { $gte: ninetyDaysAgo }
    }).sort({ saleDate: 1 });
    
    // Prepare data
    const data = prepareTimeSeriesData(salesHistory, lookbackDays);
    
    if (!data || data.sequences.length < 10) {
      console.log(`Insufficient data for TensorFlow training: ${productId}`);
      return null;
    }
    
    // Convert to tensors
    const xs = tf.tensor3d(
      data.sequences.map(seq => seq.map(val => [val])),
      [data.sequences.length, lookbackDays, 1]
    );
    
    const ys = tf.tensor2d(data.targets, [data.targets.length, 1]);
    
    // Create and train model
    const model = createLSTMModel(lookbackDays);
    
    console.log(`Training LSTM model for product ${productId}...`);
    
    await model.fit(xs, ys, {
      epochs: 50,
      batchSize: 8,
      validationSplit: 0.2,
      verbose: 0,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, mae = ${logs.mae.toFixed(4)}`);
          }
        }
      }
    });
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return {
      model,
      metadata: {
        lookbackDays,
        min: data.min,
        max: data.max,
        range: data.range,
        trainingDataPoints: data.sequences.length,
        lastTrainingDate: new Date()
      }
    };
    
  } catch (error) {
    console.error(`Error training model for ${productId}:`, error);
    return null;
  }
};

/**
 * Make prediction using trained LSTM model
 * @param {tf.Sequential} model - Trained model
 * @param {Array} recentSales - Recent sales data (lookbackDays length)
 * @param {Object} metadata - Model metadata (min, max, range)
 * @param {Number} forecastDays - Number of days to forecast
 * @returns {Array} - Predicted values
 */
const makePrediction = async (model, recentSales, metadata, forecastDays = 7) => {
  try {
    const { min, max, range, lookbackDays } = metadata;
    
    // Normalize recent sales
    const normalized = recentSales.map(v => (v - min) / range);
    
    const predictions = [];
    let currentSequence = [...normalized];
    
    // Iteratively predict future days
    for (let i = 0; i < forecastDays; i++) {
      // Prepare input tensor
      const inputTensor = tf.tensor3d(
        [currentSequence.slice(-lookbackDays).map(val => [val])],
        [1, lookbackDays, 1]
      );
      
      // Make prediction
      const predictionTensor = model.predict(inputTensor);
      const predictionValue = (await predictionTensor.data())[0];
      
      // Denormalize
      const denormalized = (predictionValue * range) + min;
      predictions.push(Math.max(0, Math.round(denormalized))); // Ensure non-negative
      
      // Update sequence for next prediction
      currentSequence.push(predictionValue);
      
      // Clean up tensors
      inputTensor.dispose();
      predictionTensor.dispose();
    }
    
    return predictions;
    
  } catch (error) {
    console.error('Error making prediction:', error);
    return null;
  }
};

/**
 * Get TensorFlow-based forecast for a product
 * @param {String} productId - Product ID
 * @param {Number} forecastDays - Days to forecast
 * @returns {Object} - Forecast data
 */
const getTensorFlowForecast = async (productId, forecastDays = 30) => {
  try {
    const lookbackDays = 7;
    
    // Get recent sales for prediction input
    const recentSales = await Sale.find({
      productId,
      saleDate: { $gte: new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000) }
    }).sort({ saleDate: 1 });
    
    // Check if we have enough data
    if (recentSales.length < lookbackDays) {
      console.log(`Insufficient recent data for TensorFlow prediction: ${productId}`);
      return null;
    }
    
    // Train model (in production, you'd cache/save trained models)
    const trainedModel = await trainProductModel(productId, lookbackDays);
    
    if (!trainedModel) {
      return null;
    }
    
    // Prepare recent sales data
    const dailySales = {};
    recentSales.forEach(sale => {
      const dateKey = new Date(sale.saleDate).toISOString().split('T')[0];
      if (!dailySales[dateKey]) {
        dailySales[dateKey] = 0;
      }
      dailySales[dateKey] += sale.quantitySold;
    });
    
    const dates = Object.keys(dailySales).sort();
    const recentValues = dates.slice(-lookbackDays).map(date => dailySales[date]);
    
    // Make predictions
    const predictions = await makePrediction(
      trainedModel.model,
      recentValues,
      trainedModel.metadata,
      forecastDays
    );
    
    // Clean up model
    trainedModel.model.dispose();
    
    if (!predictions) {
      return null;
    }
    
    // Calculate confidence based on training data
    const confidence = trainedModel.metadata.trainingDataPoints >= 30 ? 'high' :
                      trainedModel.metadata.trainingDataPoints >= 15 ? 'medium' : 'low';
    
    return {
      predictions,
      next7Days: predictions.slice(0, 7).reduce((a, b) => a + b, 0),
      next14Days: predictions.slice(0, 14).reduce((a, b) => a + b, 0),
      next30Days: predictions.reduce((a, b) => a + b, 0),
      confidence,
      modelType: 'LSTM',
      trainingDataPoints: trainedModel.metadata.trainingDataPoints,
      dailyPredictions: predictions
    };
    
  } catch (error) {
    console.error(`Error getting TensorFlow forecast for ${productId}:`, error);
    return null;
  }
};

/**
 * Train category-level model for fallback predictions
 * @param {String} category - Product category
 * @returns {Object} - Trained model and metadata
 */
const trainCategoryModel = async (category) => {
  try {
    // Get all products in category
    const products = await Product.find({ category });
    const productIds = products.map(p => p._id);
    
    // Get aggregated sales for category
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const categorySales = await Sale.find({
      productId: { $in: productIds },
      saleDate: { $gte: ninetyDaysAgo }
    }).sort({ saleDate: 1 });
    
    if (categorySales.length < 20) {
      console.log(`Insufficient data for category model: ${category}`);
      return null;
    }
    
    // Train model on aggregated category data
    const lookbackDays = 7;
    const data = prepareTimeSeriesData(categorySales, lookbackDays);
    
    if (!data || data.sequences.length < 10) {
      return null;
    }
    
    const xs = tf.tensor3d(
      data.sequences.map(seq => seq.map(val => [val])),
      [data.sequences.length, lookbackDays, 1]
    );
    
    const ys = tf.tensor2d(data.targets, [data.targets.length, 1]);
    
    const model = createLSTMModel(lookbackDays);
    
    console.log(`Training category model for ${category}...`);
    
    await model.fit(xs, ys, {
      epochs: 50,
      batchSize: 8,
      validationSplit: 0.2,
      verbose: 0
    });
    
    xs.dispose();
    ys.dispose();
    
    return {
      model,
      metadata: {
        category,
        lookbackDays,
        min: data.min,
        max: data.max,
        range: data.range,
        trainingDataPoints: data.sequences.length,
        lastTrainingDate: new Date()
      }
    };
    
  } catch (error) {
    console.error(`Error training category model for ${category}:`, error);
    return null;
  }
};

module.exports = {
  trainProductModel,
  getTensorFlowForecast,
  trainCategoryModel,
  makePrediction,
  prepareTimeSeriesData,
  createLSTMModel
};
