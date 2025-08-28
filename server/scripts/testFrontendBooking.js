const axios = require('axios');

async function testFrontendBooking() {
  try {
    console.log('=== TESTING FRONTEND BOOKING API ===');
    
    // Test data that mimics frontend request
    const bookingData = {
      room_id: 1,
      start_time: '2025-01-15T14:00:00.000Z',
      end_time: '2025-01-15T16:00:00.000Z',
      purpose: 'Test frontend booking',
      selected_seats: ['08A01-01', '08A01-02', '08A01-03'],
      room_capacity: 12
    };
    
    console.log('Sending booking request:', bookingData);
    
    // Make the API call (without authentication for now)
    const response = await axios.post('http://localhost:5000/api/reservations', bookingData, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Request failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testFrontendBooking();
