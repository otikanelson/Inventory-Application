# Design Document

## Overview

This design implements a comprehensive authentication and UX improvement system that properly differentiates between Login PINs and Admin Security PINs, fixes navigation flows, adds category validation, and resolves UI issues. The solution involves backend schema changes, frontend authentication flow updates, and UI/UX enhancements across multiple screens.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React Native)                  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ AuthContext  │  │ AsyncStorage │  │  UI Screens  │     │
│  │              │  │              │  │              │     │
│  │ - Login Flow │  │ - loginPin   │  │ - Admin      │     │
│  │ - Role Check │  │ - securityPin│  │ - Settings   │     │
│  │ - Navigation │  │ - Migration  │  │ - Products   │     │
│  └──────┬───────┘  └──────────────┘  └──────────────┘     │
│         │                                                    │
└─────────┼────────────────────────────────────────────────────┘
          │
          │ HTTP/REST API
          │
┌─────────▼────────────────────────────────────────────────────┐
│                     Backend (Node.js/Express)                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Routes  │  │ User Model   │  │ Category API │     │
│  │              │  │              │  │              │     │
│  │ - Login      │  │ - loginPin   │  │ - GET /cat   │     │
│  │ - Verify PIN │  │ - securityPin│  │ - POST /cat  │     │
│  │ - Sessions   │  │ - role       │  │ - Validation │     │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘     │
│         │                  │                                 │
│         └──────────────────┼─────────────────────────────────┤
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │   MongoDB      │                       │
│                    │                │                       │
│                    │ - users        │                       │
│                    │ - categories   │                       │
│                    │ - products     │                       │
│                    └────────────────┘                       │
└──────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Login Flow:**
   - User enters PIN → AuthContext validates against loginPin → Backend verifies → Role-based navigation

2. **Sensitive Operation Flow:**
   - User attempts sensitive action → System prompts for Admin Security PIN → Backend verifies securityPin → Operation authorized/denied

3. **Category Validation Flow:**
   - User registers product → System fetches categories → Validates category exists → Allows/denies registration

## Components and Interfaces

### Backend Components

#### User Model Schema

```typescript
interface UserSchema {
  name: string;
  loginPin: string;        // 4-digit PIN for authentication
  securityPin?: string;    // 4-digit PIN for authorization (admin only)
  role: 'author' | 'admin' | 'staff' | 'viewer';
  storeId?: ObjectId;
  storeName?: string;
  isActive: boolean;
  createdBy?: ObjectId;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Authentication API

```typescript
// Login endpoint
POST /auth/login
Request: {
  pin: string;
  role: 'admin' | 'staff';
}
Response: {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      role: string;
      storeId?: string;
      storeName?: string;
    };
    sessionToken: string;
  };
}

// Verify Admin Security PIN endpoint
POST /auth/verify-admin-security-pin
Request: {
  storeId: string;
  pin: string;
}
Response: {
  success: boolean;
  message?: string;
}
```

#### Category API

```typescript
// Get all categories
GET /categories
Response: {
  success: boolean;
  data: Array<{
    _id: string;
    name: string;
    createdBy: string;
    createdAt: Date;
  }>;
}

// Create category (admin only)
POST /categories
Request: {
  name: string;
}
Response: {
  success: boolean;
  data: {
    _id: string;
    name: string;
  };
}
```

### Frontend Components

#### AuthContext Interface

```typescript
interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  loading: boolean;
  login: (pin: string, userRole: 'admin' | 'staff') => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (action: string) => boolean;
  checkAuth: () => Promise<void>;
  updateSession: () => Promise<void>;
  verifySecurityPIN: (pin: string) => Promise<boolean>;  // New method
}
```

#### AsyncStorage Keys

```typescript
// Authentication keys
'auth_session_token'      // JWT session token
'auth_user_role'          // User role (admin/staff)
'auth_user_id'            // User ID
'auth_user_name'          // User name
'auth_last_login'         // Last login timestamp
'auth_store_id'           // Store ID
'auth_store_name'         // Store name

