const { PrismaClient } = require("@prisma/client");
const reservationsService = require("../services/reservationsService");

const prisma = new PrismaClient();

async function runAvailabilityUpdate() {
  try {
    console.log("Running room availability update...");
    const result = await reservationsService.updateRoomAvailability();
    console.log(`Updated ${result.endedReservations} ended reservations and activated ${result.activatedReservations} reservations`);
  } catch (error) {
    console.error("Error updating room availability:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
runAvailabilityUpdate();
