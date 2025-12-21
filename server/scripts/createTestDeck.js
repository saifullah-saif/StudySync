const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function createTestDeck() {
  try {
    console.log("Creating test flashcard deck...");
    
    // Create a test deck for user ID 1
    const deck = await prisma.flashcard_decks.create({
      data: {
        user_id: 1,
        title: "Test Biology Deck",
        description: "A sample deck for testing the flashcard system",
        creation_method: "manual",
        color: "#3B82F6",
        is_deleted: false,
      },
    });

    console.log(`Created deck: ${deck.title} (ID: ${deck.id})`);

    // Create some test flashcards
    const flashcards = [
      {
        question: "What is the powerhouse of the cell?",
        answer: "Mitochondria",
        explanation: "Mitochondria produce ATP through cellular respiration.",
        difficulty_level: 1,
        card_type: "basic"
      },
      {
        question: "Which organelle is responsible for protein synthesis?",
        answer: "Ribosome",
        explanation: "Ribosomes translate mRNA into proteins.",
        difficulty_level: 2,
        card_type: "basic"
      },
      {
        question: "What process do plants use to make food?",
        answer: "Photosynthesis",
        explanation: "Plants convert sunlight, CO2, and water into glucose and oxygen.",
        difficulty_level: 1,
        card_type: "basic"
      }
    ];

    for (const cardData of flashcards) {
      const card = await prisma.flashcards.create({
        data: {
          deck_id: deck.id,
          ...cardData,
        },
      });
      console.log(`Created flashcard: "${card.question}"`);
    }

    console.log("\nTest deck created successfully!");
    console.log(`You can now test with deck ID: ${deck.id}`);
    
  } catch (error) {
    console.error("Error creating test deck:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestDeck();
