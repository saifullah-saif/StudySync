require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testDecks() {
  try {
    console.log("Checking for flashcard decks in database...");
    
    const decks = await prisma.flashcard_decks.findMany({
      where: {
        is_deleted: false,
      },
      include: {
        flashcards: {
          select: {
            id: true,
          },
        },
      },
    });
    
    console.log(`Found ${decks.length} decks:`);
    decks.forEach((deck) => {
      console.log(`- Deck ${deck.id}: "${deck.title}" (User: ${deck.user_id}, Cards: ${deck.flashcards.length})`);
    });
    
    // Also check users
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    
    console.log(`\nFound ${users.length} users:`);
    users.forEach((user) => {
      console.log(`- User ${user.id}: ${user.name} (${user.email})`);
    });
    
  } catch (error) {
    console.error("Error checking decks:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDecks();
