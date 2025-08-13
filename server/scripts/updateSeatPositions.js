const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function updateSeatPositions() {
  try {
    console.log("Starting to update seat positions...");

    // Get all rooms with their seats
    const rooms = await prisma.library_rooms.findMany({
      where: { is_active: true },
      include: {
        seats: {
          where: { is_active: true },
          orderBy: { seat_number: 'asc' }
        }
      }
    });

    console.log(`Found ${rooms.length} rooms`);

    for (const room of rooms) {
      if (room.seats.length === 0) continue;
      
      console.log(`Updating positions for room: ${room.name} (${room.seats.length} seats)`);
      
      // Generate positions for this room's capacity
      const positions = generateSeatPositions(room.seats.length);
      
      // Update each seat with its position
      for (let i = 0; i < room.seats.length; i++) {
        const seat = room.seats[i];
        const position = positions[i];
        
        if (position) {
          await prisma.seats.update({
            where: { id: seat.id },
            data: {
              position_x: position.x,
              position_y: position.y
            }
          });
        }
      }

      console.log(`Updated positions for ${room.seats.length} seats in room ${room.name}`);
    }

    console.log("Seat position update completed successfully!");
  } catch (error) {
    console.error("Error updating seat positions:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateSeatPositions(totalSeats) {
  const seats = [];
  
  // Layout based on the provided image: seats around a central table
  const centerX = 200;
  const centerY = 100;
  const tableWidth = 140;
  const tableHeight = 60;
  
  // Define seat positions around the table like in the image
  const positions = [];
  
  // Top row (5 seats)
  for (let i = 0; i < 5; i++) {
    positions.push({
      x: centerX - tableWidth/2 + (i * tableWidth/4),
      y: centerY - tableHeight/2 - 30
    });
  }
  
  // Right side (2 seats)
  positions.push({
    x: centerX + tableWidth/2 + 30,
    y: centerY - 15
  });
  positions.push({
    x: centerX + tableWidth/2 + 30,
    y: centerY + 15
  });
  
  // Bottom row (5 seats)
  for (let i = 0; i < 5; i++) {
    positions.push({
      x: centerX - tableWidth/2 + (i * tableWidth/4),
      y: centerY + tableHeight/2 + 30
    });
  }
  
  // Use only the number of seats needed, up to the capacity
  for (let i = 0; i < Math.min(totalSeats, positions.length); i++) {
    seats.push({
      x: positions[i].x,
      y: positions[i].y
    });
  }
  
  return seats;
}

// Run the script
updateSeatPositions();
