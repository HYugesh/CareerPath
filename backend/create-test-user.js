/**
 * Create a test user for endpoint testing
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function createTestUser() {
  const testUser = {
    name: 'Test User',
    email: 'test@codearena.com',
    password: 'TestPass123'
  };
  
  console.log('Creating test user...');
  console.log('Email:', testUser.email);
  console.log('Password:', testUser.password);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    if (response.data.token) {
      console.log('\n✓ Test user created successfully!');
      console.log('Token:', response.data.token);
      console.log('\nYou can now run: node test-endpoints.js');
      return response.data.token;
    }
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.message.includes('already exists')) {
      console.log('\n⚠ User already exists. Trying to login...');
      
      try {
        const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
          email: testUser.email,
          password: testUser.password
        });
        
        if (loginResponse.data.token) {
          console.log('✓ Logged in successfully!');
          console.log('Token:', loginResponse.data.token);
          console.log('\nYou can now run: node test-endpoints.js');
          return loginResponse.data.token;
        }
      } catch (loginError) {
        console.error('✗ Login failed:', loginError.response?.data?.message || loginError.message);
        return null;
      }
    } else {
      console.error('✗ Registration failed:', error.response?.data?.message || error.message);
      return null;
    }
  }
}

createTestUser().then(token => {
  if (!token) {
    process.exit(1);
  }
  process.exit(0);
});
