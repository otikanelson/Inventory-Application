# Requirements Document

## Introduction

This specification addresses critical bugs in the inventory management app's authentication and PIN management system. The app uses a dual-PIN architecture (loginPin for authentication, securityPin for sensitive operations) but has several issues causing poor user experience, security warnings appearing incorrectly, and authentication flow problems.

## Glossary

- **Login_PIN**: 4-digit PIN used for user authentication to access the admin account
- **Security_PIN**: 4-digit PIN used to authorize sensitive operations (product registration, deletion)
- **Admin_User**: User with admin role who owns the store and has full permissions
- **Staff_User**: User with staff role who works for an admin and has limited permissions
- **Scanner**: Barcode scanning interface for product lookup, registration, and sales
- **Admin_Scanner**: Scanner interface accessible from admin dashboard
- **Main_Scanner**: Scanner interface accessible from main tabs
- **Tour_Guide**: Interactive tutorial overlay showing feature locations and usage
- **AsyncStorage**: Local storage mechanism for persisting user data and settings
- **hasSecurityPIN**: Utility function that checks if admin_security_pin exists in AsyncStorage
- **Auto_Re-login**: Unintended behavior where logout automatically triggers login

## Requirements

### Requirement 1: Admin Scanner Audio Feedback

**User Story:** As an admin user, I want to hear audio feedback when scanning products in the admin scanner, so that I have the same confirmation experience as the main scanner.

#### Acceptance Criteria

1. WHEN a product is successfully scanned in admin scanner THEN the System SHALL play the scan beep sound
2. WHEN a product is added to cart in admin scanner THEN the System SHALL play the scan beep sound
3. WHEN the admin scanner plays audio THEN the System SHALL use the same audio files as the main scanner
4. WHEN comparing audio behavior THEN the admin scanner SHALL match the main scanner's audio feedback patterns

### Requirement 2: Tour Guide Content Updates

**User Story:** As an admin user, I want the tour guide to show current settings features and their correct positions, so that I can learn about all available functionality.

#### Acceptance Criteria

1. WHEN the tour guide displays settings features THEN the System SHALL include all current security settings options
2. WHEN the tour guide shows feature positions THEN the System SHALL use accurate coordinates for each UI element
3. WHEN new settings are added THEN the tour guide SHALL reflect those additions
4. WHEN the tour guide references PIN settings THEN the System SHALL distinguish between Login PIN and Security PIN

### Requirement 3: Database PIN Field Cleanup

**User Story:** As a system administrator, I want the old 'pin' field removed from the user database, so that the schema reflects the current dual-PIN architecture.

#### Acceptance Criteria

1. WHEN querying user records THEN the System SHALL NOT return a 'pin' field
2. WHEN the migration runs THEN the System SHALL remove the 'pin' field from all user documents
3. WHEN the migration completes THEN the System SHALL preserve loginPin and securityPin fields
4. WHEN the migration runs THEN the System SHALL log the number of records updated

### Requirement 4: Security PIN Warning Accuracy

**User Story:** As an admin user, I want to see the Security PIN warning only when I actually don't have one set, so that I'm not repeatedly prompted unnecessarily.

#### Acceptance Criteria

1. WHEN hasSecurityPIN checks for Security PIN THEN the System SHALL verify admin_security_pin exists in AsyncStorage
2. WHEN admin_security_pin exists in AsyncStorage THEN hasSecurityPIN SHALL return true
3. WHEN admin_security_pin does not exist in AsyncStorage THEN hasSecurityPIN SHALL return false
4. WHEN hasSecurityPIN returns true THEN the System SHALL NOT display the Security PIN warning
5. WHEN hasSecurityPIN returns false THEN the System SHALL display the Security PIN warning

### Requirement 5: Logout Flow Correction

**User Story:** As an admin user, I want to stay logged out when I log out from the admin profile, so that I don't get automatically logged back in.

#### Acceptance Criteria

1. WHEN an admin user logs out THEN the System SHALL clear auth_session_token from AsyncStorage
2. WHEN an admin user logs out THEN the System SHALL clear auth_user_role from AsyncStorage
3. WHEN an admin user logs out THEN the System SHALL clear auth_user_id from AsyncStorage
4. WHEN an admin user logs out THEN the System SHALL clear auth_user_name from AsyncStorage
5. WHEN logout completes THEN the System SHALL NOT automatically trigger login
6. WHEN logout completes THEN the System SHALL navigate to the login screen
7. WHEN logout completes THEN the System SHALL set isAuthenticated to false

### Requirement 6: Staff Admin Access PIN Handling

**User Story:** As a staff member, I want to be prompted for my admin's existing Security PIN when accessing sensitive operations, so that I don't see confusing "set new PIN" messages.

#### Acceptance Criteria

1. WHEN a staff user accesses admin dashboard THEN the System SHALL check if admin Security PIN exists
2. WHEN admin Security PIN exists and staff accesses sensitive operation THEN the System SHALL prompt for existing Security PIN
3. WHEN admin Security PIN does not exist and staff accesses sensitive operation THEN the System SHALL display warning that admin must set Security PIN first
4. WHEN staff enters Security PIN THEN the System SHALL verify against admin's Security PIN from backend
5. IF backend is unavailable WHEN staff enters Security PIN THEN the System SHALL verify against local admin_security_pin
6. WHEN staff Security PIN verification succeeds THEN the System SHALL allow the sensitive operation
7. WHEN staff Security PIN verification fails THEN the System SHALL deny access and show error message

### Requirement 7: Redundant PIN Check Elimination

**User Story:** As an admin user, I want to avoid being asked for Security PIN when I'm already authenticated as admin, so that I have a smoother workflow.

#### Acceptance Criteria

1. WHEN admin user is authenticated with role 'admin' THEN the System SHALL NOT prompt for Security PIN on admin scanner
2. WHEN admin user is authenticated with role 'admin' THEN the System SHALL NOT prompt for Security PIN on add-products page
3. WHEN admin user accesses admin scanner THEN the System SHALL check auth_user_role in AsyncStorage
4. WHEN auth_user_role equals 'admin' THEN the System SHALL skip Security PIN prompt
5. WHEN admin user accesses add-products page THEN the System SHALL check auth_user_role in AsyncStorage
6. WHEN auth_user_role equals 'admin' THEN the System SHALL skip Security PIN prompt
7. WHEN staff user accesses admin scanner THEN the System SHALL prompt for admin's Security PIN
8. WHEN staff user accesses add-products page THEN the System SHALL prompt for admin's Security PIN
