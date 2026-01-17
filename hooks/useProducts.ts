// Goal: Create a custom React Hook to manage product inventory with TypeScript support.
// Features:
// - Registry Sync: Fetch all products from the backend and maintain global inventory state.
// - Type Safety: Define strict TypeScript interfaces for Product and Batch entities.
// - Batch Tracking: Support nested arrays for multiple batches (batch number, qty, expiry) per product.
// - Auto-Aggregation: Sum individual batch quantities to show total product stock.
// - Internal Coding: Handle the hasBarcode flag to distinguish between UPC and system-generated IDs.
// - Detail Fetching: Provide a method to retrieve a single product's full history for the View page.
// - State Management: Export loading, error, and manual refresh functions for UI control.

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

/** Types & Interfaces **/
export interface Batch {
  batchNumber: string;
  quantity: number;
  expiryDate: string;
}

export interface Product {
  _id: string;
  name: string;
  category?: string;
  totalQuantity: number;
  imageUrl?: string;
  isPerishable: boolean;
  batches: Batch[];
  barcode: string;
  hasBarcode: boolean;
  updatedAt: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/products`;

  /** Fetch & Transform Data **/
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL);
      const rawData = response.data.data || [];
      
      // Transform: Use totalQuantity from backend (calculated via pre-save hook)
      const formattedData = rawData.map((p: any) => ({
        ...p,
        // Backend already calculates totalQuantity, but ensure it exists
        totalQuantity: p.totalQuantity ?? p.batches?.reduce((acc: number, b: Batch) => acc + b.quantity, 0) ?? 0
      }));

      setProducts(formattedData);
      setError(null);
    } catch (err) {
      setError("SYNC_FAILURE: UNABLE_TO_REACH_REGISTRY");
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /** Real-Time Analytics (Memoized for performance) **/
  const inventoryStats = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return {
      totalSkus: products.length,
      totalUnits: products.reduce((acc, p) => acc + p.totalQuantity, 0),
      lowStockCount: products.filter(p => p.totalQuantity > 0 && p.totalQuantity < 10).length,
      expiringSoonCount: products.filter(p => 
        p.batches.some(b => {
          const exp = new Date(b.expiryDate);
          return exp > now && exp <= thirtyDaysFromNow;
        })
      ).length,
      outOfStockCount: products.filter(p => p.totalQuantity === 0).length,
    };
  }, [products]);

  /** Unified Detail Fetcher (ID or Barcode) **/
  const getProductById = async (identifier: string): Promise<Product | null> => {
    try {
      const response = await axios.get(`${API_URL}/${identifier}`);
      const item = response.data.data;
      
      return {
        ...item,
        // Ensure totalQuantity is present
        totalQuantity: item.totalQuantity ?? item.batches?.reduce((acc: number, b: Batch) => acc + b.quantity, 0) ?? 0
      };
    } catch (err) {
      console.error(`Detail Fetch Error for [${identifier}]:`, err);
      return null;
    }
  };

  /** Local Filtering (Search) **/
  const filterProducts = (query: string) => {
    if (!query) return products;
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.barcode.includes(query) ||
      p.category?.toLowerCase().includes(lowerQuery)
    );
  };

  /** Initial Synchronization **/
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { 
    products, 
    inventoryStats,
    loading, 
    error, 
    refresh: fetchProducts,
    getProductById,
    filterProducts
  };
};