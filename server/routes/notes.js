const express = require("express");
const multer = require("multer");
const NotesController = require("../controller/notesController");
const {
  verifyTokenFromCookie,
  optionalVerifyTokenFromCookie,
} = require("../middleware/jwtCookieMiddleware");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOCX, and TXT files
    const allowedMimeTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "File type not supported. Only PDF, DOCX, and TXT files are allowed."
        ),
        false
      );
    }
  },
});

// Routes with optional authentication for visibility filtering
router.get("/", optionalVerifyTokenFromCookie, NotesController.getAllNotes);
router.get("/courses", NotesController.getCourses);
router.get("/:id", NotesController.getNoteById);
router.get("/:id/download", NotesController.downloadNote);

// Protected routes - require authentication
router.post(
  "/upload",
  verifyTokenFromCookie,
  upload.single("file"),
  NotesController.uploadNote
);
router.get(
  "/user/:userId",
  verifyTokenFromCookie,
  NotesController.getUserNotes
);
router.put("/:id", verifyTokenFromCookie, NotesController.updateNote);
router.delete("/:id", verifyTokenFromCookie, NotesController.deleteNote);
router.post("/:id/like", verifyTokenFromCookie, NotesController.toggleLike);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum size is 50MB.",
        error: "FILE_TOO_LARGE",
      });
    }
  }

  if (error.message.includes("File type not supported")) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: "INVALID_FILE_TYPE",
    });
  }

  next(error);
});

module.exports = router;
