const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReservations() {
  try {
    console.log('=== CHECKING RESERVATIONS ===');
    
    // Check all reservations
    const reservations = await prisma.reservations.findMany({
      include: {
        library_rooms: {
          select: { name: true, capacity: true }
        },
        seats: {
          select: { seat_number: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });
    
    console.log(`Found ${reservations.length} recent reservations:`);
    reservations.forEach(res => {
      console.log(`- ID: ${res.id}, Room: ${res.library_rooms?.name}, Seat: ${res.seats?.seat_number || 'N/A'}, Status: ${res.status}`);
      console.log(`  Time: ${res.start_time} to ${res.end_time}`);
      console.log(`  Purpose: ${res.purpose}`);
    });
    
    console.log('\n=== CHECKING SEATS ===');
    
    // Check seats for a large room (room 1)
    const seats = await prisma.seats.findMany({
      where: { room_id: 1 },
      take: 5,
      select: {
        id: true,
        seat_number: true,
        room_id: true
      }
    });
    
    console.log(`Sample seats for room 1:`);
    seats.forEach(seat => {
      console.log(`- Seat ID: ${seat.id}, Number: ${seat.seat_number}, Room: ${seat.room_id}`);
    });
    
    console.log('\n=== CHECKING ROOM CAPACITIES ===');
    
    // Check room capacities
    const rooms = await prisma.library_rooms.findMany({
      select: {
        id: true,
        name: true,
        capacity: true
      },
      take: 5
    });
    
    console.log(`Sample rooms:`);
    rooms.forEach(room => {
      console.log(`- Room ID: ${room.id}, Name: ${room.name}, Capacity: ${room.capacity}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReservations();
