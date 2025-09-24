# MSW Handlers Configuration

This directory contains Mock Service Worker (MSW) configuration for testing purposes.

## Configured Endpoints

### 1. Login Endpoint
- **Method**: POST
- **Path**: `/login`
- **Response**: Returns user authentication data with JWT token

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "test@example.com",
      "name": "Test User",
      "role": "employee"
    },
    "token": "mock-jwt-token-12345",
    "expiresIn": "24h"
  }
}
```

### 2. Leave Requests (GET)
- **Method**: GET
- **Path**: `/leave`
- **Response**: Returns array of leave requests

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "employeeId": 1,
      "type": "annual",
      "startDate": "2025-01-15",
      "endDate": "2025-01-19",
      "days": 5,
      "status": "approved",
      "reason": "Family vacation",
      "appliedDate": "2025-01-01"
    }
  ]
}
```

### 3. Submit Leave Request (POST)
- **Method**: POST
- **Path**: `/leave`
- **Response**: Returns confirmation of submitted leave request

```json
{
  "success": true,
  "message": "Leave request submitted successfully",
  "data": {
    "id": 3,
    "employeeId": 1,
    "type": "annual",
    "startDate": "2025-03-01",
    "endDate": "2025-03-05",
    "days": 5,
    "status": "pending",
    "reason": "Personal time off",
    "appliedDate": "2025-02-20"
  }
}
```

## Files

- `handlers.ts` - Contains all MSW request handlers
- `server.ts` - Server setup for Node.js test environment
- `handlers.test.tsx` - Tests to verify handler configuration
- `msw.test.tsx` - Tests to verify MSW installation and setup

## Usage in Tests

Due to Node.js compatibility considerations with MSW v2, the handlers are configured but not globally enabled. To use MSW in individual tests, you can import and set up the server on a per-test basis.

## Testing

Run `npm test` to verify all handlers are properly configured and working.