# Design Document: MongoDB Connection Diagnostics Tool

## Overview

The MongoDB Connection Diagnostics Tool is a comprehensive Node.js utility designed to identify and troubleshoot MongoDB connection issues. The tool performs systematic checks across multiple layers: connection string validation, DNS resolution, network connectivity, firewall configuration, and actual MongoDB authentication. It provides detailed diagnostic reports with actionable recommendations to help developers quickly resolve connection problems.

The tool is designed to run as a standalone script in the backend directory and can be used both interactively via CLI and programmatically as an imported module. This dual-mode design allows developers to run quick diagnostics during development and integrate the tool into automated health checks or CI/CD pipelines.

## Architecture

The diagnostic tool follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    CLI Interface                         │
│              (Interactive & Argument Parsing)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Diagnostic Orchestrator                     │
│         (Coordinates all diagnostic tests)               │
└─┬───────┬────────┬────────┬────────┬────────┬──────────┘
  │       │        │        │        │        │
  ▼       ▼        ▼        ▼        ▼        ▼
┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌───┐   ┌────┐
│ 1 │   │ 2 │   │ 3 │   │ 4 │   │ 5 │   │ 6  │
└───┘   └───┘   └───┘   └───┘   └───┘   └────┘
  │       │        │        │        │        │
  ▼       ▼        ▼        ▼        ▼        ▼
┌─────────────────────────────────────────────────────────┐
│              Report Generator                            │
│    (Aggregates results & generates recommendations)     │
└─────────────────────────────────────────────────────────┘

Legend:
1. Connection String Validator
2. DNS Resolver
3. Network Tester
4. MongoDB Connection Validator
5. Firewall Checker
6. Environment Variable Checker
```

Each diagnostic module operates independently and returns structured results. The orchestrator collects all results and passes them to the report generator, which produces a comprehensive diagnostic report with prioritized recommendations.

## Components and Interfaces

### 1. CLI Interface (`cli.js`)

**Purpose:** Entry point for command-line usage, handles argument parsing and user interaction.

**Interface:**
```javascript
// Command-line execution
// node diagnose-mongodb.js [connection-string]

// Exports for programmatic usage
module.exports = {
  runDiagnostics,  // Run all diagnostics
  displayReport    // Format and display results
};
```

**Responsibilities:**
- Parse command-line arguments
- Load environment variables from .env file
- Determine connection string source (argument, env var, or prompt)
- Invoke diagnostic orchestrator
- Display formatted results to console

### 2. Diagnostic Orchestrator (`orchestrator.js`)

**Purpose:** Coordinates execution of all diagnostic tests in logical order.

**Interface:**
```javascript
async function runAllDiagnostics(connectionString, options = {}) {
  // Returns: DiagnosticResults object
}

// DiagnosticResults structure:
{
  timestamp: Date,
  connectionString: String (sanitized),
  results: {
    connectionStringValidation: ValidationResult,
    environmentCheck: EnvironmentResult,
    dnsResolution: DNSResult,
    networkConnectivity: NetworkResult,
    firewallCheck: FirewallResult,
    mongodbConnection: ConnectionResult,
    timeoutTests: TimeoutResult[]
  },
  summary: {
    totalTests: Number,
    passed: Number,
    failed: Number,
    warnings: Number
  }
}
```

**Execution Order:**
1. Environment variable check (fast, informational)
2. Connection string validation (fast, prerequisite)
3. DNS resolution (network-dependent)
4. Network connectivity tests (network-dependent)
5. Firewall check (platform-specific)
6. MongoDB connection attempts (requires all above)
7. Timeout configuration tests (if initial connection fails)

### 3. Connection String Validator (`validators/connectionString.js`)

**Purpose:** Parse and validate MongoDB connection string format.

**Interface:**
```javascript
function validateConnectionString(connectionString) {
  // Returns: ValidationResult
}

