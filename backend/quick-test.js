/**
 * Quick test to verify endpoints are working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function quickTest() {
  console.log('Testing Code Execution Endpoints...\n');
  
  // Test 1: Languages endpoint (no auth)
  console.log('1. Testing GET /api/code/languages...');
  try {
    const response = await axios.get(`${BASE_URL}/api/code/languages`);
    console.log(`   ✓ Success! Found ${response.data.languages.length} languages`);
  } catch (error) {
    console.log(`   ✗ Failed: ${error.message}`);
    return;
  }
  
  // Test 2: Create test user
  console.log('\n2. Creating test user...');
  let token = null;
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'TestPass123'
    });
    token = response.data.token;
    console.log('   ✓ User created and token received');
    console.log('   Token preview:', token.substring(0, 20) + '...');
  } catch (error) {
    console.log(`   ✗ Failed: ${error.response?.data?.message || error.message}`);
    return;
  }
  
  // Test 3: Run code endpoint
  console.log('\n3. Testing POST /api/code/run...');
  try {
    const response = await axios.post(
      `${BASE_URL}/api/code/run`,
      {
        code: 'function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) { return [map.get(complement), i]; } map.set(nums[i], i); } return []; }',
        language: 'javascript',
        functionName: 'twoSum',
        testCases: [
          { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }
        ]
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`   ✓ Success! ${response.data.summary.passed}/${response.data.summary.total} tests passed`);
    if (response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      console.log(`   Input: ${JSON.stringify(result.input)}`);
      console.log(`   Expected: ${JSON.stringify(result.expectedOutput)}`);
      console.log(`   Got: ${result.actualOutput}`);
    }
  } catch (error) {
    console.log(`   ✗ Failed: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('   Response data:', JSON.stringify(error.response.data));
    }
    return;
  }
  
  // Test 4: Submit code endpoint
  console.log('\n4. Testing POST /api/code/submit...');
  try {
    const response = await axios.post(
      `${BASE_URL}/api/code/submit`,
      {
        code: 'function twoSum(nums, target) { const map = new Map(); for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (map.has(complement)) { return [map.get(complement), i]; } map.set(nums[i], i); } return []; }',
        language: 'javascript',
        functionName: 'twoSum',
        problemId: 'test-problem',
        testCases: [
          { input: { nums: [2, 7, 11, 15], target: 9 }, expectedOutput: [0, 1] }
        ]
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`   ✓ Success! Score: ${response.data.summary.score}%`);
  } catch (error) {
    console.log(`   ✗ Failed: ${error.response?.data?.message || error.message}`);
    return;
  }
  
  console.log('\n✅ All endpoint tests passed!');
}

quickTest().catch(error => {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
});