// PIN keys (local cache)
'admin_login_pin'         // Admin's login PIN (cached)
'admin_security_pin'      // Admin's security PIN (cached)
'staff_login_pin'         // Staff's login PIN (cached)

// Migration keys
'pin_migration_completed' // Migration flag
'admin_pin'               // Legacy key (deprecated)

// Settings keys
'admin_require_pin_delete'  // Require security PIN for delete
'admin_auto_logout'         // Auto-logout enabled
'admin_auto_logout_time'    // Auto-logout timeout (minutes)
```

#### Security Settings Component

```typescript
interface SecuritySettingsState {
  hasLoginPin: boolean;
  hasSecurityPin: boolean;
  requirePinForDelete: boolean;
  autoLogout: boolean;
  autoLogoutTime: number;
}

interface SecuritySettingsActions {
  updateLoginPin: (oldPin: string, newPin: string) => Promise<void>;
  updateSecurityPin: (oldPin: string, newPin: string) => Promise<void>;
  setLoginPin: (pin: string) => Promise<void>;
  setSecurityPin: (pin: string) => Promise<void>;
  removeSecurityPin: (confirmPin: string) => Promise<void>;
  toggleRequirePinForDelete: (enabled: boolean) => Promise<void>;
  toggleAutoLogout: (enabled: boolean) => Promise<void>;
  setAutoLogoutTime: (minutes: number) => Promise<void>;
}
```

#### Product Registration Component

```typescript
interface ProductRegistrationState {
  formData: {
    name: string;
    barcode: string;
    category: string;
    quantity: string;
    price: string;
    expiryDate?: string;
    manufacturerDate?: string;
  };
  image: string | null;
  isPerishable: boolean;
  availableCategories: string[];
  showSecurityPINModal: boolean;
}

interface ProductRegistrationActions {
  validateCategory: (category: string) => Promise<boolean>;
  fetchCategories: () => Promise<void>;
  requestSecurityPIN: () => void;
  verifyAndRegister: (pin: string) => Promise<void>;
}
```

## Data Models

### User Model (MongoDB)

```javascript
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  loginPin: {
    type: String,
    required: true,
    length: 4,
    validate: {
      validator: function(v) {
        return /^\d{4}$/.test(v);
      },
      message: 'Login PIN must be exactly 4 digits'
    }
  },
  securityPin: {
    type: String,
    required: function() {
      return this.role === 'admin';
    },
    length: 4,
    validate: {
      validator: function(v) {
        return !v || /^\d{4}$/.test(v);
      },
      message: 'Security PIN must be exactly 4 digits'
    }
  },
  role: {
    type: String,
    enum: ['author', 'admin', 'staff', 'viewer'],
    default: 'staff'
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: false,
    default: null
  },
  storeName: {
    type: String,
    required: false,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ loginPin: 1, role: 1, storeId: 1 }, { unique: true });
userSchema.index({ storeId: 1, role: 1 });
userSchema.index({ role: 1 });

