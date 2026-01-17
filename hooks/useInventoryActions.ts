// Goal List for useInventoryActions.ts
// - Centralized Mutations: Manage all Create, Update, and Delete (CRUD) operations for inventory.
// - Product Initialization: Handle the logic for registering a new product in the Global Registry.
// - Batch Addition: Logic for appending a new batch (qty/expiry) to an existing product barcode.
// - Internal Code Generation: Logic to generate and assign unique IDs for non-barcoded items.
// - Stock Adjustment: Functions to increment or decrement stock levels during restock or sales.
// - Error Handling: Standardized error catching and feedback for all database mutations.

import { useState } from 'react';
import axios from 'axios';
import { Product, Batch } from './useProducts';

// Properly typed product data for creation
interface ProductCreateData {
  name: string;
  category?: string;
  barcode?: string;
  hasBarcode?: boolean;
  isPerishable?: boolean;
  imageUrl?: string;
  quantity?: number;
  expiryDate?: string;
  price?: number;
}

export const useInventoryActions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/products`;

  // Helper: Generate a unique ID for items without barcodes
  const generateInternalCode = (): string => {
    return `INT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };

  // Create a brand new product in the Registry
  const addProduct = async (productData: ProductCreateData): Promise<Product> => {
    setIsSubmitting(true);
    setActionError(null);
    
    try {
      const finalData: ProductCreateData = {
        ...productData,
        barcode: productData.hasBarcode ? productData.barcode : generateInternalCode(),
      };
      
      const response = await axios.post(API_URL, finalData);
      return response.data.data as Product;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create product";
      setActionError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a new batch to an existing product (The "Restock" logic)
  const addBatch = async (productId: string, newBatch: Batch): Promise<Product> => {
    setIsSubmitting(true);
    setActionError(null);
    
    try {
      // Logic: Push new batch to the product's batch array and update total quantity
      const response = await axios.patch(`${API_URL}/${productId}/add-batch`, newBatch);
      return response.data.data as Product;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add batch";
      setActionError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete a product entirely
  const deleteProduct = async (productId: string): Promise<void> => {
    setIsSubmitting(true);
    setActionError(null);
    
    try {
      await axios.delete(`${API_URL}/${productId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete product";
      setActionError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    addProduct,
    addBatch,
    deleteProduct,
    isSubmitting,
    actionError,
    clearError: () => setActionError(null),
    generateInternalCode,
  };
};