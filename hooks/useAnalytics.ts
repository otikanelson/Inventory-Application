import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface AnalyticsSummary {
  totalProducts: number;
  highRiskProducts: number;
  mediumRiskProducts: number;
  lowRiskProducts: number;
  totalSales: number;
  totalUnitsSold: number;
  averageVelocity: number;
  topRiskProducts: any[];
  topSellingProducts: any[];
}

interface DashboardAnalytics {
  summary: AnalyticsSummary;
  productAnalytics: any[];
}

export const useAnalytics = () => {
  const [dashboardData, setDashboardData] = useState<DashboardAnalytics | null>(null);
  const [salesTrends, setSalesTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/analytics`;

  /** Fetch Dashboard Analytics */
  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/dashboard`);
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to load analytics");
      console.error("Analytics Error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /** Fetch Sales Trends */
  const fetchSalesTrends = useCallback(async (days: number = 30) => {
    try {
      const response = await axios.get(`${API_URL}/sales-trends?days=${days}`);
      setSalesTrends(response.data.data);
    } catch (err) {
      console.error("Sales Trends Error:", err);
    }
  }, [API_URL]);

  /** Get Product-Specific Analytics */
  const getProductAnalytics = async (productId: string) => {
    try {
      const response = await axios.get(`${API_URL}/product/${productId}`);
      return response.data.data;
    } catch (err) {
      console.error(`Product Analytics Error for ${productId}:`, err);
      return null;
    }
  };

  /** Record a Sale */
  const recordSale = async (saleData: {
    productId: string;
    quantitySold: number;
    priceAtSale: number;
    paymentMethod?: string;
  }) => {
    try {
      const response = await axios.post(`${API_URL}/record-sale`, saleData);
      return response.data;
    } catch (err) {
      console.error("Record Sale Error:", err);
      throw err;
    }
  };

  /** Initial load */
  useEffect(() => {
    fetchDashboard();
    fetchSalesTrends(30);
  }, [fetchDashboard, fetchSalesTrends]);

  return {
    dashboardData,
    salesTrends,
    loading,
    error,
    refresh: fetchDashboard,
    fetchSalesTrends,
    getProductAnalytics,
    recordSale
  };
};