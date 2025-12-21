const express = require("express");
const summaryController = require("../controller/summaryController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// Generate summary from text content
router.post("/generate", authenticateToken, summaryController.generateSummary);

// Summarize existing document
router.post(
  "/document/:documentId",
  authenticateToken,
  summaryController.summarizeDocument
);

// Summarize existing note (main endpoint for the view-notes page)
router.post(
  "/note/:noteId",
  authenticateToken,
  summaryController.summarizeNote
);

module.exports = router;
