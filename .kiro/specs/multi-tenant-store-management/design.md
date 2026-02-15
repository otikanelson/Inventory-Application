# Design Document: Multi-Tenant Store Management System

## Overview

This design transforms a single-user inventory management system into a multi-tenant architecture supporting three hierarchical user roles: Author (super admin), Store Admin (store owner), and Staff (clerk). The system enforces complete data isolation between stores while allowing the Author global oversight.

The design leverages MongoDB's flexible schema with storeId-based partitioning, implements role-based access control (RBAC) through middleware, and maintains backward compatibility with existing PIN-based authentication while adding secret key authentication for the Author role.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React Native)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Author       │  │ Admin        │  │ Staff        │      │
│  │ Dashboard    │  │ Dashboard    │  │ Dashboard    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (Express)                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Authentication Middleware                   │   │
│  │  - Role verification                                  │   │
│  │  - Store access validation                            │   │
│  │  - Session management                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Multi-Tenant Query Middleware                 │   │
│  │  - Automatic storeId injection                        │   │
│  │  - Query filtering by store                           │   │
│  │  - Author bypass logic                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database (MongoDB)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Stores  │  │  Users   │  │ Products │  │  Sales   │   │
│  │          │  │          │  │          │  │          │   │
│  │ storeId  │  │ storeId  │  │ storeId  │  │ storeId  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Strategy

The system implements **shared database, shared schema** multi-tenancy with logical data partitioning:

- **Single Database**: All stores share one MongoDB database
- **Logical Isolation**: Every tenant-specific document includes a `storeId` field
- **Query-Level Filtering**: Middleware automatically injects storeId filters into queries
- **Index Optimization**: Compound indexes on `(storeId, ...)` for performance

This approach balances simplicity, cost-effectiveness, and adequate isolation for the use case.

## Components and Interfaces

### 1. Database Models

#### Store Model

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  ownerId: ObjectId (ref: User, required),
  createdAt: Date (auto),
  updatedAt: Date (auto),
  isActive: Boolean (default: true)
}
```

**Indexes:**
- `{ name: 1 }` - unique
- `{ ownerId: 1 }` - for admin lookup

#### Updated User Model

```javascript
{
  _id: ObjectId,
  name: String (required),
  pin: String (4 digits, required for admin/staff),
  role: String (enum: ['author', 'admin', 'staff']),
  storeId: ObjectId (ref: Store, required for admin/staff, null for author),
  storeName: String (denormalized, for display),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User, null for admin/author),
  lastLogin: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `{ pin: 1, role: 1, storeId: 1 }` - unique compound (PIN unique per role per store)
- `{ storeId: 1, role: 1 }` - for store user queries
- `{ role: 1 }` - for author queries

**Changes from current:**
- Add `author` to role enum
- Add `storeId` field (ObjectId, nullable)
- Add `storeName` field (String, nullable)
- Update PIN uniqueness constraint to include storeId

#### Updated Product Model

