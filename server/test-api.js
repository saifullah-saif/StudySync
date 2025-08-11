const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testProfileAPI() {
  try {
    console.log('Testing profile API endpoints...');

    // Test health endpoint first
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test profile test endpoint (should fail without auth)
    console.log('\n2. Testing profile test endpoint without auth...');
    try {
      const testResponse = await axios.get(`${BASE_URL}/profile/test`);
      console.log('❌ Unexpected success:', testResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected without auth:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test login to get auth token
    console.log('\n3. Testing login...');

    // Try multiple common passwords
    const testCredentials = [
      { email: 'alice@example.com', password: 'password123' },
      { email: 'alice@example.com', password: 'password' },
      { email: 'alice@example.com', password: '123456' },
      { email: 'test@example.com', password: 'password123' }
    ];

    let loginResponse = null;

    for (const creds of testCredentials) {
      try {
        console.log(`Trying login with ${creds.email}...`);
        loginResponse = await axios.post(`${BASE_URL}/auth/login`, creds, {
          withCredentials: true
        });
        console.log('✅ Login successful with:', creds.email);
        break;
      } catch (loginError) {
        console.log(`❌ Login failed for ${creds.email}:`, loginError.response?.data?.message);
      }
    }

    if (loginResponse) {
      // Extract cookies for subsequent requests
      const cookies = loginResponse.headers['set-cookie'];
      console.log('Cookies received:', cookies ? 'Yes' : 'No');

      if (cookies) {
        // Test profile endpoints with auth
        console.log('\n4. Testing profile test endpoint with auth...');
        const testAuthResponse = await axios.get(`${BASE_URL}/profile/test`, {
          headers: {
            'Cookie': cookies.join('; ')
          }
        });
        console.log('✅ Profile test with auth:', testAuthResponse.data);

        // Test profile get
        console.log('\n5. Testing profile get...');
        const profileResponse = await axios.get(`${BASE_URL}/profile`, {
          headers: {
            'Cookie': cookies.join('; ')
          }
        });
        console.log('✅ Profile get:', profileResponse.data.success);

        // Test profile update
        console.log('\n6. Testing profile update...');
        const updateResponse = await axios.put(`${BASE_URL}/profile`, {
          name: 'Alice Rahman Updated',
          bio: 'Updated bio from API test - ' + new Date().toISOString()
        }, {
          headers: {
            'Cookie': cookies.join('; ')
          }
        });
        console.log('✅ Profile update:', updateResponse.data.success);
        console.log('Updated profile:', updateResponse.data.data?.profile?.name);

      } else {
        console.log('❌ No cookies received from login');
      }

    } else {
      console.log('❌ All login attempts failed');

      // Try to create a new test user
      console.log('\n3b. Testing with test user creation...');
      try {
        const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
          name: 'Test User API',
          email: 'testapi@example.com',
          password: 'password123',
          department: 'Computer Science',
          semester: 1
        });
        console.log('✅ Test user created:', registerResponse.data.success);

        // Try to login with new user
        const newLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'testapi@example.com',
          password: 'password123'
        }, {
          withCredentials: true
        });

        if (newLoginResponse.data.success) {
          loginResponse = newLoginResponse;
          console.log('✅ Login successful with new test user');
        }

      } catch (regError) {
        console.log('❌ Registration failed:', regError.response?.data || regError.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProfileAPI();
