# Design Document: Delete Product Fix

## Overview

This design addresses the production failure of the delete product functionality where `req.user` is undefined in the `validateStoreAccess` middleware despite the `authenticate` middleware being configured to set it. The solution involves creating diagnostic tools, adding version tracking, enhancing logging, verifying deployment integrity, and ensuring the middleware chain executes correctly in Vercel's serverless environment.

The root cause is likely one of the following:
1. Vercel deployment cache serving old code
2. Middleware chain not executing in the correct order
3. JWT_SECRET mismatch between environments
4. Serverless function state issues
5. Early return in authenticate middleware not being respected

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Vercel Serverless                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Express Application                    │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │         Middleware Chain                  │     │    │
│  │  │                                           │     │    │
│  │  │  1. authenticate                          │     │    │
│  │  │     ├─ Verify JWT                         │     │    │
│  │  │     ├─ Set req.user                       │     │    │
│  │  │     └─ Log version + user info            │     │    │
│  │  │                                           │     │    │
│  │  │  2. tenantFilter                          │     │    │
│  │  │     └─ Set req.tenantFilter               │     │    │
│  │  │                                           │     │    │
│  │  │  3. validateStoreAccess                   │     │    │
│  │  │     ├─ Check req.user exists              │     │    │
│  │  │     ├─ Verify storeId match               │     │    │
│  │  │     └─ Log version + validation           │     │    │
│  │  │                                           │     │    │
│  │  │  4. deleteProduct controller              │     │    │
│  │  │     └─ Delete product from DB             │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────┐     │    │
│  │  │      Diagnostic Endpoints                 │     │    │
│  │  │  - /api/diagnostics/version               │     │    │
│  │  │  - /api/diagnostics/auth-test             │     │    │
│  │  │  - /api/diagnostics/middleware-chain      │     │    │
│  │  └──────────────────────────────────────────┘     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Diagnostic Tools Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Diagnostic Scripts                          │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  test-auth-flow.js                               │      │
│  │  ├─ Load JWT token from .env                     │      │
│  │  ├─ Decode and verify token                      │      │
│  │  ├─ Query user from database                     │      │
│  │  └─ Test DELETE /api/products/:id                │      │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
│  ┌──────────────────────────────────────────────────┐      │
│  │  verify-deployment.js                            │      │
│  │  ├─ Call /api/diagnostics/version                │      │
│  │  ├─ Compare with local version                   │      │
│  │  └─ Report deployment status                     │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Authentication Middleware

**File:** `backend/src/middleware/authenticate.js`

**Enhancements:**
- Add version constant at top of file: `const MIDDLEWARE_VERSION = 'v3.0'`
- Log version on every execution
- Add explicit return statements after all error responses (already present)
- Log JWT_SECRET prefix on startup for verification
- Add request ID for tracking

**Interface:**
```javascript
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * 
 * Sets req.user with:
 * - id: string
 * - role: 'author' | 'admin' | 'staff'
 * - storeId: string | null
 * - storeName: string | null
 * - isAuthor: boolean
 */
async function authenticate(req, res, next)
```

### 2. Enhanced Validation Middleware

**File:** `backend/src/middleware/validateStoreAccess.js`

**Enhancements:**
- Update version constant: `const MIDDLEWARE_VERSION = 'v3.0'`
- Add defensive check at function entry: if req.user is undefined, return 401 immediately
- Log version on every execution
- Add request ID for tracking
- Log the complete req.user object (sanitized)

**Interface:**
```javascript
/**
 * @param {Request} req - Express request object with req.user set by authenticate
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * 
 * Requires req.user to be set by authenticate middleware
 */
function validateStoreAccess(req, res, next)
```

### 3. Diagnostic Endpoints

**File:** `backend/src/routes/diagnosticRoutes.js` (new)

**Endpoints:**

```javascript
// GET /api/diagnostics/version
// Returns current middleware versions and deployment info
{
  success: true,
  versions: {
    authenticate: 'v3.0',
    validateStoreAccess: 'v3.0',
    deployment: '2024-01-15T10:30:00Z'
  },
  environment: 'production',
  jwtSecretPrefix: 'abc1'
}

// POST /api/diagnostics/auth-test
// Tests authentication flow with provided token
// Body: { token: string }
{
  success: true,
  tokenValid: true,
  userFound: true,
  user: {
    id: '...',
    role: 'admin',
    storeId: '...'
  }
}

// POST /api/diagnostics/middleware-chain
// Tests complete middleware chain execution
// Body: { token: string, productId: string }
{
  success: true,
  steps: [
    { name: 'authenticate', passed: true, reqUserSet: true },
    { name: 'tenantFilter', passed: true, filterSet: true },
    { name: 'validateStoreAccess', passed: true, authorized: true }
  ]
}
```

