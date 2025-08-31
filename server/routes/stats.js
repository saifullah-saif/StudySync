const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getUserStats,
  updateUserStats,
} = require("../controller/userStatsController");

const router = express.Router();

// All stats routes require authentication
router.use(authenticateToken);

/**
 * @route GET /api/stats/user
 * @desc Get user statistics
 * @access Private
 */
router.get("/user", getUserStats);

/**
 * @route POST /api/stats/user
 * @desc Update user statistics after a study session
 * @access Private
 * @body {
 *   cardsReviewed: number,
 *   cardsCorrect: number,
 *   sessionTimeMinutes?: number,
 *   newCardsStudied?: number,
 *   cardsAdvanced?: number
 * }
 */
router.post("/user", updateUserStats);

module.exports = router;
