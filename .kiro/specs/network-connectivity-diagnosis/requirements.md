# Requirements Document

## Introduction

This document specifies requirements for diagnosing and fixing network connectivity issues in the production APK build of the StockQ inventory management application. Users report that after downloading the APK, all network requests fail with "no network connection" errors, preventing authentication and API communication with the backend services.

The system must identify the root cause of connectivity failures and implement solutions to ensure reliable network communication between the mobile APK and backend APIs deployed on Vercel and Render.

## Glossary

- **APK**: Android Package file, the compiled production build of the mobile application
- **Diagnostic_Tool**: A feature within the app that tests and reports network connectivity status
- **API_Client**: The axios-based HTTP client configured in utils/axiosConfig.ts
- **Backend_API**: The Express.js server deployed on Vercel (https://inventory-application-one.vercel.app/api) or Render (https://inventory-application-xjc5.onrender.com/api)
- **Environment_Variable**: Configuration values (EXPO_PUBLIC_API_URL) embedded during build time
- **Network_Security_Config**: Android-specific XML configuration for network permissions and SSL handling
- **Connection_Test**: A diagnostic check that verifies API endpoint accessibility
- **Error_Logger**: In-app logging system that captures and displays network errors

## Requirements

### Requirement 1: Environment Variable Verification

**User Story:** As a developer, I want to verify that environment variables are correctly embedded in the APK, so that I can confirm the app is using the correct API URL.

#### Acceptance Criteria

1. WHEN the app starts, THE Diagnostic_Tool SHALL display the current EXPO_PUBLIC_API_URL value being used
2. WHEN the environment variable is missing or undefined, THE Diagnostic_Tool SHALL display a warning message with the fallback URL
3. THE Diagnostic_Tool SHALL display all network-related environment variables in a readable format
4. WHEN viewing environment variables, THE Diagnostic_Tool SHALL indicate whether each variable was loaded from build-time or runtime configuration

### Requirement 2: API Endpoint Connectivity Testing

**User Story:** As a user experiencing connection issues, I want to test if the backend API is reachable, so that I can determine if the problem is with my device or the server.

#### Acceptance Criteria

1. WHEN a user initiates a connection test, THE Connection_Test SHALL attempt to reach the Backend_API health endpoint
2. WHEN the Backend_API responds successfully, THE Connection_Test SHALL display the response time and server status
3. WHEN the Backend_API fails to respond within 15 seconds, THE Connection_Test SHALL report a timeout error
4. WHEN a network error occurs, THE Connection_Test SHALL display the specific error code and message
5. THE Connection_Test SHALL test both the Vercel and Render API endpoints independently
6. WHEN testing multiple endpoints, THE Connection_Test SHALL indicate which endpoint is currently configured as active

### Requirement 3: Enhanced Error Logging

**User Story:** As a developer debugging network issues, I want detailed error logs visible in the app, so that I can identify the exact failure point without external debugging tools.

#### Acceptance Criteria

1. WHEN a network request fails, THE Error_Logger SHALL capture the request URL, method, headers, and error details
2. WHEN an error is logged, THE Error_Logger SHALL include a timestamp and error category (timeout, network, server, authentication)
3. THE Error_Logger SHALL store the last 50 network errors in device storage
4. WHEN viewing error logs, THE Error_Logger SHALL display errors in reverse chronological order
5. WHEN a user clears error logs, THE Error_Logger SHALL remove all stored errors and confirm the action
6. THE Error_Logger SHALL distinguish between network errors (ERR_NETWORK, ECONNABORTED) and server errors (4xx, 5xx status codes)

### Requirement 4: Network Request Diagnostics

**User Story:** As a developer, I want to see detailed information about network requests, so that I can diagnose SSL, CORS, or configuration issues.

#### Acceptance Criteria

1. WHEN a network request is made, THE API_Client SHALL log the full request URL being called
2. WHEN a request completes, THE API_Client SHALL log the response status code and duration
3. WHEN a request fails with SSL errors, THE API_Client SHALL log certificate validation details
4. WHEN a request fails with CORS errors, THE API_Client SHALL log the origin and CORS headers
5. THE API_Client SHALL log timeout values for each request type (login uses 5s, others use 15s)

### Requirement 5: Android Network Security Configuration

**User Story:** As a developer, I want to ensure Android network security settings allow HTTPS connections, so that the APK can communicate with backend APIs.

#### Acceptance Criteria

1. WHEN the APK is built, THE Network_Security_Config SHALL allow HTTPS connections to all domains
2. WHEN the APK is built, THE Network_Security_Config SHALL trust system certificate authorities
3. IF cleartext (HTTP) traffic is required for development, THEN THE Network_Security_Config SHALL explicitly allow it only for localhost
4. THE Network_Security_Config SHALL be properly referenced in AndroidManifest.xml

### Requirement 6: Connection Diagnostic Screen

**User Story:** As a user experiencing connection issues, I want a dedicated screen to test connectivity, so that I can troubleshoot problems without technical knowledge.

#### Acceptance Criteria

1. WHEN a user navigates to the diagnostic screen, THE Diagnostic_Tool SHALL display the current API URL
2. WHEN a user taps "Test Connection", THE Diagnostic_Tool SHALL perform a connection test and display results
3. WHEN the connection test succeeds, THE Diagnostic_Tool SHALL display a success message with response time
4. WHEN the connection test fails, THE Diagnostic_Tool SHALL display the error message and suggested actions
5. THE Diagnostic_Tool SHALL provide a button to copy error logs to clipboard
6. THE Diagnostic_Tool SHALL provide a button to retry the connection test
7. WHEN displaying test results, THE Diagnostic_Tool SHALL show network type (WiFi, cellular, none)

### Requirement 7: Timeout and Retry Configuration

**User Story:** As a developer, I want appropriate timeout and retry logic for mobile networks, so that the app handles slow connections gracefully.

#### Acceptance Criteria

1. WHEN making authentication requests, THE API_Client SHALL use a 10-second timeout instead of 5 seconds
2. WHEN a request times out, THE API_Client SHALL retry once before failing
3. WHEN retrying a request, THE API_Client SHALL wait 2 seconds before the retry attempt
4. THE API_Client SHALL not retry requests that fail with 4xx status codes
5. WHEN a request fails after retry, THE API_Client SHALL log both attempts with their respective errors

### Requirement 8: Build Configuration Validation

**User Story:** As a developer, I want to validate that the EAS build configuration correctly embeds environment variables, so that production builds use the correct API endpoints.

#### Acceptance Criteria

1. WHEN building for production, THE build process SHALL use environment variables from eas.json production profile
2. WHEN building for preview, THE build process SHALL use environment variables from eas.json preview profile
3. THE build process SHALL validate that EXPO_PUBLIC_API_URL is set before building
4. WHEN EXPO_PUBLIC_API_URL is missing, THE build process SHALL fail with a clear error message
5. THE build process SHALL log all environment variables being embedded (excluding secrets)

### Requirement 9: Fallback and Offline Mode

**User Story:** As a user with intermittent connectivity, I want the app to handle network failures gracefully, so that I can continue using offline features.

#### Acceptance Criteria

1. WHEN the Backend_API is unreachable, THE API_Client SHALL fall back to local storage authentication
2. WHEN using offline mode, THE API_Client SHALL display a notification indicating offline status
3. WHEN network connectivity is restored, THE API_Client SHALL automatically retry pending requests
4. THE API_Client SHALL distinguish between "server unreachable" and "invalid credentials" errors
5. WHEN falling back to offline mode, THE API_Client SHALL not repeatedly log the same network error

### Requirement 10: Health Check Endpoint

**User Story:** As a developer, I want a dedicated health check endpoint on the backend, so that the diagnostic tool can verify server availability without authentication.

#### Acceptance Criteria

1. THE Backend_API SHALL provide a /health endpoint that returns 200 OK when operational
2. WHEN the /health endpoint is called, THE Backend_API SHALL respond within 5 seconds
3. THE /health endpoint SHALL not require authentication
4. WHEN the /health endpoint responds, THE Backend_API SHALL include server timestamp and version information
5. THE /health endpoint SHALL indicate database connectivity status
