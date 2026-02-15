# Design Document: Network Connectivity Diagnosis

## Overview

This design addresses network connectivity failures in the production APK build of the StockQ application. The system will provide comprehensive diagnostic tools, enhanced error logging, proper Android network configuration, and improved timeout/retry logic to ensure reliable communication between the mobile app and backend APIs.

The solution consists of:
1. Enhanced diagnostic screen with detailed connectivity testing
2. Comprehensive error logging system with in-app viewing
3. Android network security configuration
4. Improved timeout and retry logic in the API client
5. Backend health check endpoint
6. Build-time environment variable validation

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile Application                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Diagnostic Screen (UI Layer)                   │ │
│  │  - Connection testing interface                        │ │
│  │  - Error log viewer                                    │ │
│  │  - Environment variable display                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      Enhanced API Client (Network Layer)               │ │
│  │  - Request/response logging                            │ │
│  │  - Timeout and retry logic                             │ │
│  │  - Error categorization                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │      Error Logger (Storage Layer)                      │ │
│  │  - AsyncStorage persistence                            │ │
│  │  - Log rotation (50 entries max)                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Health Check Endpoint                          │ │
│  │  GET /api/health                                       │ │
│  │  - No authentication required                          │ │
│  │  - Returns server status and timestamp                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Connection Test Flow**:
   - User initiates test from diagnostic screen
   - Diagnostic tool calls health check endpoint
   - API client logs request details
   - Response or error is captured and displayed
   - Error logger persists failure details

2. **Error Logging Flow**:
   - Network request fails in API client
   - Error interceptor categorizes error type
   - Error logger stores details in AsyncStorage
   - User can view logs in diagnostic screen

3. **Build-time Configuration**:
   - EAS build reads eas.json profile
   - Environment variables embedded in APK
   - App reads EXPO_PUBLIC_API_URL at runtime
   - Diagnostic screen displays active configuration

## Components and Interfaces

### 1. Enhanced Diagnostic Screen

**Location**: `app/test-connection.tsx` (existing, to be enhanced)

**Interface**:
```typescript
interface DiagnosticScreenState {
  testing: boolean;
  results: TestResult[];
  errorLogs: NetworkError[];
  envVars: EnvironmentInfo;
}

interface TestResult {
  timestamp: Date;
  testName: string;
  status: 'success' | 'failure' | 'warning';
  message: string;
  duration?: number;
  details?: any;
}

interface EnvironmentInfo {
  apiUrl: string;
  source: 'build-time' | 'fallback';
  buildProfile: string;
}
```

**Functionality**:
- Display current API URL and source
- Run comprehensive connectivity tests
- Show network type (WiFi/cellular/none)
- Display error logs with filtering
- Copy logs to clipboard
- Clear error history

### 2. Network Error Logger

**Location**: `utils/networkLogger.ts` (new file)

**Interface**:
```typescript
interface NetworkError {
  id: string;
  timestamp: Date;
  url: string;
  method: string;
  errorType: 'timeout' | 'network' | 'server' | 'auth' | 'unknown';
  errorCode?: string;
  statusCode?: number;
  message: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  duration?: number;
}

class NetworkLogger {
  async logError(error: NetworkError): Promise<void>;
  async getErrors(limit?: number): Promise<NetworkError[]>;
  async clearErrors(): Promise<void>;
  async getErrorStats(): Promise<ErrorStats>;
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  lastError?: NetworkError;
}
```

**Storage Strategy**:
- Use AsyncStorage with key `network_error_logs`
- Store as JSON array
- Maintain maximum 50 entries (FIFO rotation)
- Include automatic cleanup on app start

### 3. Enhanced API Client

**Location**: `utils/axiosConfig.ts` (existing, to be enhanced)

**Enhancements**:
```typescript
interface RequestMetadata {
  startTime: number;
  retryCount: number;
  originalUrl: string;
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

// Enhanced interceptor configuration
const retryConfig: RetryConfig = {
  maxRetries: 1,
  retryDelay: 2000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNABORTED', 'ERR_NETWORK', 'ETIMEDOUT']
};
```

**Timeout Configuration**:
- Default: 15 seconds
- Authentication endpoints: 10 seconds (increased from 5)
- Health check: 5 seconds
- Retry delay: 2 seconds

### 4. Backend Health Check Endpoint

**Location**: `backend/src/routes/health.js` (new file)

**Interface**:
```typescript
// GET /api/health
interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  version: string;
  database: {
    connected: boolean;
    responseTime?: number;
  };
  uptime: number;
}
```

**Implementation**:
```javascript
router.get('/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbConnected = mongoose.connection.readyState === 1;
    const dbResponseTime = dbConnected ? Date.now() - startTime : null;
    
    res.status(200).json({
      status: dbConnected ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime
      },
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed'
    });
  }
});
```

### 5. Android Network Security Configuration

**Location**: `android/app/src/main/res/xml/network_security_config.xml` (new file)

**Configuration**:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Trust system certificates -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- Allow cleartext for localhost (development only) -->
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">127.0.0.1</domain>
    </domain-config>
</network-security-config>
```

**AndroidManifest.xml Update**:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
</application>
```

### 6. Build Validation Script

**Location**: `scripts/validate-build-env.js` (existing, to be enhanced)

**Functionality**:
```javascript
function validateBuildEnvironment() {
  const requiredVars = ['EXPO_PUBLIC_API_URL'];
  const missing = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
  console.log(`   EXPO_PUBLIC_API_URL: ${process.env.EXPO_PUBLIC_API_URL}`);
}
```

## Data Models

### NetworkError Model

```typescript
interface NetworkError {
  id: string;                    // UUID
  timestamp: Date;               // When error occurred
  url: string;                   // Full request URL
  method: string;                // HTTP method
  errorType: ErrorType;          // Categorized error type
  errorCode?: string;            // Error code (ECONNABORTED, etc.)
  statusCode?: number;           // HTTP status code if available
  message: string;               // Human-readable error message
  requestHeaders?: object;       // Request headers (sanitized)
  responseHeaders?: object;      // Response headers if available
  duration?: number;             // Request duration in ms
  retryAttempt?: number;         // Which retry attempt (0 = first try)
}

type ErrorType = 
  | 'timeout'      // ECONNABORTED, request took too long
  | 'network'      // ERR_NETWORK, no internet connection
  | 'server'       // 5xx status codes
  | 'auth'         // 401, 403 status codes
  | 'client'       // 4xx status codes (except auth)
  | 'unknown';     // Unexpected errors
```

### TestResult Model

```typescript
interface TestResult {
  timestamp: Date;
  testName: string;
  endpoint: string;
  status: 'success' | 'failure' | 'warning';
  message: string;
  duration?: number;
  statusCode?: number;
  errorDetails?: {
    code?: string;
    message?: string;
    stack?: string;
  };
}
```

### EnvironmentInfo Model

```typescript
interface EnvironmentInfo {
  apiUrl: string;
  source: 'build-time' | 'fallback' | 'runtime';
  buildProfile?: 'development' | 'preview' | 'production';
  platform: 'ios' | 'android' | 'web';
  appVersion: string;
  expoVersion: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

