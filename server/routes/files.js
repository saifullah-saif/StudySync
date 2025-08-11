const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  upload,
  uploadFile,
  getUserFiles,
  getFileDetails,
  deleteFile,
  updateFile,
  downloadFile,
  getFileStats,
} = require("../controller/fileController");

const router = express.Router();

// All file routes require authentication
router.use(authenticateToken);

// Upload file
router.post("/upload", upload.single("file"), uploadFile);

// Get all user files with pagination and filtering
router.get("/", getUserFiles);

// Get file statistics
router.get("/stats", getFileStats);

// Get file details by ID
router.get("/:id", getFileDetails);

// Update file metadata
router.put("/:id", updateFile);

// Delete file by ID
router.delete("/:id", deleteFile);

// Download file
router.get("/:id/download", downloadFile);

module.exports = router;