```javascript
{
  _id: ObjectId,
  storeId: ObjectId (ref: Store, required),
  name: String (required),
  barcode: String (unique per store),
  internalCode: String (unique per store),
  category: String (required),
  isPerishable: Boolean,
  imageUrl: String,
  genericPrice: Number,
  batches: [BatchSchema],
  totalQuantity: Number,
  hasBarcode: Boolean,
  thresholdValue: Number,
  demandRate: Number,
  lastRestocked: Date,
  customAlertThresholds: Object,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `{ storeId: 1, barcode: 1 }` - unique compound (barcode unique per store)
- `{ storeId: 1, internalCode: 1 }` - unique compound
- `{ storeId: 1, category: 1 }` - for category queries
- `{ storeId: 1, totalQuantity: 1 }` - for inventory alerts

**Changes from current:**
- Add `storeId` field (ObjectId, required)
- Update barcode uniqueness to be per-store
- Update internalCode uniqueness to be per-store

#### Updated Sale Model

```javascript
{
  _id: ObjectId,
  storeId: ObjectId (ref: Store, required),
  productId: ObjectId (ref: Product, required),
  productName: String (required),
  batchNumber: String (required),
  category: String,
  quantitySold: Number (required),
  priceAtSale: Number (required),
  totalAmount: Number (required),
  saleDate: Date (default: now),
  paymentMethod: String (enum: ['cash', 'card', 'transfer']),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes:**
- `{ storeId: 1, saleDate: -1 }` - for analytics
- `{ storeId: 1, productId: 1, saleDate: -1 }` - for product sales
- `{ storeId: 1, category: 1, saleDate: -1 }` - for category analytics

**Changes from current:**
- Add `storeId` field (ObjectId, required)

### 2. Authentication System

#### Author Authentication

```javascript
// POST /api/auth/author/login
Request: {
  secretKey: String
}

Response: {
  success: Boolean,
  data: {
    user: {
      id: String,
      name: "Author",
      role: "author"
    },
    sessionToken: String
  }
}
```

**Logic:**
1. Compare `secretKey` with `process.env.MONGODB_PASSWORD`
2. If match, create Author session (no database user record needed)
3. Return session token with role='author'

#### Admin/Staff Authentication

```javascript
// POST /api/auth/login
Request: {
  pin: String (4 digits),
  role: String ('admin' | 'staff'),
  storeName: String (optional, for admin login)
}

Response: {
  success: Boolean,
  data: {
    user: {
      id: String,
      name: String,
      role: String,
      storeId: String,
      storeName: String
    },
    sessionToken: String
  }
}
```

**Logic:**
1. Query User by `{ pin, role, isActive: true }`
2. For admin: optionally filter by storeName if provided
3. Verify user exists
4. Update lastLogin timestamp
5. Generate session token
6. Return user data including storeId

#### Admin Setup with Store Creation

```javascript
// POST /api/auth/setup
Request: {
  name: String,
  pin: String (4 digits),
  storeName: String (required)
}

Response: {
  success: Boolean,
  data: {
    user: {
      id: String,
      name: String,
      role: "admin",
      storeId: String,
      storeName: String
    },
    store: {
      id: String,
      name: String
    }
  }
}
```

**Logic:**
1. Validate storeName is unique
2. Create Store document with name
3. Create User document with role='admin', storeId=store._id, storeName
4. Return both user and store data

### 3. Middleware

#### Authentication Middleware

```javascript
// middleware/authenticate.js
async function authenticate(req, res, next) {
  // Extract session token from header
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Decode session token (contains userId and role)
  const session = decodeSessionToken(token);
  
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }
  
  // For author role, set req.user without database lookup
  if (session.role === 'author') {
    req.user = {
      id: 'author',
      role: 'author',
      isAuthor: true
    };
    return next();
  }
  
  // For admin/staff, fetch user from database
  const user = await User.findById(session.userId);
  
  if (!user || !user.isActive) {
    return res.status(401).json({ error: 'User not found or inactive' });
  }
  
  req.user = {
    id: user._id,
    role: user.role,
    storeId: user.storeId,
    storeName: user.storeName,
    isAuthor: false
  };
  
  next();
}
```

#### Multi-Tenant Query Middleware

```javascript
// middleware/tenantFilter.js
function tenantFilter(req, res, next) {
  // Skip filtering for author
  if (req.user.isAuthor) {
    return next();
  }
  
  // Inject storeId into query parameters
  req.tenantFilter = { storeId: req.user.storeId };
  
  // Validate route params don't reference other stores
  if (req.params.storeId && req.params.storeId !== req.user.storeId.toString()) {
    return res.status(403).json({ error: 'Access denied to this store' });
  }
  
  next();
}
```

#### Store Access Validator

```javascript
// middleware/validateStoreAccess.js
async function validateStoreAccess(req, res, next) {
  // Author can access all stores
  if (req.user.isAuthor) {
    return next();
  }
  
  // Extract storeId from request (body, params, or query)
  const requestedStoreId = req.body.storeId || req.params.storeId || req.query.storeId;
  
  // If storeId is in request, verify it matches user's store
  if (requestedStoreId && requestedStoreId !== req.user.storeId.toString()) {
    return res.status(403).json({ error: 'Access denied to this store' });
  }
  
  next();
}
```

### 4. API Endpoints

#### Author Endpoints

```javascript
// GET /api/author/stores
// Returns all stores with admin and staff counts
Response: {
  success: Boolean,
  data: [{
    id: String,
    name: String,
    ownerId: String,
    ownerName: String,
    adminCount: Number,
    staffCount: Number,
    productCount: Number,
    createdAt: Date
  }]
}

// GET /api/author/stores/:storeId
// Returns detailed store information
Response: {
  success: Boolean,
  data: {
    store: { id, name, createdAt },
    admins: [{ id, name, lastLogin }],
    staff: [{ id, name, createdBy, lastLogin }],
    stats: {
      totalProducts: Number,
      totalSales: Number,
      totalRevenue: Number
    }
  }
}

// GET /api/author/users
// Returns all users across all stores
Response: {
  success: Boolean,
  data: [{
    id: String,
    name: String,
    role: String,
    storeId: String,
    storeName: String,
    lastLogin: Date
  }]
}
```

#### Store Management Endpoints

```javascript
// POST /api/stores
// Create a new store (called during admin setup)
Request: {
  name: String,
  ownerId: String
}

Response: {
  success: Boolean,
  data: {
    id: String,
    name: String,
    ownerId: String,
    createdAt: Date
  }
}

// GET /api/stores/:storeId
// Get store details (admin/author only)
Response: {
  success: Boolean,
  data: {
    id: String,
    name: String,
    ownerId: String,
    createdAt: Date
  }
}
```

#### Updated Staff Management Endpoints

```javascript
// POST /api/auth/staff
// Create staff member (admin only, auto-assigns storeId)
Request: {
  name: String,
  pin: String (4 digits)
}

Response: {
  success: Boolean,
  data: {
    user: {
      id: String,
      name: String,
      role: "staff",
      storeId: String,
      storeName: String
    }
  }
}

// DELETE /api/auth/staff/:id
// Delete staff member (admin only, validates same store)
Response: {
  success: Boolean,
  message: String
}

// GET /api/auth/staff
// Get all staff for current store (admin only)
Response: {
  success: Boolean,
  data: [{
    id: String,
    name: String,
    role: "staff",
    storeId: String,
    createdBy: String,
    lastLogin: Date,
    createdAt: Date
  }]
}
```

#### Updated Product Endpoints

All existing product endpoints remain the same but with automatic storeId filtering:

```javascript
// GET /api/products
// Returns products filtered by user's storeId (or all for author)

// POST /api/products
// Creates product with user's storeId automatically injected

// PUT /api/products/:id
// Updates product (validates same storeId)

// DELETE /api/products/:id
// Deletes product (validates same storeId)
```

### 5. Frontend Components

#### Author Login Component

```typescript
// components/AuthorLogin.tsx
interface AuthorLoginProps {
  onSuccess: (user: User) => void;
}

// Small, discreet link on login/setup pages
// Modal or separate page for secret key input
// Validates secret key against backend
```

#### Author Dashboard Component

```typescript
// screens/AuthorDashboard.tsx
interface AuthorDashboardState {
  stores: Store[];
  selectedStore: Store | null;
  users: User[];
}

// Displays:
// - List of all stores with stats
// - Store detail view with admins and staff
// - Ability to view store-specific data
// - System-wide analytics
```

#### Updated Admin Setup Component

```typescript
// screens/SetupScreen.tsx
interface SetupFormData {
  name: string;
  pin: string;
  storeName: string; // NEW FIELD
}

// Add storeName input field
// Validate storeName is not empty
// Submit all three fields to /api/auth/setup
```

#### Updated Admin Settings Component

```typescript
// screens/AdminSettings.tsx

// Add "Delete Staff" button next to each staff member
// Confirm deletion with modal
// Call DELETE /api/auth/staff/:id
// Refresh staff list after deletion
```

## Data Models

### Store Entity

```typescript
interface Store {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
```

### User Entity (Updated)

```typescript
interface User {
  id: string;
  name: string;
  pin?: string; // Not present for author
  role: 'author' | 'admin' | 'staff';
  storeId?: string; // Null for author
  storeName?: string; // Null for author
  isActive: boolean;
  createdBy?: string; // Null for admin and author
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Session Token

```typescript
interface SessionToken {
  userId: string; // 'author' for author role
  role: 'author' | 'admin' | 'staff';
  storeId?: string; // Present for admin/staff
  issuedAt: number;
  expiresAt: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: User Role Assignment

*For any* user creation operation, the created user should have exactly one role from the set {author, admin, staff}.

**Validates: Requirements 1.2**

### Property 2: Store Isolation for Non-Author Users

*For any* Store_Admin or Staff user, when they query any data (Products, Sales, inventory), all returned results should belong only to their assigned storeId, and attempts to access data from other stores should be rejected.

**Validates: Requirements 1.4, 1.5, 2.5, 3.4, 3.5, 5.6, 7.2, 7.5, 8.1, 8.2, 8.3**

### Property 3: Author Global Access

*For any* Author user, when they query any data (Stores, Users, Products, Sales), all results from all stores should be returned without storeId filtering.

**Validates: Requirements 1.3, 2.6, 3.6, 4.3, 8.5, 9.1**

### Property 4: Role-Based Permission Hierarchy

*For any* operation in the system, Author should be able to perform all operations, Store_Admin should be able to perform admin operations (staff management, inventory management) but not author operations (viewing all stores), and Staff should only be able to perform basic inventory operations.

**Validates: Requirements 1.6, 7.3, 7.4**

### Property 5: Store Creation During Admin Setup

*For any* Store_Admin account creation with a valid store name, a new Store entity should be created with that name, and the admin's storeId should reference the created store.

**Validates: Requirements 2.1, 2.3, 2.4, 5.3, 5.4**

### Property 6: Store ID Uniqueness

*For any* set of created stores, all store IDs should be unique.

**Validates: Requirements 2.2**

### Property 7: Data Entity Store Association

*For any* Product, Sale, or inventory operation, the entity should have a storeId field that references a valid Store.

**Validates: Requirements 3.1, 3.2, 3.3, 11.4, 11.5**

### Property 8: Author Authentication with Secret Key

*For any* authentication attempt with role='author', the system should authenticate successfully if and only if the provided secret key matches the configured MongoDB password.

**Validates: Requirements 4.1, 4.2**

### Property 9: Author Dashboard Data Completeness

*For any* Author dashboard request, the response should include all Stores with their associated Store_Admins, Staff members, and summary statistics.

**Validates: Requirements 4.4, 4.5, 9.2, 9.3, 9.4, 9.6, 15.4**

### Property 10: Admin Setup Input Validation

*For any* Store_Admin account creation attempt, the system should reject the request if the store name is empty, the PIN is not exactly 4 digits, or the store name already exists.

**Validates: Requirements 5.1, 5.2, 14.2, 14.4**

### Property 11: PIN-Based Authentication

*For any* authentication attempt with role='admin' or role='staff', the system should authenticate successfully if and only if a user exists with the provided PIN, role, and isActive=true.

**Validates: Requirements 5.5, 7.1**

### Property 12: Staff Creation Inherits Store

*For any* Staff member created by a Store_Admin, the staff member's storeId should match the creating admin's storeId.

**Validates: Requirements 6.1**

### Property 13: Staff Creation Input Validation

*For any* Staff creation attempt, the system should reject the request if the name is empty or the PIN is not exactly 4 digits.

**Validates: Requirements 6.2**

### Property 14: Cross-Store Staff Management Prevention

*For any* Store_Admin attempting to create or delete a Staff member, the operation should be rejected if the target staff member's storeId does not match the admin's storeId.

**Validates: Requirements 6.3, 6.5**

### Property 15: Staff Deletion

*For any* Staff deletion operation by a Store_Admin, the staff member should be removed from the database or marked as inactive, and subsequent queries should not return the deleted staff member.

**Validates: Requirements 6.4, 6.6**

### Property 16: Staff Inventory Operations

*For any* Staff user, they should be able to perform inventory operations (view products, record sales, update quantities) within their assigned store, and all operations should be filtered by their storeId.

**Validates: Requirements 7.6**

### Property 17: Authentication Token Verification

*For any* request to a protected endpoint, the system should verify the authentication token is valid, extract the user's role and storeId (if applicable), and reject requests with invalid or missing tokens.

**Validates: Requirements 12.1, 12.2**

### Property 18: Request StoreId Validation

*For any* request from a Store_Admin or Staff that includes a storeId parameter (in body, params, or query), the system should reject the request if the provided storeId does not match the authenticated user's storeId.

**Validates: Requirements 12.3, 12.4**

### Property 19: Author Bypasses StoreId Validation

*For any* request from an Author user, storeId validation should be bypassed, allowing access to any store's data.

**Validates: Requirements 12.5**

### Property 20: Store Name Uniqueness

*For any* two stores in the system, their names should be unique (case-insensitive comparison).

**Validates: Requirements 14.4**

### Property 21: Referential Integrity

*For any* User with role='admin' or role='staff', their storeId field should reference a valid Store that exists in the database.

**Validates: Requirements 11.8**

## Error Handling

### Authentication Errors

1. **Invalid Credentials**: Return 401 with message "Invalid credentials" when PIN/secret key doesn't match
2. **Missing Credentials**: Return 400 with message "PIN/secret key and role are required" when credentials are missing
3. **Inactive User**: Return 401 with message "User not found or inactive" when user is marked inactive
4. **Invalid Token**: Return 401 with message "Invalid session" when session token is invalid or expired

### Authorization Errors

1. **Cross-Store Access**: Return 403 with message "Access denied to this store" when user attempts to access another store's data
2. **Insufficient Permissions**: Return 403 with message "Insufficient permissions" when user attempts operation above their role level
3. **Staff Admin Operations**: Return 403 with message "Staff cannot perform administrative operations" when staff attempts admin actions

### Validation Errors

1. **Invalid PIN Format**: Return 400 with message "PIN must be exactly 4 digits" when PIN is not 4 digits
2. **Empty Store Name**: Return 400 with message "Store name is required" when store name is empty
3. **Duplicate Store Name**: Return 400 with message "Store name already exists" when store name is not unique
4. **Duplicate PIN**: Return 400 with message "PIN already in use" when PIN is already taken (within same store for admin/staff)
5. **Missing Required Fields**: Return 400 with message specifying which fields are required

### Resource Errors

1. **Store Not Found**: Return 404 with message "Store not found" when storeId doesn't exist
2. **User Not Found**: Return 404 with message "User not found" when userId doesn't exist
3. **Staff Not Found**: Return 404 with message "Staff member not found" when staff ID doesn't exist

### Database Errors

1. **Connection Failure**: Return 500 with message "Database connection failed"
2. **Query Failure**: Return 500 with message "Failed to fetch data"
3. **Save Failure**: Return 500 with message "Failed to save data"
4. **Referential Integrity Violation**: Return 400 with message "Invalid store reference"

## Testing Strategy

### Dual Testing Approach

The system requires both unit testing and property-based testing for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs using randomized test data

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection:**
- **JavaScript/Node.js**: Use `fast-check` library for property-based testing
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property using a comment tag

**Tag Format:**
```javascript
// Feature: multi-tenant-store-management, Property 2: Store Isolation for Non-Author Users
```

**Implementation Requirements:**
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should generate random valid inputs (users, stores, products, sales)
- Tests should verify the property holds for all generated inputs
- Tests should use the PBT library's built-in generators and combinators

### Unit Testing Focus

Unit tests should focus on:

1. **Specific Examples**: Concrete scenarios that demonstrate correct behavior
   - Author logs in with correct secret key
   - Admin creates staff member successfully
   - Staff member queries products in their store

2. **Edge Cases**: Boundary conditions and special cases
   - Empty store name
   - PIN with non-digit characters
   - Deleted staff member cannot log in
   - Store with no products

3. **Error Conditions**: Specific error scenarios
   - Login with wrong PIN
   - Admin attempts to delete staff from another store
   - Staff attempts to create another staff member
   - Request with invalid storeId

4. **Integration Points**: Component interactions
   - Store creation during admin setup (creates both store and user)
   - Staff deletion (removes user and updates relationships)
   - Authentication flow (token generation and validation)

### Test Coverage Requirements

**Backend API Tests:**
- All authentication endpoints (login, setup, author login)
- All store management endpoints
- All user management endpoints (staff CRUD)
- All data query endpoints with store filtering
- Middleware (authentication, tenant filtering, store access validation)

**Frontend Component Tests:**
- Author login component
- Admin setup with store name input
- Staff management with delete functionality
- Store-filtered data display

**Integration Tests:**
- End-to-end authentication flows
- Multi-tenant data isolation
- Role-based access control
- Store creation and user association

### Migration Testing

**Data Migration Tests:**
- Verify existing users get storeId assigned
- Verify existing products get storeId assigned
- Verify existing sales get storeId assigned
- Verify default store is created
- Verify referential integrity after migration
- Verify no data loss during migration

## Implementation Notes

### Migration Strategy

1. **Create Default Store**: Before migrating users, create a default store named "Default Store"
2. **Migrate Users**: Update all existing users to include storeId referencing the default store
3. **Migrate Products**: Update all existing products to include storeId referencing the default store
4. **Migrate Sales**: Update all existing sales to include storeId referencing the default store
5. **Create Indexes**: Add new compound indexes for storeId fields
6. **Verify Integrity**: Run validation queries to ensure all references are valid

### Backward Compatibility

- Existing admin users should be converted to Store_Admin role with the default store
- Existing staff users should be associated with the default store
- Existing PIN-based authentication should continue to work
- Existing API endpoints should continue to work with automatic storeId filtering

### Performance Considerations

1. **Indexing**: Compound indexes on `(storeId, ...)` for all multi-tenant queries
2. **Query Optimization**: Use MongoDB's query planner to optimize filtered queries
3. **Caching**: Consider caching store metadata and user permissions
4. **Connection Pooling**: Ensure MongoDB connection pool is sized appropriately

### Security Considerations

1. **Secret Key Storage**: Store MongoDB password in environment variable, never in code
2. **Session Tokens**: Use cryptographically secure random tokens with expiration
3. **PIN Storage**: Consider hashing PINs (currently stored as plain text)
4. **SQL Injection**: Use parameterized queries (Mongoose handles this)
5. **Authorization Checks**: Always verify storeId matches user's store before operations
6. **Rate Limiting**: Consider adding rate limiting to authentication endpoints

### Deployment Considerations

1. **Database Backup**: Backup database before running migration
2. **Migration Script**: Create idempotent migration script that can be safely re-run
3. **Rollback Plan**: Prepare rollback script in case migration fails
4. **Monitoring**: Add logging for multi-tenant operations and authorization failures
5. **Testing**: Test migration on staging environment before production