### 4. Diagnostic Scripts

**File:** `backend/scripts/test-auth-flow.js` (new)

**Purpose:** Test authentication flow locally and against production

**Usage:**
```bash
# Test locally
node backend/scripts/test-auth-flow.js local

# Test production
node backend/scripts/test-auth-flow.js production
```

**Functionality:**
- Load JWT token from environment
- Decode and verify token
- Query user from database
- Make DELETE request to test endpoint
- Report detailed results

**File:** `backend/scripts/verify-deployment.js` (new)

**Purpose:** Verify deployment actually updated code

**Usage:**
```bash
node backend/scripts/verify-deployment.js
```

**Functionality:**
- Call /api/diagnostics/version endpoint
- Compare with local version constants
- Report if versions match
- Check Git branch deployed

### 5. Request ID Middleware

**File:** `backend/src/middleware/requestId.js` (new)

**Purpose:** Add unique request ID for tracking through logs

**Interface:**
```javascript
/**
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 * 
 * Sets req.id with unique identifier
 */
function requestId(req, res, next)
```

### 6. Vercel Configuration Updates

**File:** `backend/vercel.json`

**Changes:**
- Disable caching for API routes (set Cache-Control to no-cache)
- Add environment variable for deployment timestamp
- Ensure correct region configuration

## Data Models

No new data models required. Existing models remain unchanged:
- User model (already exists)
- Product model (already exists)
- Sale model (already exists)

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Authentication sets req.user

*For any* valid JWT token and existing user, when the authenticate middleware processes the request, req.user should be defined with id, role, and storeId properties.

**Validates: Requirements 2.1, 2.4**

### Property 2: Middleware chain ordering

*For any* DELETE request to /api/products/:id, the middleware execution order should be: authenticate → tenantFilter → validateStoreAccess → deleteProduct controller.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Early return prevents next()

*For any* middleware that returns an error response (401, 403, 500), the next() function should not be called and subsequent middleware should not execute.

**Validates: Requirements 2.2, 2.3, 2.5, 3.4**

### Property 4: Validation requires authentication

*For any* request reaching validateStoreAccess middleware, req.user should be defined (set by authenticate middleware).

**Validates: Requirements 3.2, 5.2**

### Property 5: JWT verification consistency

*For any* JWT token signed with a specific secret, verification with the same secret should succeed, and verification with a different secret should fail.

**Validates: Requirements 6.1, 6.3**

### Property 6: Request isolation

*For any* two concurrent requests to the serverless function, req.user set for one request should not affect req.user for the other request.

**Validates: Requirements 8.3**

### Property 7: Delete authorization

*For any* authenticated admin user, deleting a product should succeed if and only if the product belongs to the user's store.

**Validates: Requirements 9.1, 9.4**

### Property 8: Deployment version tracking

*For any* deployment to Vercel, the version identifiers in logs should match the deployed code version.

**Validates: Requirements 4.1, 4.2, 4.3**

## Error Handling

### Authentication Errors

| Error Condition | Status Code | Response | Action |
|----------------|-------------|----------|--------|
| Missing Authorization header | 401 | `{ success: false, error: 'Authentication required' }` | Return immediately, don't call next() |
| Invalid JWT format | 401 | `{ success: false, error: 'Invalid session' }` | Return immediately, don't call next() |
| JWT verification failed | 401 | `{ success: false, error: 'Invalid session' }` | Return immediately, don't call next() |
| User not found | 401 | `{ success: false, error: 'User not found or inactive' }` | Return immediately, don't call next() |
| Database error | 500 | `{ success: false, error: 'Authentication failed', details: '...' }` | Return immediately, don't call next() |

### Validation Errors

| Error Condition | Status Code | Response | Action |
|----------------|-------------|----------|--------|
| req.user undefined | 401 | `{ success: false, error: 'Authentication required', debug: 'req.user is undefined' }` | Return immediately, log error |
| User has no storeId | 403 | `{ success: false, error: 'User not associated with any store' }` | Return immediately |
| StoreId mismatch | 403 | `{ success: false, error: 'Access denied to this store' }` | Return immediately |
| Unexpected error | 500 | `{ success: false, error: 'Authorization failed', details: '...' }` | Return immediately, log stack trace |

