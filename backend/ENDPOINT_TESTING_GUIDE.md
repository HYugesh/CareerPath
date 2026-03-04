# Code Execution Endpoints - Manual Testing Guide

This guide provides step-by-step instructions for testing all three code execution endpoints using curl or Postman.

## Prerequisites

- Backend server running on `http://localhost:5001`
- MongoDB connected
- A verified user account (or create one and verify via email)

## Test Sequence

### 1. Get Authentication Token

First, you need to login to get a JWT token:

**Request:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "your-email@example.com",
    "password": "YourPassword123"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "name": "Your Name",
    "email": "your-email@example.com"
  }
}
```

**Save the token** - You'll need it for the next tests. Replace `YOUR_TOKEN_HERE` in the commands below with your actual token.

---

### 2. Test GET /api/code/languages (No Authentication Required)

This endpoint returns all supported programming languages from Piston API.

**Request:**
```bash
curl -X GET http://localhost:5001/api/code/languages
```

**Expected Response:**
```json
{
  "success": true,
  "languages": [
    {
      "language": "javascript",
      "version": "18.15.0",
      "aliases": ["js", "node-javascript", "node-js"]
    },
    {
      "language": "python",
      "version": "3.10.0",
      "aliases": ["py", "py3", "python3"]
    },
    // ... 85+ more languages
  ]
}
```

**Validation Checklist:**
- [ ] Status code is 200
- [ ] Response has `success: true`
- [ ] `languages` array contains at least 50 languages
- [ ] Required languages are present: javascript, python, java, c++, c

---

### 3. Test POST /api/code/run (Authentication Required)

This endpoint executes code against public test cases and returns detailed results.

**Request:**
```bash
curl -X POST http://localhost:5001/api/code/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "code": "function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) { return [map.get(complement), i]; } map.set(nums[i], i); } return []; }",
    "language": "javascript",
    "functionName": "twoSum",
    "testCases": [
      {
        "input": { "nums": [2, 7, 11, 15], "target": 9 },
        "expectedOutput": [0, 1]
      },
      {
        "input": { "nums": [3, 2, 4], "target": 6 },
        "expectedOutput": [1, 2]
      },
      {
        "input": { "nums": [3, 3], "target": 6 },
        "expectedOutput": [0, 1]
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "results": [
    {
      "input": { "nums": [2, 7, 11, 15], "target": 9 },
      "expectedOutput": [0, 1],
      "actualOutput": "[0,1]",
      "passed": true,
      "error": null,
      "executionTime": 45
    },
    {
      "input": { "nums": [3, 2, 4], "target": 6 },
      "expectedOutput": [1, 2],
      "actualOutput": "[1,2]",
      "passed": true,
      "error": null,
      "executionTime": 42
    },
    {
      "input": { "nums": [3, 3], "target": 6 },
      "expectedOutput": [0, 1],
      "actualOutput": "[0,1]",
      "passed": true,
      "error": null,
      "executionTime": 40
    }
  ],
  "summary": {
    "total": 3,
    "passed": 3,
    "failed": 0,
    "score": 100
  }
}
```

**Validation Checklist:**
- [ ] Status code is 200
- [ ] Response has `success: true`
- [ ] All 3 tests passed
- [ ] Each result has: input, expectedOutput, actualOutput, passed, error, executionTime
- [ ] Summary shows: total=3, passed=3, failed=0, score=100
- [ ] Execution time is reasonable (< 5000ms per test)

---

### 4. Test POST /api/code/run with Python

Test the same endpoint with Python code:

**Request:**
```bash
curl -X POST http://localhost:5001/api/code/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "code": "def two_sum(nums, target):\n    num_map = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in num_map:\n            return [num_map[complement], i]\n        num_map[num] = i\n    return []",
    "language": "python",
    "functionName": "two_sum",
    "testCases": [
      {
        "input": { "nums": [2, 7, 11, 15], "target": 9 },
        "expectedOutput": [0, 1]
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "results": [
    {
      "input": { "nums": [2, 7, 11, 15], "target": 9 },
      "expectedOutput": [0, 1],
      "actualOutput": "[0, 1]",
      "passed": true,
      "error": null,
      "executionTime": 50
    }
  ],
  "summary": {
    "total": 1,
    "passed": 1,
    "failed": 0,
    "score": 100
  }
}
```

**Validation Checklist:**
- [ ] Python code executes successfully
- [ ] Test passes with correct output
- [ ] Score is 100%

---

### 5. Test POST /api/code/submit (Authentication Required)

This endpoint executes code against all test cases (public + private) and returns only summary statistics.

**Request:**
```bash
curl -X POST http://localhost:5001/api/code/submit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "code": "function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) { return [map.get(complement), i]; } map.set(nums[i], i); } return []; }",
    "language": "javascript",
    "functionName": "twoSum",
    "problemId": "two-sum-001",
    "userId": "test-user-123",
    "testCases": [
      {
        "input": { "nums": [2, 7, 11, 15], "target": 9 },
        "expectedOutput": [0, 1]
      },
      {
        "input": { "nums": [3, 2, 4], "target": 6 },
        "expectedOutput": [1, 2]
      },
      {
        "input": { "nums": [3, 3], "target": 6 },
        "expectedOutput": [0, 1]
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "summary": {
    "total": 3,
    "passed": 3,
    "failed": 0,
    "score": 100
  },
  "message": "Code submitted successfully"
}
```

**Validation Checklist:**
- [ ] Status code is 200
- [ ] Response has `success: true`
- [ ] Summary shows correct statistics
- [ ] **No detailed results** are returned (only summary)
- [ ] Message confirms successful submission

---

### 6. Test Error Handling - Missing Fields

Test that the endpoint properly validates required fields:

**Request:**
```bash
curl -X POST http://localhost:5001/api/code/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "code": "function test() { return 1; }"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

**Validation Checklist:**
- [ ] Status code is 400
- [ ] Response has `success: false`
- [ ] Error message indicates missing fields

---

### 7. Test Error Handling - No Authentication

Test that authentication is required:

**Request:**
```bash
curl -X POST http://localhost:5001/api/code/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { return 1; }",
    "language": "javascript",
    "functionName": "test",
    "testCases": []
  }'
```

**Expected Response:**
```json
{
  "message": "Not authorized, no token"
}
```

**Validation Checklist:**
- [ ] Status code is 401
- [ ] Error message indicates missing authentication

---

### 8. Test Error Handling - Incorrect Code

Test that execution errors are captured:

**Request:**
```bash
curl -X POST http://localhost:5001/api/code/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "code": "function twoSum(nums, target) { return nums[999]; }",
    "language": "javascript",
    "functionName": "twoSum",
    "testCases": [
      {
        "input": { "nums": [2, 7], "target": 9 },
        "expectedOutput": [0, 1]
      }
    ]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "results": [
    {
      "input": { "nums": [2, 7], "target": 9 },
      "expectedOutput": [0, 1],
      "actualOutput": "undefined",
      "passed": false,
      "error": "Output does not match expected result",
      "executionTime": 40
    }
  ],
  "summary": {
    "total": 1,
    "passed": 0,
    "failed": 1,
    "score": 0
  }
}
```

**Validation Checklist:**
- [ ] Status code is 200 (execution succeeded, but test failed)
- [ ] Test is marked as `passed: false`
- [ ] Error message is provided
- [ ] Score is 0%

---

## Postman Collection

If you prefer using Postman, here's a collection you can import:

### Collection Structure:
1. **Auth** folder
   - Login (POST /api/auth/login)
2. **Code Execution** folder
   - Get Languages (GET /api/code/languages)
   - Run Code - JavaScript (POST /api/code/run)
   - Run Code - Python (POST /api/code/run)
   - Submit Code (POST /api/code/submit)
   - Error: Missing Fields (POST /api/code/run)
   - Error: No Auth (POST /api/code/run)
   - Error: Wrong Output (POST /api/code/run)

### Environment Variables:
- `base_url`: http://localhost:5001
- `token`: (set after login)

---

## Summary Checklist

After completing all tests, verify:

- [ ] GET /api/code/languages works without authentication
- [ ] POST /api/code/run requires authentication
- [ ] POST /api/code/run executes JavaScript code correctly
- [ ] POST /api/code/run executes Python code correctly
- [ ] POST /api/code/run returns detailed test results
- [ ] POST /api/code/submit requires authentication
- [ ] POST /api/code/submit returns only summary (no detailed results)
- [ ] Error handling works for missing fields (400)
- [ ] Error handling works for missing authentication (401)
- [ ] Error handling works for incorrect code (test fails gracefully)
- [ ] Execution times are reasonable (< 5 seconds per test)
- [ ] All required languages are supported (javascript, python, java, c++, c)

---

## Troubleshooting

### Issue: "Not authorized, token failed"
- **Solution**: Make sure you're using a valid token from the login endpoint
- **Check**: Token should start with "eyJ" and be a long string

### Issue: "Code execution service unavailable"
- **Solution**: Piston API might be down or unreachable
- **Check**: Try accessing https://emkc.org/api/v2/piston/runtimes directly

### Issue: "Missing required fields"
- **Solution**: Ensure all required fields are present: code, language, functionName, testCases
- **Check**: Verify JSON syntax is correct

### Issue: Tests fail with timeout
- **Solution**: Code might have infinite loop or be too slow
- **Check**: Verify code logic and test with simpler inputs

---

## Next Steps

Once all tests pass:
1. ✅ Mark task 7 as complete
2. ✅ Proceed to frontend implementation (tasks 8-9)
3. ✅ Test end-to-end integration with frontend

---

**Last Updated:** 2024
**Backend Version:** 1.0.0
**Piston API:** https://emkc.org/api/v2/piston
