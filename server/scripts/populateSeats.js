const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function populateSeats() {
  try {
    console.log("Starting to populate seats...");

    // Get all library rooms
    const rooms = await prisma.library_rooms.findMany({
      where: { is_active: true }
    });

    console.log(`Found ${rooms.length} rooms`);

    for (const room of rooms) {
      console.log(`Processing room: ${room.name} (ID: ${room.id})`);
      
      // Check if seats already exist for this room
      const existingSeats = await prisma.seats.findMany({
        where: { room_id: room.id }
      });

      if (existingSeats.length > 0) {
        console.log(`Room ${room.name} already has ${existingSeats.length} seats, skipping...`);
        continue;
      }

      // Generate seat positions based on room layout
      const capacity = room.capacity || 12;
      const seats = generateSeatPositions(capacity);

      // Create seats for this room
      for (let i = 0; i < seats.length; i++) {
        const seatNumber = String(i + 1).padStart(2, '0');
        const seat = seats[i];
        
        await prisma.seats.create({
          data: {
            room_id: room.id,
            seat_number: seatNumber,
            position_x: seat.x,
            position_y: seat.y,
            has_computer: Math.random() < 0.3, // 30% chance of having computer
            has_power_outlet: Math.random() < 0.8, // 80% chance of having power outlet
            is_accessible: Math.random() < 0.2, // 20% chance of being accessible
            is_active: true
          }
        });
      }

      console.log(`Created ${seats.length} seats for room ${room.name}`);
    }

    console.log("Seat population completed successfully!");
  } catch (error) {
    console.error("Error populating seats:", error);
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
populateSeats();
