const express = require("express");
const router = express.Router();
const langchainController = require("../controller/langchainController");
const { authenticateToken } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authenticateToken);

//when a user generates flashcards from a document, on that page you also need to show the extracted text from the document
// Process file from URL
router.post("/process-url", langchainController.processFileFromUrl);

// Extract text from document by ID
router.get("/extract/:documentId", langchainController.extractTextFromDocument);

module.exports = router;