// ValidationResult structure:
{
  isValid: Boolean,
  protocol: String,        // 'mongodb' or 'mongodb+srv'
  credentials: {
    username: String,
    password: Boolean      // true if present, don't expose value
  },
  hosts: Array<String>,    // Cluster addresses
  database: String,
  options: Object,         // Query parameters
  errors: Array<String>    // Validation errors if any
}
```

**Validation Rules:**
- Protocol must be `mongodb://` or `mongodb+srv://`
- Credentials format: `username:password@` (optional)
- Host format: `hostname:port` or `hostname` (for SRV)
- Database name must be valid (alphanumeric, hyphens, underscores)
- Query parameters must be valid MongoDB options

### 4. DNS Resolver (`network/dnsResolver.js`)

**Purpose:** Resolve MongoDB hostnames to IP addresses and handle SRV records.

**Interface:**
```javascript
async function resolveDNS(hostname, protocol) {
  // Returns: DNSResult
}

// DNSResult structure:
{
  success: Boolean,
  hostname: String,
  protocol: String,
  resolvedAddresses: Array<String>,  // IP addresses
  srvRecords: Array<{                // Only for mongodb+srv
    hostname: String,
    port: Number,
    priority: Number,
    weight: Number
  }>,
  resolutionTime: Number,            // milliseconds
  error: String                      // If resolution failed
}
```

**Implementation Details:**
- Use Node.js `dns.promises` module
- For `mongodb://`: resolve A/AAAA records
- For `mongodb+srv://`: resolve SRV and TXT records
- Handle DNS timeout (5 seconds)
- Capture specific DNS error codes (ENOTFOUND, ETIMEOUT, etc.)

### 5. Network Tester (`network/portTester.js`)

**Purpose:** Test TCP connectivity to MongoDB ports.

**Interface:**
```javascript
async function testPortConnectivity(hosts, ports = [27017, 27018, 27019]) {
  // Returns: NetworkResult
}

// NetworkResult structure:
{
  tests: Array<{
    host: String,
    port: Number,
    success: Boolean,
    responseTime: Number,  // milliseconds
    error: String          // If connection failed
  }>,
  summary: {
    totalTests: Number,
    successful: Number,
    failed: Number
  }
}
```

**Implementation Details:**
- Use Node.js `net.Socket` for TCP connections
- Test each host-port combination
- Timeout: 5 seconds per connection attempt
- Measure connection establishment time
- Capture socket errors (ETIMEDOUT, ECONNREFUSED, EHOSTUNREACH)

### 6. MongoDB Connection Validator (`validators/mongoConnection.js`)

**Purpose:** Attempt actual MongoDB connection and capture detailed errors.

**Interface:**
```javascript
async function testMongoDBConnection(connectionString, timeout = 10000) {
  // Returns: ConnectionResult
}

// ConnectionResult structure:
{
  success: Boolean,
  connectionTime: Number,     // milliseconds
  serverInfo: {
    host: String,
    database: String,
    version: String,
    readyState: Number
  },
  error: {
    message: String,
    code: String,
    name: String,
    category: String          // 'authentication', 'timeout', 'network', 'configuration'
  }
}
```

**Implementation Details:**
- Use mongoose for connection attempts
- Configure connection options: `serverSelectionTimeoutMS`, `connectTimeoutMS`, `socketTimeoutMS`
- Categorize errors based on error codes:
  - Authentication: error codes 18, 13
  - Timeout: ETIMEDOUT, ESOCKETTIMEDOUT
  - Network: ENOTFOUND, ECONNREFUSED
  - Configuration: Invalid connection string format
- Close connection after successful test

### 7. Firewall Checker (`system/firewallChecker.js`)

**Purpose:** Check Windows Firewall status and rules affecting MongoDB ports.

**Interface:**
```javascript
async function checkFirewall() {
  // Returns: FirewallResult
}

// FirewallResult structure:
{
  platform: String,
  applicable: Boolean,       // false if not Windows
  firewallEnabled: Boolean,
  rules: Array<{
    name: String,
    direction: String,       // 'inbound' or 'outbound'
    action: String,          // 'allow' or 'block'
    ports: Array<Number>,
    protocol: String
  }>,
  potentialBlocks: Array<String>,  // Rule names that might block MongoDB
  error: String
}
```

