# Requirements Document

## Introduction

This specification addresses critical authentication and UX issues in the admin system, focusing on proper PIN differentiation, security settings corrections, product registration validation, navigation flow improvements, and UI fixes.

## Glossary

- **Login_PIN**: The 4-digit PIN used by any user (admin or staff) to authenticate and log into their account
- **Admin_Security_PIN**: The 4-digit PIN used exclusively by admins to authorize sensitive operations (product registration, product deletion)
- **Admin**: A user with elevated privileges who manages a store, has both a Login PIN and an Admin Security PIN
- **Staff**: A user who works under an admin in the same store, has only a Login PIN
- **Product_Registry**: The global database of all products that can be added to inventory
- **Category**: A product classification that must be created by an admin before products can be registered under it
- **Admin_Pages**: The administrative interface accessible at /admin/* routes
- **Main_Pages**: The standard user interface accessible at /(tabs)/* routes
- **Backend_User_Model**: The MongoDB schema storing user authentication data including PINs
- **AsyncStorage**: Local device storage for caching authentication data and settings

## Requirements

### Requirement 1: PIN System Differentiation

**User Story:** As a system architect, I want clear separation between login authentication and security authorization, so that the system properly distinguishes between accessing the admin panel and performing sensitive operations.

#### Acceptance Criteria

1. THE System SHALL store Login PIN and Admin Security PIN as separate fields in the backend User model
2. THE System SHALL store Login PIN and Admin Security PIN as separate keys in AsyncStorage
3. WHEN an admin or staff logs in, THE System SHALL validate against their Login PIN
4. WHEN an admin performs a sensitive operation, THE System SHALL validate against the Admin Security PIN
5. THE System SHALL allow Login PIN and Admin Security PIN to have the same value but store them independently
6. WHEN a staff member attempts to use Admin Security PIN, THE System SHALL verify the PIN belongs to their admin (same store)

### Requirement 2: Backend Database Schema Updates

**User Story:** As a backend developer, I want the User model to store both PIN types separately, so that authentication and authorization can be properly enforced.

#### Acceptance Criteria

1. THE User_Model SHALL have a field named `loginPin` for authentication
2. THE User_Model SHALL have a field named `securityPin` for authorization (admin role only)
3. WHEN a user is created with admin role, THE System SHALL require both loginPin and securityPin
4. WHEN a user is created with staff role, THE System SHALL require only loginPin
5. THE System SHALL migrate existing `pin` field data to `loginPin` field for backward compatibility
6. THE System SHALL validate that both PIN fields contain exactly 4 digits

### Requirement 3: Security Settings Corrections

**User Story:** As an admin, I want the security settings to correctly reference Admin Security PIN for sensitive operations, so that I understand which PIN protects which actions.

#### Acceptance Criteria

1. WHEN the security settings page displays "Require PIN for delete", THE System SHALL label it as "Require Admin Security PIN for delete"
2. WHEN a product deletion is attempted with PIN requirement enabled, THE System SHALL prompt for Admin Security PIN
3. THE System SHALL update all UI text to distinguish between "Login PIN" and "Admin Security PIN"
4. THE Security_Settings_Page SHALL have separate sections for "Login PIN Management" and "Admin Security PIN Management"
5. WHEN a staff member views security settings, THE System SHALL show only Login PIN options

### Requirement 4: Product Registration Category Validation

**User Story:** As a system administrator, I want to prevent product registration when the category doesn't exist, so that the product catalog remains organized and consistent.

#### Acceptance Criteria

1. WHEN a user attempts to register a product, THE System SHALL validate that the category exists in the admin-created categories list
2. IF the category does not exist, THEN THE System SHALL reject the registration with error message "Category not found. Please ask your admin to create this category first."
3. THE System SHALL fetch the list of valid categories from the backend API endpoint `/categories`
4. WHEN displaying the category picker, THE System SHALL show only admin-created categories
5. THE System SHALL provide clear feedback when a category is invalid during form validation

### Requirement 5: Admin Navigation Flow Correction

**User Story:** As an admin, I want to be directed to admin pages when I log in, so that I can immediately access administrative functions without extra navigation.

#### Acceptance Criteria

1. WHEN a user with admin role completes login, THE System SHALL navigate to `/admin/stats` (admin home page)
2. WHEN a user with staff role completes login, THE System SHALL navigate to `/(tabs)` (main pages)
3. THE Login_Flow SHALL detect user role from authentication response
4. THE System SHALL store the user role in AuthContext for routing decisions
5. WHEN an admin manually navigates to main pages, THE System SHALL allow access (no restriction)

### Requirement 6: Admin Tab Layout Modifications

**User Story:** As an admin, I want quick access to product management from the admin tabs, so that I can efficiently manage inventory without navigating through multiple screens.

#### Acceptance Criteria

1. THE Admin_Layout SHALL remove the settings tab from the bottom navigation
2. THE Admin_Layout SHALL add an "add-products" tab to the bottom navigation
3. THE Admin_Stats_Page SHALL display a settings button in the header or main content area
4. WHEN the settings button is pressed, THE System SHALL navigate to `/admin/settings`
5. THE Admin_Layout SHALL maintain the existing tabs: sales, inventory, scan, stats, and add the new add-products tab

### Requirement 7: Edit Category Modal UI Fix

**User Story:** As an admin, I want the edit category modal to be properly designed and functional, so that I can efficiently manage product categories.

#### Acceptance Criteria

1. WHEN the edit category modal is opened in `/admin/product/[id]`, THE System SHALL display a properly styled modal
2. THE Modal SHALL have consistent spacing, borders, and colors matching the app theme
3. THE Modal SHALL include input validation for category name
4. WHEN the category is updated, THE System SHALL refresh the product details to reflect changes
5. THE Modal SHALL have clear "Cancel" and "Save" buttons with proper touch targets

### Requirement 8: Add Generic Price Feature Fix

**User Story:** As an admin, I want to add generic prices to products, so that I can set default pricing for items without individual batch prices.

#### Acceptance Criteria

1. WHEN the "Add Generic Price" feature is triggered, THE System SHALL display a price input modal
2. THE System SHALL validate that the price is a positive number
3. WHEN a generic price is saved, THE System SHALL update the product in the backend
4. THE Product_Detail_Page SHALL display the generic price when no batch-specific price exists
5. THE System SHALL persist generic prices across app restarts

### Requirement 9: AsyncStorage Key Migration

**User Story:** As a developer, I want to migrate existing PIN storage keys smoothly, so that existing users don't lose their authentication data.

#### Acceptance Criteria

1. WHEN the app launches, THE System SHALL check for the old `admin_pin` key in AsyncStorage
2. IF `admin_pin` exists and `admin_login_pin` does not exist, THEN THE System SHALL copy `admin_pin` value to `admin_login_pin`
3. THE System SHALL preserve the old `admin_pin` key for backward compatibility during migration period
4. THE System SHALL log migration actions for debugging purposes
5. WHEN migration is complete, THE System SHALL set a flag `pin_migration_completed` in AsyncStorage

### Requirement 10: Staff Admin Security PIN Access

**User Story:** As a staff member, I want to use my admin's Security PIN for sensitive operations, so that I can perform necessary tasks when authorized by my admin.

#### Acceptance Criteria

1. WHEN a staff member attempts a sensitive operation, THE System SHALL prompt for Admin Security PIN
2. THE System SHALL verify the entered PIN against the admin's Security PIN (same storeId)
3. IF the PIN matches the admin's Security PIN, THEN THE System SHALL authorize the operation
4. IF the PIN does not match, THEN THE System SHALL deny access with error "Incorrect Admin Security PIN"
5. THE System SHALL make an API call to `/auth/verify-admin-security-pin` with storeId and PIN

### Requirement 11: Backend API Endpoints

**User Story:** As a backend developer, I want API endpoints for PIN verification and category validation, so that the frontend can properly enforce security and data integrity.

#### Acceptance Criteria

1. THE Backend SHALL provide endpoint `POST /auth/verify-admin-security-pin` accepting `{ storeId, pin }`
2. THE Endpoint SHALL return `{ success: true }` if PIN matches the admin's Security PIN for that store
3. THE Backend SHALL provide endpoint `GET /categories` returning all admin-created categories
4. THE Backend SHALL provide endpoint `POST /categories` for admins to create new categories
5. THE Backend SHALL validate that only admin role can create categories

### Requirement 12: UI Text and Label Updates

**User Story:** As a user, I want clear and consistent terminology throughout the app, so that I understand which PIN is required for each action.

#### Acceptance Criteria

1. THE System SHALL replace all instances of "Admin PIN" with either "Login PIN" or "Admin Security PIN" based on context
2. THE Security_Settings_Page SHALL have section headers "Login PIN Management" and "Admin Security PIN Management"
3. THE Product_Registration_Flow SHALL display "Admin Security PIN Required" when prompting for authorization
4. THE Delete_Product_Modal SHALL display "Enter Admin Security PIN" when PIN is required
5. THE System SHALL provide help tooltips explaining the difference between Login PIN and Admin Security PIN