### Delete Product Errors

| Error Condition | Status Code | Response | Action |
|----------------|-------------|----------|--------|
| Invalid product ID format | 400 | `{ success: false, message: 'Invalid product ID format' }` | Return error |
| Product not found | 404 | `{ success: false, message: 'Product not found or no permission' }` | Return error |
| Database error | 500 | `{ success: false, message: '...' }` | Log error, return generic message |

### Logging Strategy

All errors should be logged with:
- Request ID
- Timestamp
- Middleware version
- Error message
- Stack trace (for 500 errors)
- Request context (method, path, user info if available)

## Testing Strategy

### Unit Tests

Unit tests will verify specific examples and edge cases:

1. **Authentication Middleware Tests**
   - Valid JWT token with existing user
   - Invalid JWT token
   - Missing Authorization header
   - Expired JWT token
   - User not found in database
   - Author role handling

2. **Validation Middleware Tests**
   - req.user defined with matching storeId
   - req.user undefined (should return 401)
   - StoreId mismatch (should return 403)
   - Author role bypass
   - User with no storeId

3. **Middleware Chain Tests**
   - Correct execution order
   - Early return prevents next middleware
   - Request isolation between concurrent requests

4. **Diagnostic Endpoint Tests**
   - Version endpoint returns correct versions
   - Auth test endpoint validates tokens correctly
   - Middleware chain test endpoint reports accurate results

### Property-Based Tests

Property-based tests will verify universal properties across all inputs. Each test should run a minimum of 100 iterations.

1. **Property Test: Authentication sets req.user**
   - **Feature: delete-product-fix, Property 1: For any valid JWT token and existing user, when the authenticate middleware processes the request, req.user should be defined with id, role, and storeId properties**
   - Generate random valid JWT tokens
   - Verify req.user is always set correctly

2. **Property Test: Middleware chain ordering**
   - **Feature: delete-product-fix, Property 2: For any DELETE request to /api/products/:id, the middleware execution order should be: authenticate → tenantFilter → validateStoreAccess → deleteProduct controller**
   - Generate random DELETE requests
   - Verify execution order is always correct

3. **Property Test: Early return prevents next()**
   - **Feature: delete-product-fix, Property 3: For any middleware that returns an error response, the next() function should not be called**
   - Generate random invalid requests (missing auth, invalid token, etc.)
   - Verify next() is never called after error response

4. **Property Test: Validation requires authentication**
   - **Feature: delete-product-fix, Property 4: For any request reaching validateStoreAccess middleware, req.user should be defined**
   - Generate random requests
   - Verify req.user is always defined when validateStoreAccess executes

5. **Property Test: JWT verification consistency**
   - **Feature: delete-product-fix, Property 5: For any JWT token signed with a specific secret, verification with the same secret should succeed**
   - Generate random JWT tokens with known secret
   - Verify verification always succeeds with correct secret

6. **Property Test: Request isolation**
   - **Feature: delete-product-fix, Property 6: For any two concurrent requests, req.user set for one request should not affect the other**
   - Generate random concurrent requests with different users
   - Verify req.user is isolated per request

7. **Property Test: Delete authorization**
   - **Feature: delete-product-fix, Property 7: For any authenticated admin user, deleting a product should succeed if and only if the product belongs to the user's store**
   - Generate random users and products
   - Verify authorization logic is correct

### Integration Tests

Integration tests will verify the complete flow:

1. **End-to-End Delete Product Test**
   - Create test product
   - Authenticate as admin
   - Delete product
   - Verify product is deleted
   - Verify correct response

2. **Production Smoke Test**
   - Use real production JWT token
   - Create test product in production
   - Delete test product
   - Verify success
   - Clean up test data

### Manual Testing Checklist

1. Deploy to Vercel
2. Run verify-deployment.js script
3. Check Vercel logs for version identifiers
4. Run test-auth-flow.js against production
5. Test delete product in production UI
6. Verify error no longer occurs
7. Check Vercel logs for detailed execution logs

### Testing Tools

- **Jest**: Unit and integration tests
- **Supertest**: HTTP request testing
- **fast-check**: Property-based testing library for JavaScript
- **Node.js scripts**: Diagnostic and verification scripts
