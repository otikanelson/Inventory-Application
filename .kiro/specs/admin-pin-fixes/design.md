# Design Document: Admin PIN Fixes

## Overview

This design addresses seven critical bugs in the inventory management app's authentication and PIN management system. The fixes ensure proper audio feedback, accurate tour guide content, database schema cleanup, correct Security PIN warnings, proper logout behavior, appropriate staff access handling, and elimination of redundant PIN checks for authenticated admin users.

## Architecture

The app uses a dual-PIN architecture:
- **Login PIN** (`admin_login_pin`): Used for authentication to access admin account
- **Security PIN** (`admin_security_pin`): Used for sensitive operations (product registration, deletion)

Key components:
- **AuthContext**: Manages authentication state and session management
- **Admin Scanner** (`app/admin/scan.tsx`): Barcode scanner in admin dashboard
- **Main Scanner** (`app/(tabs)/scan.tsx`): Barcode scanner in main tabs
- **Security Settings** (`app/admin/settings/security.tsx`): PIN management interface
- **Tour Guide** (`context/AdminTourContext.tsx`, `components/AdminTourOverlay.tsx`): Interactive tutorial
- **hasSecurityPIN utility** (`utils/securityPINCheck.ts`): Checks if Security PIN exists

## Components and Interfaces

### 1. Audio System Enhancement

**Component**: `app/admin/scan.tsx`

**Current State**:
- Admin scanner imports `useAudioPlayer` but doesn't play sounds
- Main scanner successfully plays beep sounds on scan

**Changes**:
```typescript
// In handleBarCodeScanned function, add audio playback:
// After successful scan operations, call:
scanBeep.play();
```

**Integration Points**:
- Add `scanBeep.play()` after successful product lookups
- Add `scanBeep.play()` after adding items to cart
- Add `scanBeep.play()` after successful registry operations

### 2. Tour Guide Updates

**Component**: `context/AdminTourContext.tsx`

**Current State**:
- Tour guide has outdated content
- Missing references to new security features
- Incorrect UI element positions

**Changes**:
```typescript
export const adminTourSteps = [
  // Update step 5 to include both PIN types:
  { 
    id: 5, 
    screen: '/admin/settings', 
    title: 'Security & PIN Management', 
    description: 'Set up your Login PIN for authentication and Security PIN for sensitive operations. Enable auto-logout for extra security.', 
    highlight: { x: 20, y: 200, width: 390, height: 300 } 
  },
  // ... other steps remain the same
];
```

**Integration Points**:
- Update step descriptions to mention dual-PIN system
- Verify highlight coordinates match current UI layout
- Add references to new security settings

### 3. Database Schema Cleanup

**Component**: Backend database migration script

**Current State**:
- Old `pin` field exists in user documents
- New `loginPin` and `securityPin` fields are in use

**Changes**:
```javascript
// Create migration script: backend/scripts/remove-pin-field.js
const mongoose = require('mongoose');
const User = require('../models/User');

async function removePinField() {
  try {
    const result = await User.updateMany(
      { pin: { $exists: true } },
      { $unset: { pin: "" } }
    );
    console.log(`Removed 'pin' field from ${result.modifiedCount} users`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}
```

**Integration Points**:
- Run as one-time migration script
- Log number of records updated
- Verify loginPin and securityPin fields remain intact

### 4. Security PIN Warning Fix

**Component**: `utils/securityPINCheck.ts`

**Current State**:
```typescript
export const hasSecurityPIN = async (): Promise<boolean> => {
  try {
    const pin = await AsyncStorage.getItem('admin_security_pin');
    return pin !== null && pin.length === 4;
  } catch (error) {
    console.error('Error checking security PIN:', error);
    return false;
  }
};
```

**Issue**: Function is correct, but components may be checking at wrong times or not respecting the result.

