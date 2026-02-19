/**
 * Custom hook for AI Predictions
 * Handles fetching predictions, quick insights, and real-time WebSocket updates
 */

import axios from 'axios';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  CategoryInsights,
  DashboardUpdatePayload,
  Prediction,
  PredictionUpdatePayload,
  QuickInsights
} from '../types/ai-predictions';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
const WS_URL = API_URL.replace('/api', '').replace('http', 'ws');

interface UseAIPredictionsOptions {
  productId?: string;
  enableWebSocket?: boolean;
  autoFetch?: boolean;
}

export const useAIPredictions = (options: UseAIPredictionsOptions = {}) => {
  const { productId, enableWebSocket = true, autoFetch = true } = options;

  // State
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [quickInsights, setQuickInsights] = useState<QuickInsights | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // WebSocket ref
  const socketRef = useRef<Socket | null>(null);

  /**
   * Fetch prediction for a single product
   */
  const fetchPrediction = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/analytics/product/${id}/predictions`);
      
      if (response.data.success) {
        setPrediction(response.data.data);
      } else {
        setError('Failed to fetch prediction');
      }
    } catch (err: any) {
      console.error('Error fetching prediction:', err);
      setError(err.response?.data?.message || 'Failed to fetch prediction');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch quick insights for dashboard
   */
  const fetchQuickInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${API_URL}/analytics/quick-insights`);
      
      if (response.data.success) {
        setQuickInsights(response.data.data);
      } else {
        setError('Failed to fetch quick insights');
      }
    } catch (err: any) {
      console.error('Error fetching quick insights:', err);
      setError(err.response?.data?.message || 'Failed to fetch quick insights');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch category insights
   */
  const fetchCategoryInsights = useCallback(async (category: string): Promise<CategoryInsights | null> => {
    try {
      const response = await axios.get(`${API_URL}/analytics/category/${category}/insights`);
      
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err: any) {
      console.error('Error fetching category insights:', err);
      return null;
    }
  }, []);

  /**
   * Fetch batch predictions for multiple products
   */
  const fetchBatchPredictions = useCallback(async (productIds: string[]): Promise<Prediction[]> => {
    try {
      const response = await axios.post(`${API_URL}/analytics/batch-predictions`, {
        productIds
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (err: any) {
      console.error('Error fetching batch predictions:', err);
      return [];
    }
  }, []);

  /**
   * Manually trigger prediction recalculation
   */
  const recalculatePrediction = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${API_URL}/analytics/recalculate/${id}`);
      
      if (response.data.success) {
        setPrediction(response.data.data);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error recalculating prediction:', err);
      setError(err.response?.data?.message || 'Failed to recalculate prediction');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Initialize WebSocket connection
   */
  useEffect(() => {
    if (!enableWebSocket) return;

    // Skip WebSocket in production if backend doesn't support it
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !WS_URL.includes('wss://')) {
      console.log('WebSocket disabled in production (no secure connection available)');
      return;
    }

    let socket: Socket | null = null;

    try {
      // Create socket connection with better error handling
      socket = io(WS_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 3, // Reduced from 5 to avoid excessive retries
        timeout: 10000, // 10 second timeout
        autoConnect: true,
      });

      socketRef.current = socket;

      // Connection handlers
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);

        // Subscribe to dashboard updates
        socket.emit('subscribe:dashboard');

        // Subscribe to product updates if productId is provided
        if (productId) {
          socket.emit('subscribe:product', productId);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.warn('WebSocket connection error (non-critical):', error.message);
        setIsConnected(false);
        // Don't set error state - WebSocket is optional
      });

      socket.on('error', (error) => {
        console.warn('WebSocket error (non-critical):', error);
        // Don't set error state - WebSocket is optional
      });

      // Prediction update handler
      socket.on('prediction:update', (payload: PredictionUpdatePayload) => {
        console.log('Received prediction update:', payload);
        
        // Update prediction if it matches current productId
        if (productId && payload.productId === productId) {
          setPrediction((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              forecast: payload.prediction.forecast,
              metrics: payload.prediction.metrics,
              recommendations: payload.prediction.recommendations,
              warning: payload.prediction.warning,
              calculatedAt: new Date().toISOString()
            };
          });
        }
      });

      // Dashboard update handler
      socket.on('dashboard:update', (payload: DashboardUpdatePayload) => {
        console.log('Received dashboard update:', payload);
        setQuickInsights(payload.insights);
      });

      // Urgent prediction handler
      socket.on('prediction:urgent', (payload: PredictionUpdatePayload) => {
        console.log('Received urgent prediction:', payload);
        // Refresh quick insights when urgent prediction is received
        fetchQuickInsights();
      });
    } catch (err) {
      console.warn('Failed to initialize WebSocket (non-critical):', err);
      // Don't set error state - WebSocket is optional
    }

    // Cleanup
    return () => {
      try {
        if (socket) {
          if (productId) {
            socket.emit('unsubscribe:product', productId);
          }
          socket.emit('unsubscribe:dashboard');
          socket.disconnect();
        }
      } catch (err) {
        console.warn('Error during WebSocket cleanup:', err);
      }
    };
  }, [enableWebSocket, productId, fetchQuickInsights]);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (!autoFetch) return;

    if (productId) {
      fetchPrediction(productId);
    } else {
      fetchQuickInsights();
    }
  }, [autoFetch, productId, fetchPrediction, fetchQuickInsights]);

  /**
   * Subscribe to product updates when productId changes
   */
  useEffect(() => {
    if (!enableWebSocket || !socketRef.current || !socketRef.current.connected) return;

    const socket = socketRef.current;

    // Unsubscribe from previous product
    if (productId) {
      socket.emit('subscribe:product', productId);
    }

    return () => {
      if (productId) {
        socket.emit('unsubscribe:product', productId);
      }
    };
  }, [productId, enableWebSocket]);

  return {
    // State
    prediction,
    quickInsights,
    loading,
    error,
    isConnected,

    // Actions
    fetchPrediction,
    fetchQuickInsights,
    fetchCategoryInsights,
    fetchBatchPredictions,
    recalculatePrediction,

    // Utilities
    refetch: productId ? () => fetchPrediction(productId) : fetchQuickInsights
  };
};
