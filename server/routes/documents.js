const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  upload,
  uploadDocument,
  pasteDocument,
  generateFlashcardsFromDocument,
  getDeck,
} = require("../controller/documentController");

const router = express.Router();

// All document routes require authentication
router.use(authenticateToken);

// Upload document
router.post("/upload", upload.single("file"), uploadDocument);

// Paste text content
router.post("/paste", pasteDocument);

// Generate flashcards
router.post("/generate-flashcards", generateFlashcardsFromDocument);

// Get deck details
router.get("/decks/:id", getDeck);

module.exports = router;
