// utils/validation.ts
// Centralized input validation functions for forms

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates product name
 */
export const validateProductName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Product name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, error: 'Product name must be at least 2 characters' };
  }
  
  if (name.length > 100) {
    return { isValid: false, error: 'Product name cannot exceed 100 characters' };
  }
  
  return { isValid: true };
};

/**
 * Validates barcode format
 */
export const validateBarcode = (barcode: string, required: boolean = false): ValidationResult => {
  if (!barcode || barcode.trim().length === 0) {
    return required 
      ? { isValid: false, error: 'Barcode is required' }
      : { isValid: true }; // Optional field
  }
  
  // Remove spaces and check length
  const cleanBarcode = barcode.replace(/\s/g, '');
  
  // Common barcode formats: UPC (12), EAN-13 (13), Code-128 (variable)
  if (cleanBarcode.length < 8 || cleanBarcode.length > 20) {
    return { isValid: false, error: 'Invalid barcode format (8-20 characters)' };
  }
  
  // Check if alphanumeric
  if (!/^[A-Z0-9]+$/i.test(cleanBarcode)) {
    return { isValid: false, error: 'Barcode must contain only letters and numbers' };
  }
  
  return { isValid: true };
};

/**
 * Validates quantity
 */
export const validateQuantity = (quantity: string | number): ValidationResult => {
  const numQty = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
  
  if (isNaN(numQty)) {
    return { isValid: false, error: 'Quantity must be a number' };
  }
  
  if (numQty < 0) {
    return { isValid: false, error: 'Quantity cannot be negative' };
  }
  
  if (numQty > 1000000) {
    return { isValid: false, error: 'Quantity exceeds maximum limit' };
  }
  
  // Check for decimal places (max 2)
  if ((numQty.toString().split('.')[1] || '').length > 2) {
    return { isValid: false, error: 'Quantity can have at most 2 decimal places' };
  }
  
  return { isValid: true };
};

/**
 * Validates expiry date
 */
export const validateExpiryDate = (
  date: string, 
  isPerishable: boolean,
  allowPastDates: boolean = false
): ValidationResult => {
  if (!isPerishable) {
    return { isValid: true }; // Not required for non-perishables
  }
  
  if (!date || date.trim().length === 0) {
    return { isValid: false, error: 'Expiry date is required for perishable items' };
  }
  
  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }
  
  const expiryDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
  
  // Check if valid date
  if (isNaN(expiryDate.getTime())) {
    return { isValid: false, error: 'Invalid date' };
  }
  
  // Check if date is in the past
  if (!allowPastDates && expiryDate < today) {
    return { isValid: false, error: 'Expiry date cannot be in the past' };
  }
  
  // Check if date is too far in future (5 years)
  const fiveYearsFromNow = new Date();
  fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
  
  if (expiryDate > fiveYearsFromNow) {
    return { isValid: false, error: 'Expiry date seems unrealistic (max 5 years)' };
  }
  
  return { isValid: true };
};

/**
 * Validates price
 */
export const validatePrice = (price: string | number): ValidationResult => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return { isValid: false, error: 'Price must be a number' };
  }
  
  if (numPrice < 0) {
    return { isValid: false, error: 'Price cannot be negative' };
  }
  
  if (numPrice > 10000000) {
    return { isValid: false, error: 'Price exceeds maximum limit' };
  }
  
  // Check for decimal places (max 2 for currency)
  if ((numPrice.toString().split('.')[1] || '').length > 2) {
    return { isValid: false, error: 'Price can have at most 2 decimal places' };
  }
  
  return { isValid: true };
};

/**
 * Validates category
 */
export const validateCategory = (category: string, required: boolean = false): ValidationResult => {
  if (!category || category.trim().length === 0) {
    return required 
      ? { isValid: false, error: 'Category is required' }
      : { isValid: true };
  }
  
  if (category.length > 50) {
    return { isValid: false, error: 'Category cannot exceed 50 characters' };
  }
  
  return { isValid: true };
};

/**
 * Master validation function for add-products form
 */
export interface ProductFormData {
  name: string;
  barcode?: string;
  category?: string;
  quantity?: string;
  expiryDate?: string;
  price?: string;
  isPerishable: boolean;
  hasBarcode: boolean;
}

export const validateProductForm = (
  data: ProductFormData,
  mode: 'registry' | 'inventory' | 'manual'
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Name validation
  const nameResult = validateProductName(data.name);
  if (!nameResult.isValid) {
    errors.name = nameResult.error!;
  }
  
  // Barcode validation (required if hasBarcode is true)
  if (data.hasBarcode && data.barcode) {
    const barcodeResult = validateBarcode(data.barcode, true);
    if (!barcodeResult.isValid) {
      errors.barcode = barcodeResult.error!;
    }
  }
  
  // Category validation (optional but validate if provided)
  if (data.category) {
    const categoryResult = validateCategory(data.category);
    if (!categoryResult.isValid) {
      errors.category = categoryResult.error!;
    }
  }
  
  // Quantity validation (required for inventory mode)
  if (mode === 'inventory' && data.quantity) {
    const qtyResult = validateQuantity(data.quantity);
    if (!qtyResult.isValid) {
      errors.quantity = qtyResult.error!;
    }
  }
  
  // Expiry date validation
  if (data.expiryDate) {
    const dateResult = validateExpiryDate(data.expiryDate, data.isPerishable);
    if (!dateResult.isValid) {
      errors.expiryDate = dateResult.error!;
    }
  }
  
  // Price validation (optional but validate if provided)
  if (data.price) {
    const priceResult = validatePrice(data.price);
    if (!priceResult.isValid) {
      errors.price = priceResult.error!;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitizes input by trimming and removing extra spaces
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/\s+/g, ' ');
};