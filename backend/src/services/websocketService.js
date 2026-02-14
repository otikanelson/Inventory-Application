const { Server } = require('socket.io');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 */
const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Configure this properly in production
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Connection handling
  io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);
    
    // Subscribe to product updates
    socket.on('subscribe:product', (productId) => {
      socket.join(`product:${productId}`);
      console.log(`Client ${socket.id} subscribed to product ${productId}`);
    });
    
    // Unsubscribe from product updates
    socket.on('unsubscribe:product', (productId) => {
      socket.leave(`product:${productId}`);
      console.log(`Client ${socket.id} unsubscribed from product ${productId}`);
    });
    
    // Subscribe to dashboard updates
    socket.on('subscribe:dashboard', () => {
      socket.join('dashboard');
      console.log(`Client ${socket.id} subscribed to dashboard`);
    });
    
    // Unsubscribe from dashboard updates
    socket.on('unsubscribe:dashboard', () => {
      socket.leave('dashboard');
      console.log(`Client ${socket.id} unsubscribed from dashboard`);
    });
    
    // Subscribe to category updates
    socket.on('subscribe:category', (category) => {
      socket.join(`category:${category}`);
      console.log(`Client ${socket.id} subscribed to category ${category}`);
    });
    
    // Unsubscribe from category updates
    socket.on('unsubscribe:category', (category) => {
      socket.leave(`category:${category}`);
      console.log(`Client ${socket.id} unsubscribed from category ${category}`);
    });
    
    // Disconnection handling
    socket.on('disconnect', (reason) => {
      console.log(`Client ${socket.id} disconnected: ${reason}`);
    });
    
    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log('WebSocket server initialized');
  return io;
};

/**
 * Broadcast prediction update to subscribed clients
 * @param {String} productId - Product ID
 * @param {Object} prediction - Updated prediction data
 */
const broadcastPredictionUpdate = (productId, prediction) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }
  
  try {
    const payload = {
      productId,
      prediction: {
        forecast: prediction.forecast,
        metrics: prediction.metrics,
        recommendations: prediction.recommendations,
        warning: prediction.warning
      },
      timestamp: Date.now()
    };
    
    // Broadcast to product-specific room
    io.to(`product:${productId}`).emit('prediction:update', payload);
    
    // Also broadcast to dashboard if it's an urgent update
    if (prediction.metrics.riskScore >= 70 || prediction.metrics.daysUntilStockout <= 7) {
      io.to('dashboard').emit('prediction:urgent', payload);
    }
    
    console.log(`Broadcasted prediction update for product ${productId}`);
  } catch (error) {
    console.error('Error broadcasting prediction update:', error);
  }
};

/**
 * Broadcast urgent alert to all connected clients
 * @param {Object} alert - Alert data
 */
const broadcastUrgentAlert = (alert) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }
  
  try {
    io.emit('alert:urgent', {
      ...alert,
      timestamp: Date.now()
    });
    
    console.log(`Broadcasted urgent alert: ${alert.title}`);
  } catch (error) {
    console.error('Error broadcasting urgent alert:', error);
  }
};

/**
 * Broadcast dashboard update (quick insights)
 * @param {Object} insights - Quick insights data
 */
const broadcastDashboardUpdate = (insights) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }
  
  try {
    io.to('dashboard').emit('dashboard:update', {
      insights,
      timestamp: Date.now()
    });
    
    console.log('Broadcasted dashboard update');
  } catch (error) {
    console.error('Error broadcasting dashboard update:', error);
  }
};

/**
 * Broadcast category insights update
 * @param {String} category - Category name
 * @param {Object} insights - Category insights data
 */
const broadcastCategoryUpdate = (category, insights) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }
  
  try {
    io.to(`category:${category}`).emit('category:update', {
      category,
      insights,
      timestamp: Date.now()
    });
    
    console.log(`Broadcasted category update for ${category}`);
  } catch (error) {
    console.error('Error broadcasting category update:', error);
  }
};

/**
 * Broadcast notification to user
 * @param {String} userId - User ID
 * @param {Object} notification - Notification data
 */
const broadcastNotification = (userId, notification) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }
  
  try {
    // For now, broadcast to all (single-user app)
    // In multi-user setup, use: io.to(`user:${userId}`).emit(...)
    io.emit('notification:new', {
      notification,
      timestamp: Date.now()
    });
    
    console.log(`Broadcasted notification: ${notification.title}`);
  } catch (error) {
    console.error('Error broadcasting notification:', error);
  }
};

/**
 * Get connected clients count
 * @returns {Number} Number of connected clients
 */
const getConnectedClientsCount = () => {
  if (!io) return 0;
  return io.engine.clientsCount;
};

/**
 * Get room members count
 * @param {String} room - Room name
 * @returns {Number} Number of clients in room
 */
const getRoomMembersCount = (room) => {
  if (!io) return 0;
  const roomSockets = io.sockets.adapter.rooms.get(room);
  return roomSockets ? roomSockets.size : 0;
};

/**
 * Disconnect all clients (for maintenance)
 */
const disconnectAll = () => {
  if (!io) return;
  
  io.disconnectSockets();
  console.log('All WebSocket clients disconnected');
};

/**
 * Get WebSocket instance
 * @returns {Object} Socket.IO instance
 */
const getIO = () => {
  return io;
};

module.exports = {
  initializeWebSocket,
  broadcastPredictionUpdate,
  broadcastUrgentAlert,
  broadcastDashboardUpdate,
  broadcastCategoryUpdate,
  broadcastNotification,
  getConnectedClientsCount,
  getRoomMembersCount,
  disconnectAll,
  getIO
};
