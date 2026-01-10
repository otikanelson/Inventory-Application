import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export interface Product {
  _id: string;               // MongoDB ID
  id?: string;               // Optional alias for old code
  name: string;
  category: string;
  imageUrl: string;          // The image URL
  expiryDate: string;        // We will pull this from the nearest batch
  totalQuantity: number;     // Total stock
  quantity?: number;         // Alias for UI consistency
  receivedDate: string;      // From the database timestamp
  hasBarcode: boolean;
  barcode?: string;
  internalCode?: string;
}

export const useProducts = () => {
  // Pass the Interface to useState <Product[]>
  const [products, setProducts] = useState<Product[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
  console.log("Attempting to fetch from:", process.env.EXPO_PUBLIC_API_URL); // LOG 1
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/products`);
      console.log("Fetch successful!"); // LOG 2
      setProducts(response.data.data || []);
    } catch (err: any) {
      // LOG 3: This will tell us if it's a Timeout, 404, or Connection Refused
      console.error("DETAILED NETWORK ERROR:", err.toJSON ? err.toJSON() : err);
      setError(err.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refresh: fetchProducts };
};