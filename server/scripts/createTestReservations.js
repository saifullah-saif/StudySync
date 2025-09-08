const { PrismaClient } = require('@prisma/client');
const reservationsService = require('../services/reservationsService');

const prisma = new PrismaClient();

async function createTestReservations() {
  try {
    console.log('=== CREATING TEST RESERVATIONS ===');
    
    // Clear existing reservations first
    await prisma.reservations.deleteMany({});
    console.log('Cleared existing reservations');
    
    // Test 1: User 1 books 3 seats in a large room (room 1)
    console.log('\n1. User 1 booking 3 seats in large room...');
    const largeRoomReservations = await reservationsService.createRoomReservation(
      1, // Room 1 (General Study Room 1, capacity 12)
      1, // User 1
      new Date('2025-01-15T19:00:00'), // 7 PM
      new Date('2025-01-15T20:00:00'), // 8 PM
      'Study session',
      ['08A01-01', '08A01-02', '08A01-03'], // 3 seats
      12 // Room capacity
    );
    
    console.log(`Created ${largeRoomReservations.length} seat reservations for large room`);
    
    // Test 2: User 2 books entire small room (room 3)
    console.log('\n2. User 2 booking entire small room...');
    const smallRoomReservations = await reservationsService.createRoomReservation(
      3, // Room 3 (small room, capacity < 10)
      2, // User 2
      new Date('2025-01-15T19:00:00'), // 7 PM
      new Date('2025-01-15T20:00:00'), // 8 PM
      'Private meeting',
      [], // No specific seats for small room
      4 // Room capacity
    );
    
    console.log(`Created ${smallRoomReservations.length} room reservation for small room`);
    
    console.log('\n=== TEST RESERVATIONS CREATED ===');
    console.log('Large room (Room 1): Seats 01, 02, 03 booked from 7-8 PM');
    console.log('Small room (Room 3): Entire room booked from 7-8 PM');
    console.log('\nNow test with User 2:');
    console.log('- Large room: Should see seats 01,02,03 as booked, can book seats 04,05,06');
    console.log('- Small room: Should not appear in room list for 7-8 PM time slot');
    
  } catch (error) {
    console.error('Error creating test reservations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestReservations();
