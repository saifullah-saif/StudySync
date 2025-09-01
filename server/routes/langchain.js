const express = require("express");
const router = express.Router();
const langchainController = require("../controller/langchainController");
const { authenticateToken } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(authenticateToken);

// Process file from URL
router.post("/process-url", langchainController.processFileFromUrl);

module.exports = router;
