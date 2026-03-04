/**
 * Manual Test Script for Code Execution Endpoints
 * This script tests all three endpoints:
 * 1. GET /api/code/languages (no auth)
 * 2. POST /api/code/run (with auth)
 * 3. POST /api/code/submit (with auth)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

// Test data
const testCode = {
  javascript: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
  python: `def two_sum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []`
};

const testCases = [
  {
    input: { nums: [2, 7, 11, 15], target: 9 },
    expectedOutput: [0, 1]
  },
  {
    input: { nums: [3, 2, 4], target: 6 },
    expectedOutput: [1, 2]
  },
  {
    input: { nums: [3, 3], target: 6 },
    expectedOutput: [0, 1]
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: GET /api/code/languages (no authentication required)
async function testGetLanguages() {
  log('\n=== Test 1: GET /api/code/languages ===', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/code/languages`);
    
    if (response.status === 200 && response.data.success) {
      log('✓ Languages endpoint works', 'green');
      log(`  Found ${response.data.languages.length} languages`, 'green');
      
      // Check for key languages
      const languageNames = response.data.languages.map(l => l.language);
      const requiredLanguages = ['javascript', 'python', 'java', 'c++', 'c'];
      const foundLanguages = requiredLanguages.filter(lang => languageNames.includes(lang));
      
      log(`  Required languages found: ${foundLanguages.join(', ')}`, 'green');
      
      if (foundLanguages.length === requiredLanguages.length) {
        log('✓ All required languages are supported', 'green');
        return true;
      } else {
        log('⚠ Some required languages are missing', 'yellow');
        return false;
      }
    } else {
      log('✗ Unexpected response format', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// Test 2: POST /api/code/run (requires authentication)
async function testRunCode(token) {
  log('\n=== Test 2: POST /api/code/run ===', 'blue');
  
  // Test 2.1: JavaScript
  log('\n--- Test 2.1: JavaScript Code Execution ---', 'yellow');
  try {
    const response = await axios.post(
      `${BASE_URL}/api/code/run`,
      {
        code: testCode.javascript,
        language: 'javascript',
        functionName: 'twoSum',
        testCases: testCases
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.status === 200 && response.data.success) {
      log('✓ JavaScript execution works', 'green');
      log(`  Summary: ${response.data.summary.passed}/${response.data.summary.total} tests passed (${response.data.summary.score}%)`, 'green');
      
      // Check individual test results
      response.data.results.forEach((result, index) => {
        if (result.passed) {
          log(`  ✓ Test ${index + 1}: PASSED`, 'green');
        } else {
          log(`  ✗ Test ${index + 1}: FAILED`, 'red');
          log(`    Expected: ${JSON.stringify(result.expectedOutput)}`, 'red');
          log(`    Got: ${result.actualOutput}`, 'red');
          if (result.error) log(`    Error: ${result.error}`, 'red');
        }
      });
      
      return response.data.summary.score === 100;
    } else {
      log('✗ Unexpected response format', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// Test 2.2: Python Code Execution
async function testRunCodePython(token) {
  log('\n--- Test 2.2: Python Code Execution ---', 'yellow');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/code/run`,
      {
        code: testCode.python,
        language: 'python',
        functionName: 'two_sum',
        testCases: testCases
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.status === 200 && response.data.success) {
      log('✓ Python execution works', 'green');
      log(`  Summary: ${response.data.summary.passed}/${response.data.summary.total} tests passed (${response.data.summary.score}%)`, 'green');
      
      // Check individual test results
      response.data.results.forEach((result, index) => {
        if (result.passed) {
          log(`  ✓ Test ${index + 1}: PASSED`, 'green');
        } else {
          log(`  ✗ Test ${index + 1}: FAILED`, 'red');
          log(`    Expected: ${JSON.stringify(result.expectedOutput)}`, 'red');
          log(`    Got: ${result.actualOutput}`, 'red');
          if (result.error) log(`    Error: ${result.error}`, 'red');
        }
      });
      
      return response.data.summary.score === 100;
    } else {
      log('✗ Unexpected response format', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// Test 3: POST /api/code/submit (requires authentication)
async function testSubmitCode(token) {
  log('\n=== Test 3: POST /api/code/submit ===', 'blue');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/code/submit`,
      {
        code: testCode.javascript,
        language: 'javascript',
        functionName: 'twoSum',
        problemId: 'two-sum-test',
        userId: 'test-user',
        testCases: testCases
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    if (response.status === 200 && response.data.success) {
      log('✓ Submit endpoint works', 'green');
      log(`  Summary: ${response.data.summary.passed}/${response.data.summary.total} tests passed (${response.data.summary.score}%)`, 'green');
      log(`  Message: ${response.data.message}`, 'green');
      
      // Verify that detailed results are NOT returned (only summary)
      if (!response.data.results) {
        log('✓ Private test details are hidden (as expected)', 'green');
      } else {
        log('⚠ Warning: Detailed results should not be returned for submit', 'yellow');
      }
      
      return response.data.summary.score === 100;
    } else {
      log('✗ Unexpected response format', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Error: ${error.message}`, 'red');
    if (error.response) {
      log(`  Status: ${error.response.status}`, 'red');
      log(`  Data: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

// Test 4: Error handling - Missing fields
async function testErrorHandling(token) {
  log('\n=== Test 4: Error Handling ===', 'blue');
  
  log('\n--- Test 4.1: Missing required fields ---', 'yellow');
  try {
    const response = await axios.post(
      `${BASE_URL}/api/code/run`,
      {
        code: testCode.javascript
        // Missing language, functionName, testCases
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    
    log('✗ Should have returned 400 error', 'red');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('✓ Correctly returns 400 for missing fields', 'green');
      log(`  Message: ${error.response.data.message}`, 'green');
      return true;
    } else {
      log(`✗ Unexpected error: ${error.message}`, 'red');
      return false;
    }
  }
}

// Test 5: Authentication check
async function testAuthenticationRequired() {
  log('\n=== Test 5: Authentication Required ===', 'blue');
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/code/run`,
      {
        code: testCode.javascript,
        language: 'javascript',
        functionName: 'twoSum',
        testCases: testCases
      }
      // No Authorization header
    );
    
    log('✗ Should have returned 401 error', 'red');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('✓ Correctly requires authentication', 'green');
      return true;
    } else {
      log(`✗ Unexpected error: ${error.message}`, 'red');
      return false;
    }
  }
}

// Helper function to get auth token
async function getAuthToken() {
  log('\n=== Getting Authentication Token ===', 'blue');
  
  // Try to register a test user
  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass123'
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if (response.data.token) {
      log('✓ Successfully registered test user and got token', 'green');
      return response.data.token;
    }
  } catch (error) {
    // If registration fails, try login with a known user
    log('⚠ Registration failed, trying to login...', 'yellow');
  }
  
  // If registration fails, return null and tests will skip auth-required endpoints
  log('✗ Could not get authentication token', 'red');
  log('  Please ensure the backend is running and MongoDB is connected', 'yellow');
  return null;
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  Code Execution Endpoints Test Suite                  ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Test 1: Languages endpoint (no auth required)
  const test1 = await testGetLanguages();
  if (test1) results.passed++; else results.failed++;
  
  // Test 5: Authentication check
  const test5 = await testAuthenticationRequired();
  if (test5) results.passed++; else results.failed++;
  
  // Get auth token for remaining tests
  const token = await getAuthToken();
  
  if (token) {
    // Test 2: Run code (JavaScript)
    const test2 = await testRunCode(token);
    if (test2) results.passed++; else results.failed++;
    
    // Test 2.2: Run code (Python)
    const test22 = await testRunCodePython(token);
    if (test22) results.passed++; else results.failed++;
    
    // Test 3: Submit code
    const test3 = await testSubmitCode(token);
    if (test3) results.passed++; else results.failed++;
    
    // Test 4: Error handling
    const test4 = await testErrorHandling(token);
    if (test4) results.passed++; else results.failed++;
  } else {
    log('\n⚠ Skipping authenticated endpoint tests (no token)', 'yellow');
    results.skipped = 4;
  }
  
  // Print summary
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  Test Summary                                          ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  log(`\nPassed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'reset');
  log(`Skipped: ${results.skipped}`, results.skipped > 0 ? 'yellow' : 'reset');
  
  const total = results.passed + results.failed + results.skipped;
  const successRate = total > 0 ? Math.round((results.passed / (results.passed + results.failed)) * 100) : 0;
  
  log(`\nSuccess Rate: ${successRate}%`, successRate === 100 ? 'green' : 'yellow');
  
  if (results.failed === 0 && results.skipped === 0) {
    log('\n🎉 All tests passed!', 'green');
  } else if (results.failed === 0) {
    log('\n⚠ All executed tests passed, but some were skipped', 'yellow');
  } else {
    log('\n❌ Some tests failed. Please review the output above.', 'red');
  }
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n✗ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
