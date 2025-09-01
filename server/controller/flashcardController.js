const flashcardService = require("../services/flashcardService");

const generateFlashcards = async (req, res) => {
  try {
    const { qsAns, title, sourceFileId } = req.body;
    const userId = req.user.id;

    console.log("📥 Generating flashcards:", {
      userId,
      title,
      sourceFileId,
      qsAnsCount: qsAns?.length,
    });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!qsAns || !Array.isArray(qsAns) || qsAns.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Q&A data is required and must be a non-empty array",
      });
    }

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Convert Q&A pairs to flashcard format
    const flashcards = qsAns.map((item, index) => ({
      id: `card-${index + 1}`,
      question: item.question || "",
      answer: item.answer || "",
      type: "basic",
      explanation: item.explanation || null,
    }));

    // Validate flashcards
    const validFlashcards = flashcards.filter(
      (card) => card.question.trim() && card.answer.trim()
    );

    if (validFlashcards.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid flashcards could be created from the Q&A data",
      });
    }

    console.log(`✅ Creating deck with ${validFlashcards.length} flashcards`);

    // Create flashcard deck in database
    const deck = await flashcardService.createFlashcardDeck({
      userId,
      title: title.trim(),
      description: `Generated from ${title}`,
      sourceFileId: sourceFileId || null,
      flashcards: validFlashcards,
    });

    res.status(200).json({
      success: true,
      message: "Flashcards generated successfully",
      data: {
        deckId: deck.id,
        totalCards: deck.totalCards || validFlashcards.length,
        flashcards: deck.flashcards || validFlashcards,
        title: deck.title,
      },
    });
  } catch (error) {
    console.error("❌ Generate flashcards error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate flashcards",
    });
  }
};

const getUserFlashcardDecks = async (req, res) => {
  try {
    const userId = req.user.id;
    const decks = await flashcardService.getUserFlashcardDecks(userId);

    res.status(200).json({
      success: true,
      data: {
        decks: decks || [],
      },
    });
  } catch (error) {
    console.error("Get flashcard decks error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get flashcard decks",
    });
  }
};

const getFlashcardDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;

    const deck = await flashcardService.getFlashcardDeck(
      parseInt(deckId),
      userId
    );

    if (!deck) {
      return res.status(404).json({
        success: false,
        message: "Flashcard deck not found",
      });
    }

    res.status(200).json({
      success: true,
      data: deck,
    });
  } catch (error) {
    console.error("Get flashcard deck error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get flashcard deck",
    });
  }
};

const updateFlashcardDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    await flashcardService.updateFlashcardDeck(
      parseInt(deckId),
      userId,
      updateData
    );

    res.status(200).json({
      success: true,
      message: "Flashcard deck updated successfully",
    });
  } catch (error) {
    console.error("Update flashcard deck error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update flashcard deck",
    });
  }
};

// Add this method to your controller
const saveFlashcardDeck = async (req, res) => {
  try {
    const { title, fileId, cards } = req.body;
    const userId = req.user.id;

    // Convert cards back to Q&A format for existing generateFlashcards method
    const qsAns = cards.map((card) => ({
      question: card.question,
      answer: card.answer,
    }));

    // Use existing generateFlashcards logic
    const result = await generateFlashcards(
      {
        body: { title, sourceFileId: fileId, qsAns },
        user: { id: userId },
      },
      res
    );

    return result;
  } catch (error) {
    console.error("Save flashcard deck error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save flashcard deck",
    });
  }
};

const deleteFlashcardDeck = async (req, res) => {
  try {
    const { deckId } = req.params;
    const userId = req.user.id;

    await flashcardService.deleteFlashcardDeck(parseInt(deckId), userId);

    res.status(200).json({
      success: true,
      message: "Flashcard deck deleted successfully",
    });
  } catch (error) {
    console.error("Delete flashcard deck error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete flashcard deck",
    });
  }
};

module.exports = {
  generateFlashcards,
  getUserFlashcardDecks,
  getFlashcardDeck,
  updateFlashcardDeck,
  saveFlashcardDeck,
  deleteFlashcardDeck,
};
