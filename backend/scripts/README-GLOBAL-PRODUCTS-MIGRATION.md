# Global Products Multi-Tenancy Migration

## Overview

This migration adds multi-tenancy support to the GlobalProduct model, allowing each store to have its own product registry. Previously, global products were shared across all stores with a unique barcode constraint. Now, each store can have products with the same barcode but different details.

## Changes Made

### 1. Model Changes (`backend/src/models/GlobalProduct.js`)
- Added `storeId` field (ObjectId reference to Store)
- Removed unique constraint on `barcode` field
- Added compound unique index on `(barcode, storeId)` - barcode must be unique per store

### 2. Controller Changes (`backend/src/controllers/registryController.js`)
- All operations now filter by `storeId`
- `lookupBarcode`: Searches within user's store registry
- `addToRegistry`: Adds product to user's store registry
- `getAllGlobalProducts`: Returns only products from user's store
- `getGlobalProductById`: Filters by storeId
- `updateGlobalProduct`: Updates only products in user's store
- `deleteGlobalProduct`: Deletes only from user's store, checks inventory in that store

### 3. Middleware Changes (`backend/src/middleware/validateStoreAccess.js`)
- Enhanced logging to prevent crashes when `req.user` is undefined
- Added safe error handling in catch block
- Version updated to 3.0

### 4. Delete Product Logging (`backend/src/controllers/productController.js`)
- Added comprehensive logging for delete operations
- Logs user details, tenant filter, and request headers
- Better error messages for debugging

## Migration Steps

### Step 1: Update Database Indexes

This script drops the old unique barcode index and creates the new compound index:

```bash
node backend/scripts/update-global-product-indexes.js
```

**What it does:**
- Drops `barcode_1` unique index
- Creates `barcode_1_storeId_1` compound unique index
- Creates `storeId_1` index for faster queries

### Step 2: Add StoreId to Existing Global Products

This script assigns storeId to existing global products based on their inventory:

```bash
node backend/scripts/add-storeid-to-global-products.js
```

**What it does:**
- Finds all global products without storeId
- Looks up inventory products with matching barcode
- Assigns the storeId from the inventory product
- Skips products with no inventory or no storeId

### Step 3: Test Delete Functionality

This script tests the complete delete product flow:

```bash
# Set your JWT token in .env first:
# TEST_JWT_TOKEN=your_jwt_token_here

node backend/scripts/test-delete-product.js
```

**What it does:**
- Creates a test product
- Verifies it exists
- Deletes the product
- Verifies it's deleted
- Reports success or failure

## Testing

### Local Testing

1. Set up environment variables in `backend/.env`:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
TEST_JWT_TOKEN=your_test_jwt_token
```

2. Run migration scripts:
```bash
node backend/scripts/update-global-product-indexes.js
node backend/scripts/add-storeid-to-global-products.js
```

3. Test delete functionality:
```bash
node backend/scripts/test-delete-product.js
```

### Production Testing

1. Deploy the changes to Vercel

2. Check Vercel logs for the enhanced logging:
   - Look for "🗑️ ========== DELETE PRODUCT REQUEST =========="
   - Verify user details are logged
   - Check tenant filter is correct

3. Test in the app:
   - Navigate to a product detail page
   - Click delete button
   - Verify product is deleted
   - Check Vercel logs for detailed execution trace

## Troubleshooting

### Issue: "req.user is undefined"

**Symptoms:**
- 500 error when deleting products
- Error message: "Cannot read properties of undefined (reading 'storeId')"

**Solution:**
- Check Vercel logs for authentication middleware execution
- Verify JWT token is valid and not expired
- Ensure user exists in database
- Check JWT_SECRET matches between token signing and verification

**Enhanced Logging:**
The middleware now logs:
- Whether req.user exists
- User details (id, role, storeId)
- Request method and path
- Safe error handling prevents crashes

### Issue: "Product not found"

**Symptoms:**
- 404 error when deleting products
- Product exists but can't be deleted

**Solution:**
- Check tenant filter is correct
- Verify product belongs to user's store
- Check storeId matches between user and product

**Enhanced Logging:**
The controller now logs:
- Product ID being deleted
- User details and storeId
- Tenant filter applied
- Query used to find product

### Issue: Duplicate barcode error

**Symptoms:**
- Error when adding product to registry
- "E11000 duplicate key error"

**Solution:**
- Run the index migration script
- Verify compound index exists: `barcode_1_storeId_1`
- Check old unique index is dropped

## Rollback

If you need to rollback these changes:

1. Revert model changes (remove storeId, restore unique barcode)
2. Drop compound index:
```javascript
db.globalproducts.dropIndex('barcode_1_storeId_1')
```
3. Recreate unique barcode index:
```javascript
db.globalproducts.createIndex({ barcode: 1 }, { unique: true })
```
4. Revert controller changes to remove storeId filtering

## Notes

- Author users can still access all stores (bypass tenant filtering)
- Existing global products without storeId will be assigned based on inventory
- Products with no inventory will be skipped during migration
- Each store now has its own independent product registry
