const express = require("express");
const router = express.Router();
const flashcardController = require("../controller/flashcardController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Generate flashcards from Q&A data
router.post(
  "/generate",
  authenticateToken,
  flashcardController.generateFlashcards
);

// Get user's flashcard decks
router.get(
  "/decks",
  authenticateToken,
  flashcardController.getUserFlashcardDecks
);

// Get specific flashcard deck
router.get(
  "/deck/:deckId",
  authenticateToken,
  flashcardController.getFlashcardDeck
);

// Update flashcard deck (progress, statistics)
router.put(
  "/deck/:deckId",
  authenticateToken,
  flashcardController.updateFlashcardDeck
);

// Add this route to handle saving decks
router.post("/save", authenticateToken, flashcardController.saveFlashcardDeck);

// Delete flashcard deck
router.delete(
  "/deck/:deckId",
  authenticateToken,
  flashcardController.deleteFlashcardDeck
);

module.exports = router;
