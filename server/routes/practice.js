const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getUserDecks,
  getDeck,
  createPracticeSession,
  getPracticeSession,
  recordFlashcardAttempt,
  completePracticeSession,
} = require("../controller/practiceController");

const router = express.Router();

// All practice routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/practice/decks
 * @desc Get user's flashcard decks
 * @access Private
 * @query {
 *   page?: number,
 *   limit?: number
 * }
 */
router.get("/decks", getUserDecks);

/**
 * @route GET /api/practice/decks/:id
 * @desc Get deck details with flashcards
 * @access Private
 */
router.get("/decks/:id", getDeck);

/**
 * @route POST /api/practice/flashcard-sessions
 * @desc Create a practice session
 * @access Private
 * @body {
 *   deckId: number,
 *   sessionType?: string
 * }
 */
router.post("/flashcard-sessions", createPracticeSession);

/**
 * @route GET /api/practice/practice-sessions/:sessionId
 * @desc Get practice session details
 * @access Private
 */
router.get("/practice-sessions/:sessionId", getPracticeSession);

/**
 * @route POST /api/practice/flashcard-attempts
 * @desc Record a flashcard attempt
 * @access Private
 * @body {
 *   sessionId: number,
 *   flashcardId: number,
 *   isCorrect: boolean,
 *   responseTimeSeconds: number
 * }
 */
router.post("/flashcard-attempts", recordFlashcardAttempt);

/**
 * @route POST /api/practice/flashcard-sessions/:sessionId/complete
 * @desc Complete a practice session
 * @access Private
 * @body {
 *   cardsStudied: number,
 *   cardsCorrect: number,
 *   totalTimeSeconds: number
 * }
 */
router.post("/flashcard-sessions/:sessionId/complete", completePracticeSession);

module.exports = router;
