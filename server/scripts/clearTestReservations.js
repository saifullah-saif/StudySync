const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTestReservations() {
  try {
    console.log('Clearing test reservations...');
    
    // Delete all reservations (for testing)
    const result = await prisma.reservations.deleteMany({});
    
    console.log(`Deleted ${result.count} reservations`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestReservations();