// Don't return PINs in JSON responses
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.loginPin;
  delete user.securityPin;
  return user;
};
```

### Category Model (MongoDB)

```javascript
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient category lookups
categorySchema.index({ name: 1 });
categorySchema.index({ storeId: 1 });
```

### Migration Data Structure

```typescript
interface MigrationState {
  completed: boolean;
  timestamp: number;
  oldPinFound: boolean;
  newPinsCreated: {
    loginPin: boolean;
    securityPin: boolean;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: PIN Storage Independence

*For any* admin user, the Login PIN and Admin Security PIN should be stored in separate database fields and AsyncStorage keys, even if they have the same value.

**Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2**

### Property 2: Role-Based PIN Requirements

*For any* user creation, if the role is 'admin', then both loginPin and securityPin must be provided; if the role is 'staff', then only loginPin must be provided.

**Validates: Requirements 2.3, 2.4**

### Property 3: Login Authentication Uses Login PIN

*For any* login attempt (admin or staff), the system should validate the entered PIN against the user's loginPin field, not the securityPin field.

**Validates: Requirements 1.3**

### Property 4: Sensitive Operations Require Security PIN

*For any* sensitive operation (product registration, product deletion), if performed by an admin, the system should prompt for and validate the Admin Security PIN; if performed by staff, the system should validate against their admin's Security PIN.

**Validates: Requirements 1.4, 10.1, 10.2, 10.3**

### Property 5: Category Validation Before Registration

*For any* product registration attempt, the system should verify that the specified category exists in the admin-created categories list before allowing the registration to proceed.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Role-Based Navigation After Login

*For any* successful login, if the user role is 'admin', the system should navigate to '/admin/stats'; if the user role is 'staff', the system should navigate to '/(tabs)'.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 7: PIN Migration Preserves Data

*For any* app launch where 'admin_pin' exists in AsyncStorage and 'admin_login_pin' does not exist, the system should copy the value from 'admin_pin' to 'admin_login_pin' without data loss.

**Validates: Requirements 9.1, 9.2, 9.3**

### Property 8: Security PIN Verification for Staff

*For any* staff member attempting a sensitive operation, the entered PIN should be verified against their admin's securityPin (matching storeId) via the backend API.

**Validates: Requirements 10.2, 10.5**

### Property 9: Admin-Only Category Creation

*For any* category creation request, the system should verify that the requesting user has role 'admin' before allowing the category to be created.

**Validates: Requirements 11.5**

### Property 10: UI Text Consistency

*For any* UI screen displaying PIN-related text, the system should use "Login PIN" for authentication contexts and "Admin Security PIN" for authorization contexts, never mixing the terminology.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4**

## Error Handling

### Authentication Errors

```typescript
enum AuthError {
  INVALID_LOGIN_PIN = 'Invalid Login PIN',
  INVALID_SECURITY_PIN = 'Invalid Admin Security PIN',
  USER_NOT_FOUND = 'User not found',
  USER_INACTIVE = 'User account is inactive',
  SESSION_EXPIRED = 'Session expired, please login again',
  NETWORK_ERROR = 'Network error, using offline mode',
  UNAUTHORIZED = 'Unauthorized access'
}
```

### Category Validation Errors

```typescript
enum CategoryError {
  CATEGORY_NOT_FOUND = 'Category not found. Please ask your admin to create this category first.',
  CATEGORY_REQUIRED = 'Category is required',
  CATEGORY_INVALID = 'Invalid category name',
  CATEGORY_EXISTS = 'Category already exists',
  UNAUTHORIZED_CREATE = 'Only admins can create categories'
}
```

### Product Registration Errors

```typescript
enum RegistrationError {
  SECURITY_PIN_REQUIRED = 'Admin Security PIN required for product registration',
  SECURITY_PIN_INVALID = 'Incorrect Admin Security PIN',
  CATEGORY_LOCKED = 'Category is locked and cannot be changed for existing products',
  VALIDATION_FAILED = 'Please fill all required fields correctly',
  NETWORK_ERROR = 'Network error, please try again'
}
```

### Error Handling Strategy

1. **Network Errors:** Fallback to local AsyncStorage for authentication when backend is unavailable
2. **Validation Errors:** Display inline field errors with red highlights and clear error messages
3. **Authorization Errors:** Show modal with explanation and option to retry or cancel
4. **Migration Errors:** Log errors but don't block app functionality, allow manual PIN setup

## Testing Strategy

### Unit Testing

**Authentication Tests:**
- Test login flow with valid/invalid Login PIN
- Test security PIN verification with valid/invalid PIN
- Test role-based navigation after login
- Test session expiration handling
- Test offline mode fallback

**Category Validation Tests:**
- Test category existence check
- Test category creation by admin
- Test category creation rejection for non-admin
- Test product registration with valid/invalid category

**PIN Migration Tests:**
- Test migration from old 'admin_pin' to new keys
- Test migration flag setting
- Test migration with missing old PIN
- Test migration idempotency (running twice doesn't break)

**UI Component Tests:**
- Test security settings PIN update flow
- Test admin layout tab visibility
- Test product registration form validation
- Test category picker display

### Property-Based Testing

Each property test should run a minimum of 100 iterations with randomized inputs.

**Property Test 1: PIN Storage Independence**
- Generate random admin users with random PINs
- Verify loginPin and securityPin are stored separately
- Verify both can have same value but remain independent
- **Feature: admin-auth-ux-improvements, Property 1: PIN Storage Independence**

**Property Test 2: Role-Based PIN Requirements**
- Generate random users with different roles
- Verify admin users require both PINs
- Verify staff users require only loginPin
- **Feature: admin-auth-ux-improvements, Property 2: Role-Based PIN Requirements**

**Property Test 3: Login Authentication Uses Login PIN**
- Generate random login attempts
- Verify system always validates against loginPin
- Verify securityPin is never used for login
- **Feature: admin-auth-ux-improvements, Property 3: Login Authentication Uses Login PIN**

**Property Test 4: Sensitive Operations Require Security PIN**
- Generate random sensitive operations
- Verify Security PIN is always prompted
- Verify correct PIN field is validated based on user role
- **Feature: admin-auth-ux-improvements, Property 4: Sensitive Operations Require Security PIN**

**Property Test 5: Category Validation Before Registration**
- Generate random product registration attempts
- Verify category existence is always checked
- Verify registration fails for non-existent categories
- **Feature: admin-auth-ux-improvements, Property 5: Category Validation Before Registration**

**Property Test 6: Role-Based Navigation After Login**
- Generate random login successes with different roles
- Verify navigation target matches role
- Verify admin → /admin/stats, staff → /(tabs)
- **Feature: admin-auth-ux-improvements, Property 6: Role-Based Navigation After Login**

**Property Test 7: PIN Migration Preserves Data**
- Generate random migration scenarios
- Verify old PIN value is copied to new key
- Verify no data loss during migration
- **Feature: admin-auth-ux-improvements, Property 7: PIN Migration Preserves Data**

**Property Test 8: Security PIN Verification for Staff**
- Generate random staff operations
- Verify PIN is checked against admin's securityPin
- Verify storeId matching is enforced
- **Feature: admin-auth-ux-improvements, Property 8: Security PIN Verification for Staff**

**Property Test 9: Admin-Only Category Creation**
- Generate random category creation attempts
- Verify only admin role can create categories
- Verify staff/viewer roles are rejected
- **Feature: admin-auth-ux-improvements, Property 9: Admin-Only Category Creation**

**Property Test 10: UI Text Consistency**
- Generate random UI screens with PIN references
- Verify "Login PIN" used for authentication
- Verify "Admin Security PIN" used for authorization
- **Feature: admin-auth-ux-improvements, Property 10: UI Text Consistency**

### Integration Testing

- Test complete login → navigation → sensitive operation flow
- Test category creation → product registration flow
- Test PIN migration → login → operation flow
- Test admin layout → settings → PIN update flow
- Test staff login → admin PIN verification flow

### Manual Testing Checklist

- [ ] Admin can log in with Login PIN and access admin pages
- [ ] Staff can log in with Login PIN and access main pages
- [ ] Product registration requires Admin Security PIN
- [ ] Product deletion requires Admin Security PIN (when enabled)
- [ ] Category validation prevents registration with invalid category
- [ ] Admin layout shows correct tabs (no settings, has add-products)
- [ ] Settings button appears on admin stats page
- [ ] Edit category modal displays correctly
- [ ] Add generic price feature works
- [ ] PIN migration preserves existing PINs
- [ ] Staff can use admin's Security PIN for operations
- [ ] UI text consistently uses correct PIN terminology

