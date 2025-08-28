const { PrismaClient } = require('@prisma/client');
const reservationsService = require('../services/reservationsService');

const prisma = new PrismaClient();

async function testSeatBooking() {
  try {
    console.log('=== TESTING SEAT BOOKING ===');
    
    // Test data
    const roomId = 1; // General Study Room 1 (capacity 12)
    const userId = 1; // Assuming user 1 exists
    const startTime = new Date('2025-01-15T14:00:00');
    const endTime = new Date('2025-01-15T16:00:00');
    const purpose = 'Test seat booking';
    const selectedSeats = ['08A01-01', '08A01-02', '08A01-03']; // 3 seats
    const roomCapacity = 12;
    
    console.log('Booking parameters:', {
      roomId,
      userId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      purpose,
      selectedSeats,
      roomCapacity
    });
    
    // Call the booking service
    const reservations = await reservationsService.createRoomReservation(
      roomId,
      userId,
      startTime,
      endTime,
      purpose,
      selectedSeats,
      roomCapacity
    );
    
    console.log('Booking successful!');
    console.log(`Created ${reservations.length} reservations:`);
    
    reservations.forEach((res, index) => {
      console.log(`Reservation ${index + 1}:`);
      console.log(`- ID: ${res.id}`);
      console.log(`- Room ID: ${res.room_id}`);
      console.log(`- User ID: ${res.user_id}`);
      console.log(`- Seat ID: ${res.seat_id}`);
      console.log(`- Status: ${res.status}`);
      console.log(`- Purpose: ${res.purpose}`);
      console.log(`- Start: ${res.start_time}`);
      console.log(`- End: ${res.end_time}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Booking failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSeatBooking();
