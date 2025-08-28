const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function addSelectedSeatsColumn() {
  try {
    console.log("Adding selected_seats column to reservations table...");
    
    // Add the selected_seats column
    await prisma.$executeRaw`
      ALTER TABLE reservations 
      ADD COLUMN selected_seats TEXT NULL;
    `;
    
    console.log("Successfully added selected_seats column to reservations table");
  } catch (error) {
    if (error.message.includes("duplicate column name")) {
      console.log("Column selected_seats already exists in reservations table");
    } else {
      console.error("Error adding selected_seats column:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addSelectedSeatsColumn();
