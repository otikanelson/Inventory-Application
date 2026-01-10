// data/dummyProducts.ts
export type Product = {
  id: string;
  name: string;
  category: string; // Added category
  quantity: number;
  expiryDate: string;
  receivedDate: string;
  hasBarcode: boolean;
};

export const products: Product[] = [
  // --- DAIRY ---
  { id: 'INV-001', name: 'Milk 1L', category: 'Dairy', quantity: 20, expiryDate: '2026-01-10', receivedDate: '2025-12-20', hasBarcode: true },
  { id: 'INV-002', name: 'Yogurt Cup', category: 'Dairy', quantity: 12, expiryDate: '2026-01-05', receivedDate: '2025-12-22', hasBarcode: false },
  { id: 'INV-003', name: 'Cheddar Cheese', category: 'Dairy', quantity: 5, expiryDate: '2026-02-15', receivedDate: '2025-12-15', hasBarcode: true },
  { id: 'INV-004', name: 'Butter 250g', category: 'Dairy', quantity: 15, expiryDate: '2026-03-20', receivedDate: '2025-12-10', hasBarcode: true },
  { id: 'INV-005', name: 'Greek Yogurt', category: 'Dairy', quantity: 8, expiryDate: '2026-01-08', receivedDate: '2025-12-28', hasBarcode: true },
  
  // --- BAKERY ---
  { id: 'INV-006', name: 'Bread Loaf', category: 'Bakery', quantity: 30, expiryDate: '2026-01-03', receivedDate: '2025-12-28', hasBarcode: true },
  { id: 'INV-007', name: 'Croissants (4pk)', category: 'Bakery', quantity: 10, expiryDate: '2026-01-04', receivedDate: '2026-01-01', hasBarcode: false },
  { id: 'INV-008', name: 'Bagels', category: 'Bakery', quantity: 25, expiryDate: '2026-01-12', receivedDate: '2026-01-02', hasBarcode: true },
  { id: 'INV-009', name: 'Chocolate Muffin', category: 'Bakery', quantity: 12, expiryDate: '2026-01-05', receivedDate: '2026-01-01', hasBarcode: false },
  
  // --- PRODUCE ---
  { id: 'INV-010', name: 'Spinach Bag', category: 'Vegetable', quantity: 15, expiryDate: '2026-01-06', receivedDate: '2025-12-30', hasBarcode: true },
  { id: 'INV-011', name: 'Carrots 1kg', category: 'Vegetable', quantity: 40, expiryDate: '2026-02-01', receivedDate: '2025-12-20', hasBarcode: true },
  { id: 'INV-012', name: 'Red Apples', category: 'Fruit', quantity: 50, expiryDate: '2026-01-20', receivedDate: '2025-12-25', hasBarcode: false },
  { id: 'INV-013', name: 'Bananas', category: 'Fruit', quantity: 22, expiryDate: '2026-01-07', receivedDate: '2026-01-01', hasBarcode: false },
  { id: 'INV-014', name: 'Broccoli', category: 'Vegetable', quantity: 10, expiryDate: '2026-01-09', receivedDate: '2026-01-02', hasBarcode: false },
  
  // --- MEAT & FISH ---
  { id: 'INV-015', name: 'Chicken Breast', category: 'Meat', quantity: 10, expiryDate: '2026-01-08', receivedDate: '2026-01-02', hasBarcode: true },
  { id: 'INV-016', name: 'Ground Beef', category: 'Meat', quantity: 8, expiryDate: '2026-01-06', receivedDate: '2026-01-02', hasBarcode: true },
  { id: 'INV-017', name: 'Salmon Fillet', category: 'Meat', quantity: 5, expiryDate: '2026-01-05', receivedDate: '2026-01-03', hasBarcode: true },
  
  // --- BEVERAGES ---
  { id: 'INV-018', name: 'Orange Juice', category: 'Beverages', quantity: 18, expiryDate: '2026-01-15', receivedDate: '2025-12-28', hasBarcode: true },
  { id: 'INV-019', name: 'Sparkling Water', category: 'Beverages', quantity: 48, expiryDate: '2027-01-01', receivedDate: '2025-12-15', hasBarcode: true },
  { id: 'INV-020', name: 'Cold Brew Coffee', category: 'Beverages', quantity: 12, expiryDate: '2026-03-01', receivedDate: '2025-12-20', hasBarcode: true },
  
  // --- PANTRY & SNACKS ---
  { id: 'INV-021', name: 'Pasta 500g', category: 'Groceries', quantity: 50, expiryDate: '2027-06-01', receivedDate: '2025-11-01', hasBarcode: true },
  { id: 'INV-022', name: 'Potato Chips', category: 'Snacks', quantity: 20, expiryDate: '2026-05-10', receivedDate: '2025-12-15', hasBarcode: true },
  { id: 'INV-023', name: 'Tomato Sauce', category: 'Groceries', quantity: 30, expiryDate: '2027-01-01', receivedDate: '2025-11-20', hasBarcode: true },
  { id: 'INV-024', name: 'Olive Oil', category: 'Groceries', quantity: 10, expiryDate: '2027-12-01', receivedDate: '2025-10-15', hasBarcode: true },
  { id: 'INV-025', name: 'Rice 5kg', category: 'Groceries', quantity: 15, expiryDate: '2028-01-01', receivedDate: '2025-09-01', hasBarcode: true },

  // --- FILLER ITEMS TO REACH 50+ ---
  ...Array.from({ length: 25 }).map((_, i) => ({
    id: `INV-0${26 + i}`,
    name: `Product Bulk ${26 + i}`,
    category: i % 2 === 0 ? 'Groceries' : 'Electronics',
    quantity: Math.floor(Math.random() * 100),
    expiryDate: `2026-0${Math.floor(Math.random() * 9) + 1}-10`,
    receivedDate: '2025-12-01',
    hasBarcode: Math.random() > 0.5,
  }))
];