**Implementation Details:**
- Check `process.platform === 'win32'`
- Use `child_process.exec` to run PowerShell commands:
  - `Get-NetFirewallProfile` - Check if firewall is enabled
  - `Get-NetFirewallRule` - List rules affecting ports 27017-27019
- Parse PowerShell output to identify blocking rules
- Skip on non-Windows platforms with informational message

### 8. Environment Variable Checker (`system/envChecker.js`)

**Purpose:** Verify environment variables are properly loaded.

**Interface:**
```javascript
function checkEnvironmentVariables() {
  // Returns: EnvironmentResult
}

// EnvironmentResult structure:
{
  envFileExists: Boolean,
  envFileLoaded: Boolean,
  variables: {
    MONGO_URI: Boolean,      // true if defined
    DATABASE_URL: Boolean,
    NODE_ENV: String
  },
  warnings: Array<String>
}
```

**Implementation Details:**
- Check if `.env` file exists in backend directory
- Verify `dotenv` has been loaded
- Check for common MongoDB environment variable names
- Don't expose actual values (security)
- Warn if no MongoDB connection string found in environment

### 9. Report Generator (`reporting/reportGenerator.js`)

**Purpose:** Generate comprehensive diagnostic report with recommendations.

**Interface:**
```javascript
function generateReport(diagnosticResults) {
  // Returns: FormattedReport
}

// FormattedReport structure:
{
  summary: String,           // Executive summary
  details: String,           // Detailed test results
  recommendations: Array<{
    priority: String,        // 'critical', 'high', 'medium', 'low'
    issue: String,
    recommendation: String,
    commands: Array<String>  // Optional commands to run
  }>,
  rawResults: Object         // Original diagnostic results
}
```

**Recommendation Logic:**
- DNS failure → Check network connectivity, verify hostname
- Port connectivity failure → Check firewall, network access, VPN
- Authentication error → Verify credentials, check database user permissions
- Timeout → Increase timeout values, check network latency, try different network
- Malformed connection string → Provide correct format examples
- Firewall blocks detected → Provide specific PowerShell commands to add rules
- Environment variables missing → Show how to create .env file

## Data Models

### Connection String Components

```javascript
{
  protocol: 'mongodb' | 'mongodb+srv',
  username: String,
  password: String,
  hosts: Array<{
    hostname: String,
    port: Number
  }>,
  database: String,
  options: {
    retryWrites: Boolean,
    w: String,
    authSource: String,
    // ... other MongoDB options
  }
}
```

### Diagnostic Test Result

```javascript
{
  testName: String,
  status: 'passed' | 'failed' | 'warning' | 'skipped',
  duration: Number,        // milliseconds
  timestamp: Date,
  data: Object,            // Test-specific data
  error: {
    message: String,
    code: String,
    stack: String
  }
}
```

### Recommendation