**Changes**:
- No changes to utility function (it's already correct)
- Fix components that call it to properly respect the return value
- Ensure warning only shows when `hasSecurityPIN()` returns `false`

**Integration Points**:
- Verify all callers properly await the function
- Ensure warning modal state is set based on actual return value
- Add logging to track when warnings are shown

### 5. Logout Flow Correction

**Component**: `context/AuthContext.tsx`

**Current State**:
```typescript
const logout = async () => {
  try {
    await AsyncStorage.multiRemove([
      'auth_session_token',
      'auth_last_login',
    ]);
    // ... rest of logout
  }
}
```

**Issue**: Only removes session token and last login, leaves user identity intact.

**Changes**:
```typescript
const logout = async () => {
  try {
    await AsyncStorage.multiRemove([
      'auth_session_token',
      'auth_last_login',
      'auth_user_role',
      'auth_user_id',
      'auth_user_name',
      'auth_store_id',
      'auth_store_name',
    ]);

    setUser(null);
    setRole(null);
    setIsAuthenticated(false);

    Toast.show({
      type: 'success',
      text1: 'Logged Out',
      text2: 'Session ended successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    Toast.show({
      type: 'error',
      text1: 'Logout Failed',
      text2: 'Could not end session',
    });
  }
};
```

**Integration Points**:
- Ensure all auth-related AsyncStorage keys are removed
- Verify state is fully reset
- Check that no automatic re-login logic triggers after logout

### 6. Staff Admin Access Handling

**Component**: `app/admin/_layout.tsx`

**Current State**:
- Shows generic "set new PIN" message for all users
- Doesn't distinguish between admin and staff users

**Changes**:
```typescript
const checkAuth = async () => {
  try {
    const storedPin = await AsyncStorage.getItem("admin_pin");
    const userRole = await AsyncStorage.getItem("auth_user_role");
    const hasSecurityPin = await AsyncStorage.getItem("admin_security_pin");
    
    // If no PIN exists at all, allow entry but show setup prompt
    if (!storedPin) {
      setHasPin(false);
      setIsAuthenticated(true);
      
      // Different message for staff vs admin
      if (userRole === 'staff') {
        // Show message that admin must set PIN first
        setShowStaffWarning(true);
      } else {
        setShowSetupModal(true);
      }
      setLoading(false);
      return;
    }
    
    // ... rest of auth check
  }
}
```

**Integration Points**:
- Check user role before showing PIN setup
- For staff: show warning that admin must set Security PIN
- For admin: show normal setup flow
- Update modal text to be role-appropriate

### 7. Redundant PIN Check Elimination

**Components**: 
- `app/admin/scan.tsx`
- `app/admin/add-products.tsx`

**Current State**:
- Both components check for Security PIN on mount
- Show warning even when admin is already authenticated

**Changes**:
```typescript
// In both components, update the Security PIN check:
useEffect(() => {
  const checkSecurityPIN = async () => {
    // Check if user is authenticated as admin
    const userRole = await AsyncStorage.getItem('auth_user_role');
    
    // Only check Security PIN for staff users
    if (userRole === 'staff') {
      const pinSet = await hasSecurityPIN();
      if (!pinSet) {
        setSecurityPINWarningVisible(true);
      }
    }
    // Admin users don't need Security PIN prompt when already authenticated
  };
  checkSecurityPIN();
}, []);
```

**Integration Points**:
- Check `auth_user_role` before showing Security PIN warning
- Skip warning for authenticated admin users
- Still show warning for staff users who need admin's Security PIN

## Data Models

### AsyncStorage Keys

```typescript
// Authentication
'auth_session_token': string      // Session identifier
'auth_user_role': 'admin' | 'staff' | 'viewer'
'auth_user_id': string
'auth_user_name': string
'auth_store_id': string
'auth_store_name': string
'auth_last_login': string         // Timestamp

// PINs
'admin_login_pin': string         // 4-digit authentication PIN
'admin_security_pin': string      // 4-digit sensitive operations PIN
'admin_pin': string               // Legacy admin dashboard PIN

// Settings
'admin_auto_logout': 'true' | 'false'
'admin_auto_logout_time': string  // Minutes
'admin_require_security_pin_delete': 'true' | 'false'
```

### User Database Schema

```typescript
interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff' | 'viewer';
  loginPin: string;        // 4-digit authentication PIN
  securityPin?: string;    // 4-digit sensitive operations PIN (optional)
  storeId?: string;
  storeName?: string;
  // pin: string;          // REMOVED - old field to be deleted
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Audio Feedback Consistency
*For any* successful scan operation in admin scanner, the system should play the same audio feedback as the main scanner.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Tour Guide Content Accuracy
*For any* tour guide step referencing security settings, the description should accurately reflect the dual-PIN system (Login PIN and Security PIN).
**Validates: Requirements 2.1, 2.4**

### Property 3: Database Schema Consistency
*For any* user document in the database after migration, the document should not contain a 'pin' field.
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Security PIN Warning Accuracy
*For any* check of Security PIN status, if `admin_security_pin` exists in AsyncStorage, then `hasSecurityPIN()` should return true and no warning should be displayed.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 5: Logout Completeness
*For any* logout operation, all authentication-related AsyncStorage keys (`auth_session_token`, `auth_user_role`, `auth_user_id`, `auth_user_name`, `auth_store_id`, `auth_store_name`, `auth_last_login`) should be removed.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7**

### Property 6: Staff Access Messaging
*For any* staff user accessing admin dashboard when Security PIN doesn't exist, the system should display a message indicating the admin must set the Security PIN first, not a "set new PIN" message.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 7: Admin Authentication Bypass
*For any* authenticated admin user (where `auth_user_role` equals 'admin'), accessing admin scanner or add-products page should not prompt for Security PIN.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

### Property 8: Staff Security PIN Verification
*For any* staff user accessing sensitive operations, the system should verify the entered PIN against the admin's Security PIN (from backend or local storage).
**Validates: Requirements 6.4, 6.5, 6.6, 6.7**

### Property 9: Staff PIN Prompt Requirement
*For any* staff user accessing admin scanner or add-products page, the system should always prompt for the admin's Security PIN.
**Validates: Requirements 7.7, 7.8**

## Error Handling

### Audio Playback Errors
- If audio file fails to load, log error but don't block scanning
- Provide haptic feedback as fallback

### AsyncStorage Errors
- Wrap all AsyncStorage operations in try-catch
- Log errors for debugging
- Provide sensible defaults (e.g., assume no PIN if read fails)

### Network Errors (Staff PIN Verification)
- If backend is unavailable, fall back to local `admin_security_pin`
- Show "(Offline)" indicator in toast messages
- Log network failures for monitoring

### Migration Errors
- Log any documents that fail to update
- Don't throw errors that would stop migration
- Provide summary of successful vs failed updates

## Testing Strategy

### Unit Tests
- Test `hasSecurityPIN()` with various AsyncStorage states
- Test logout function removes all required keys
- Test role-based logic for PIN prompts
- Test audio playback integration

### Integration Tests
- Test complete logout flow from authenticated state to logged out
- Test staff user accessing admin features with and without Security PIN
- Test admin user accessing features without redundant PIN prompts
- Test tour guide navigation and content display

### Property-Based Tests
Each property test should run minimum 100 iterations and be tagged with the corresponding property number.

**Property 1 Test**: Generate random scan scenarios (lookup, register, sales) and verify audio plays for each successful scan in admin scanner.

**Property 2 Test**: For each tour step, verify that if it mentions security/PIN, the description includes both "Login PIN" and "Security PIN" terminology.

**Property 3 Test**: After migration, query random user documents and verify none contain 'pin' field.

**Property 4 Test**: Generate random AsyncStorage states with/without `admin_security_pin` and verify `hasSecurityPIN()` returns correct boolean and warning displays accordingly.

**Property 5 Test**: Perform logout with various pre-logout AsyncStorage states and verify all auth keys are removed.

**Property 6 Test**: Generate scenarios with staff users and missing Security PIN, verify correct warning message is shown (not "set new PIN").

**Property 7 Test**: Generate scenarios with authenticated admin users accessing protected pages, verify no Security PIN prompt appears.

**Property 8 Test**: Generate random PINs for staff verification, verify system checks against admin's Security PIN correctly.

**Property 9 Test**: Generate scenarios with staff users accessing protected pages, verify Security PIN prompt always appears.

### Manual Testing Checklist
- [ ] Scan products in admin scanner and verify audio plays
- [ ] Complete tour guide and verify all content is accurate
- [ ] Run migration script and verify 'pin' field is removed
- [ ] Set Security PIN, restart app, verify no warning appears
- [ ] Log out as admin, verify complete logout (no auto re-login)
- [ ] Log in as staff, verify appropriate PIN messaging
- [ ] Access admin scanner as admin, verify no redundant PIN prompt
- [ ] Access add-products as admin, verify no redundant PIN prompt
- [ ] Access admin scanner as staff, verify PIN prompt appears
- [ ] Access add-products as staff, verify PIN prompt appears
