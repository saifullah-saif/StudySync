const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSeats() {
  try {
    const seats = await prisma.seats.findMany({
      take: 10,
      select: {
        seat_number: true,
        room_id: true
      }
    });
    
    console.log('Sample seats:', seats);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSeats();
