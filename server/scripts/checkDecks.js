const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDecks() {
  try {
    console.log("Checking flashcard decks in database...");
    
    // Get all decks
    const decks = await prisma.flashcard_decks.findMany({
      include: {
        flashcards: true,
        users: true,
      },
    });

    console.log(`Found ${decks.length} decks total:`);
    
    decks.forEach(deck => {
      console.log(`- Deck ID: ${deck.id}, Title: "${deck.title}", User: ${deck.users?.name || deck.user_id}, Cards: ${deck.flashcards.length}, Deleted: ${deck.is_deleted}`);
    });

    if (decks.length === 0) {
      console.log("\nNo decks found. Let's check if we have any users:");
      const users = await prisma.users.findMany();
      console.log(`Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`- User ID: ${user.id}, Name: "${user.name}", Email: "${user.email}"`);
      });
    }

  } catch (error) {
    console.error("Error checking decks:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDecks();