```javascript
{
  priority: 'critical' | 'high' | 'medium' | 'low',
  category: 'network' | 'firewall' | 'authentication' | 'configuration' | 'environment',
  issue: String,
  recommendation: String,
  actionable: Boolean,
  commands: Array<String>,
  links: Array<{
    title: String,
    url: String
  }>
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Connection String Parsing Round-Trip

*For any* valid MongoDB connection string, parsing it into components and then reconstructing it should produce an equivalent connection string that connects to the same database.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Malformed Connection String Error Reporting

*For any* malformed connection string, the validator should return an error that specifically identifies which component is malformed (protocol, credentials, host, database, or options).

**Validates: Requirements 1.6**

### Property 3: DNS Resolution Result Structure

*For any* hostname that successfully resolves, the DNS resolver should return a result containing at least one IP address and the resolution time.

**Validates: Requirements 2.2**

### Property 4: DNS Error Capture

*For any* hostname that fails to resolve, the DNS resolver should return a result containing a specific DNS error code and error message.

**Validates: Requirements 2.3**

### Property 5: SRV Record Parsing

*For any* valid SRV record response, the DNS resolver should extract all hostnames and port numbers for each cluster node.

**Validates: Requirements 2.5**

### Property 6: Port Connectivity Testing Completeness

*For any* set of hosts and the standard MongoDB ports (27017, 27018, 27019), the network tester should attempt a connection to each host-port combination and record the result.

**Validates: Requirements 3.1, 3.2, 3.3, 3.6**

### Property 7: Successful Connection Recording

*For any* successful port connection, the network tester should record the success status and the response time in milliseconds.

**Validates: Requirements 3.4**

### Property 8: Failed Connection Recording

*For any* failed port connection, the network tester should record the failure status, the error reason, and the timeout duration.

**Validates: Requirements 3.5**

### Property 9: Successful MongoDB Connection Metadata

*For any* successful MongoDB connection, the connection validator should return metadata including host, database name, server version, and connection state.

**Validates: Requirements 4.2**

### Property 10: MongoDB Error Information Capture

*For any* failed MongoDB connection attempt, the connection validator should capture and return both the complete error message and the error code.

**Validates: Requirements 4.3, 4.4**

### Property 11: Firewall Rule Identification

*For any* set of firewall rules, the firewall checker should identify and return all rules that affect the standard MongoDB ports (27017, 27018, 27019) with their allow/block status.

**Validates: Requirements 5.2, 5.3, 5.4**

### Property 12: Credential Sanitization in Reports

*For any* connection string containing credentials, all generated reports should mask the password while preserving enough information to identify the connection configuration.

**Validates: Requirements 6.3, 9.7**

### Property 13: Missing Environment Variable Reporting

*For any* set of required environment variables, if any are undefined, the diagnostic tool should report exactly which variables are missing.

**Validates: Requirements 6.4**

### Property 14: Timeout Test Result Recording

*For any* timeout configuration that results in a successful connection, the connection validator should record which specific timeout value worked.

**Validates: Requirements 7.4**

### Property 15: Failure-to-Recommendation Mapping

*For any* diagnostic test failure (DNS, network, authentication, connection string, timeout, firewall), the report generator should produce at least one actionable recommendation specific to that failure type.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

### Property 16: Complete Diagnostic Report Structure

*For any* completed diagnostic run, the generated report should include all test results, timestamps, success/failure status, error details for failures, and a recommendations section.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 17: Terminal-Friendly Report Formatting

*For any* generated report, the output should use ANSI color codes and formatting characters appropriate for terminal display (newlines, indentation, separators).

**Validates: Requirements 9.6**

### Property 18: Programmatic API Result Structure

*For any* diagnostic function called programmatically, the returned result should be a structured JavaScript object matching the defined schema (not a string or formatted output).

**Validates: Requirements 10.5, 10.6**

## Error Handling

### Connection String Validation Errors

**Invalid Protocol:**
- Error: "Invalid protocol. Must be 'mongodb://' or 'mongodb+srv://'"
- Action: Return validation error with protocol field marked as invalid

**Malformed Credentials:**
- Error: "Invalid credentials format. Expected 'username:password@'"
- Action: Return validation error with credentials field marked as invalid

**Invalid Host Format:**
- Error: "Invalid host format. Expected 'hostname:port' or 'hostname'"
- Action: Return validation error with hosts field marked as invalid

**Missing Required Components:**
- Error: "Connection string missing required component: [component]"
- Action: Return validation error listing all missing components

### DNS Resolution Errors

**ENOTFOUND:**
- Meaning: Hostname does not exist or cannot be resolved
- Recommendation: "Verify the hostname is correct and your DNS server is accessible"

**ETIMEOUT:**
- Meaning: DNS query timed out
- Recommendation: "Check your network connection and DNS server settings"

**ESERVFAIL:**
- Meaning: DNS server returned a failure response
- Recommendation: "DNS server error. Try using a different DNS server (e.g., 8.8.8.8)"

### Network Connectivity Errors

**ETIMEDOUT:**
- Meaning: Connection attempt timed out
- Recommendation: "Port may be blocked by firewall or network. Check firewall rules and network access"

**ECONNREFUSED:**
- Meaning: Connection actively refused by target
- Recommendation: "MongoDB server may not be running or not listening on this port"

**EHOSTUNREACH:**
- Meaning: No route to host
- Recommendation: "Network routing issue. Check VPN, proxy, or network configuration"

**ENETUNREACH:**
- Meaning: Network is unreachable
- Recommendation: "Check your internet connection and network settings"

### MongoDB Connection Errors

**Authentication Failed (Error Code 18):**
- Recommendation: "Verify username and password are correct. Check database user permissions in MongoDB Atlas"

**Unauthorized (Error Code 13):**
- Recommendation: "User does not have permission to access this database. Check user roles in MongoDB Atlas"

**Server Selection Timeout:**
- Recommendation: "Cannot reach MongoDB servers. Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for development)"

**Invalid Connection String:**
- Recommendation: "Connection string format is invalid. Use format: mongodb+srv://username:password@cluster.mongodb.net/database"

### Firewall Check Errors

**PowerShell Execution Error:**
- Meaning: Cannot execute PowerShell commands
- Action: Skip firewall check, report as "Unable to check firewall (insufficient permissions)"

**Platform Not Supported:**
- Meaning: Not running on Windows
- Action: Skip firewall check, report as "Firewall check not applicable (non-Windows platform)"

### General Error Handling Strategy

1. **Never crash**: All errors should be caught and reported gracefully
2. **Provide context**: Include what was being attempted when the error occurred
3. **Actionable messages**: Every error should include a recommendation for resolution
4. **Preserve details**: Capture full error stack traces for debugging
5. **Sanitize output**: Never expose passwords or sensitive data in error messages

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples, edge cases, and error conditions for individual components:

**Connection String Validator:**
- Valid mongodb:// and mongodb+srv:// formats
- Connection strings with and without credentials
- Connection strings with and without database names
- Connection strings with various query parameters
- Malformed protocols, hosts, and options
- Edge cases: special characters in passwords, IPv6 addresses, multiple hosts

**DNS Resolver:**
- Successful A record resolution
- Successful SRV record resolution
- DNS timeout handling
- Invalid hostname handling
- Empty hostname handling

**Network Tester:**
- Successful port connections
- Connection timeouts
- Connection refused scenarios
- Testing multiple hosts
- Edge case: empty host list

**MongoDB Connection Validator:**
- Successful connection with valid credentials
- Authentication failures
- Timeout scenarios
- Invalid connection string handling
- Connection metadata extraction

**Firewall Checker:**
- Windows platform detection
- Non-Windows platform handling
- PowerShell output parsing
- Rule identification logic
- Edge case: no firewall rules found

**Environment Variable Checker:**
- .env file exists and loaded
- .env file missing
- Required variables present
- Required variables missing
- Credential sanitization

**Report Generator:**
- Report structure validation
- Recommendation generation for each error type
- Credential sanitization in output
- Terminal formatting codes
- Edge case: all tests pass, no recommendations needed

### Property-Based Testing

Property-based tests will verify universal properties across many generated inputs. Each test should run a minimum of 100 iterations.

**Property Test 1: Connection String Round-Trip**
- Generate random valid connection strings
- Parse into components
- Verify all components are extracted correctly
- Tag: **Feature: mongodb-connection-diagnostics, Property 1: Connection String Parsing Round-Trip**

**Property Test 2: Malformed String Error Specificity**
- Generate random malformed connection strings (invalid protocol, missing @, invalid characters)
- Verify error message identifies the specific malformed component
- Tag: **Feature: mongodb-connection-diagnostics, Property 2: Malformed Connection String Error Reporting**

**Property Test 3: DNS Result Structure**
- Mock DNS responses with random IP addresses
- Verify result structure contains addresses and timing
- Tag: **Feature: mongodb-connection-diagnostics, Property 3: DNS Resolution Result Structure**

**Property Test 4: DNS Error Structure**
- Mock DNS failures with various error codes
- Verify error code and message are captured
- Tag: **Feature: mongodb-connection-diagnostics, Property 4: DNS Error Capture**

**Property Test 5: SRV Record Extraction**
- Generate random SRV record responses
- Verify all hostnames and ports are extracted
- Tag: **Feature: mongodb-connection-diagnostics, Property 5: SRV Record Parsing**

**Property Test 6: Port Testing Completeness**
- Generate random sets of hosts
- Verify each host-port combination is tested
- Tag: **Feature: mongodb-connection-diagnostics, Property 6: Port Connectivity Testing Completeness**

**Property Test 7: Success Recording Format**
- Mock successful connections with random response times
- Verify success status and timing are recorded
- Tag: **Feature: mongodb-connection-diagnostics, Property 7: Successful Connection Recording**

**Property Test 8: Failure Recording Format**
- Mock failed connections with random errors
- Verify failure status, reason, and timeout are recorded
- Tag: **Feature: mongodb-connection-diagnostics, Property 8: Failed Connection Recording**

**Property Test 9: Connection Metadata Completeness**
- Mock successful MongoDB connections with random metadata
- Verify all required fields are present (host, database, version, state)
- Tag: **Feature: mongodb-connection-diagnostics, Property 9: Successful MongoDB Connection Metadata**

**Property Test 10: Error Information Completeness**
- Mock MongoDB connection failures with random error codes
- Verify both message and code are captured
- Tag: **Feature: mongodb-connection-diagnostics, Property 10: MongoDB Error Information Capture**

**Property Test 11: Firewall Rule Filtering**
- Generate random firewall rules (some affecting MongoDB ports, some not)
- Verify only MongoDB-related rules are returned
- Tag: **Feature: mongodb-connection-diagnostics, Property 11: Firewall Rule Identification**

**Property Test 12: Credential Masking**
- Generate random connection strings with various password formats
- Verify passwords are masked in all report outputs
- Tag: **Feature: mongodb-connection-diagnostics, Property 12: Credential Sanitization in Reports**

**Property Test 13: Missing Variable Identification**
- Generate random sets of environment variables (some missing)
- Verify exactly the missing ones are reported
- Tag: **Feature: mongodb-connection-diagnostics, Property 13: Missing Environment Variable Reporting**

**Property Test 14: Timeout Success Recording**
- Mock connection attempts with random timeout configurations
- Verify successful timeout value is recorded
- Tag: **Feature: mongodb-connection-diagnostics, Property 14: Timeout Test Result Recording**

**Property Test 15: Recommendation Generation**
- Generate random diagnostic failures of each type
- Verify appropriate recommendations are generated for each
- Tag: **Feature: mongodb-connection-diagnostics, Property 15: Failure-to-Recommendation Mapping**

**Property Test 16: Report Completeness**
- Generate random diagnostic results
- Verify report contains all required sections
- Tag: **Feature: mongodb-connection-diagnostics, Property 16: Complete Diagnostic Report Structure**

**Property Test 17: Terminal Formatting**
- Generate random reports
- Verify ANSI codes and formatting characters are present
- Tag: **Feature: mongodb-connection-diagnostics, Property 17: Terminal-Friendly Report Formatting**

**Property Test 18: API Result Structure**
- Call diagnostic functions programmatically with random inputs
- Verify results are objects matching the defined schema
- Tag: **Feature: mongodb-connection-diagnostics, Property 18: Programmatic API Result Structure**

### Integration Testing

Integration tests will verify the complete diagnostic workflow:

1. **End-to-End Diagnostic Run**: Execute full diagnostic with a test MongoDB instance
2. **CLI Argument Parsing**: Test command-line interface with various arguments
3. **Module Import**: Test programmatic usage by importing as a module
4. **Report Generation**: Verify complete report generation from real diagnostic results
5. **Error Scenarios**: Test with intentionally broken configurations (wrong password, invalid host, etc.)

### Testing Tools

- **Unit Testing Framework**: Jest or Mocha
- **Property-Based Testing**: fast-check (JavaScript property-based testing library)
- **Mocking**: Sinon.js for mocking DNS, network, and MongoDB calls
- **Test MongoDB**: MongoDB Memory Server for integration tests
- **Coverage**: Istanbul/nyc for code coverage reporting

### Test Execution

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run property tests only
npm run test:property

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage
```
