const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addSeatIdColumn() {
  try {
    console.log("Adding seat_id column to reservations table...");
    
    // Add the seat_id column
    await prisma.$executeRaw`
      ALTER TABLE reservations 
      ADD COLUMN seat_id INTEGER NULL;
    `;
    
    console.log("Successfully added seat_id column to reservations table");
  } catch (error) {
    if (error.message.includes("duplicate column name")) {
      console.log("Column seat_id already exists in reservations table");
    } else {
      console.error("Error adding seat_id column:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addSeatIdColumn();
