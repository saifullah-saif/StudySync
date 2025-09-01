const prisma = require("../lib/prismaClient");

class FlashcardService {
  async createFlashcardDeck({
    userId,
    title,
    description,
    sourceFileId,
    flashcards,
  }) {
    try {
      // Create the flashcard deck with embedded flashcard data
      const deck = await prisma.flashcard_decks.create({
        data: {
          user_id: userId,
          title,
          description,
          document_id: sourceFileId,
          creation_method: "ai_generated",
          flashcards: {
            create: flashcards.map((card) => ({
              question: card.question,
              answer: card.answer,
              card_type: card.type || "basic",
              difficulty_level: 3, // Default medium difficulty
              auto_generated: true,
            })),
          },
          created_at: new Date(),
          updated_at: new Date(),
        },
        include: {
          flashcards: {
            orderBy: {
              id: "asc",
            },
          },
        },
      });

      // Add totalCards count
      deck.totalCards = deck.flashcards.length;

      return deck;
    } catch (error) {
      console.error("Database error creating flashcard deck:", error);
      throw error;
    }
  }

  async getUserFlashcardDecks(userId) {
    try {
      const decks = await prisma.flashcard_decks.findMany({
        where: {
          user_id: userId,
        },
        include: {
          _count: {
            select: {
              flashcards: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return decks;
    } catch (error) {
      console.error("Database error fetching flashcard decks:", error);
      throw error;
    }
  }

  async getFlashcardDeck(deckId, userId) {
    try {
      const deck = await prisma.flashcard_decks.findFirst({
        where: {
          id: deckId,
          user_id: userId,
        },
        include: {
          flashcards: {
            orderBy: {
              id: "asc",
            },
          },
        },
      });

      return deck;
    } catch (error) {
      console.error("Database error fetching flashcard deck:", error);
      throw error;
    }
  }

  async updateFlashcardDeck(deckId, userId, updateData) {
    try {
      const deck = await prisma.flashcard_decks.updateMany({
        where: {
          id: deckId,
          user_id: userId,
        },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });

      return deck;
    } catch (error) {
      console.error("Database error updating flashcard deck:", error);
      throw error;
    }
  }

  async deleteFlashcardDeck(deckId, userId) {
    try {
      // Delete flashcards first (due to foreign key constraint)
      await prisma.flashcards.deleteMany({
        where: {
          deck_id: deckId,
        },
      });

      // Then delete the deck
      await prisma.flashcard_decks.deleteMany({
        where: {
          id: deckId,
          user_id: userId,
        },
      });

      return true;
    } catch (error) {
      console.error("Database error deleting flashcard deck:", error);
      throw error;
    }
  }

  async updateFlashcardProgress(flashcardId, userId, correct) {
    try {
      const flashcard = await prisma.flashcards.findFirst({
        where: {
          id: flashcardId,
          flashcard_decks: {
            user_id: userId,
          },
        },
      });

      if (!flashcard) {
        throw new Error("Flashcard not found");
      }

      const updatedFlashcard = await prisma.flashcards.update({
        where: {
          id: flashcardId,
        },
        data: {
          // Add progress tracking fields if needed
          updated_at: new Date(),
        },
      });

      return updatedFlashcard;
    } catch (error) {
      console.error("Database error updating flashcard progress:", error);
      throw error;
    }
  }
}

module.exports = new FlashcardService();
