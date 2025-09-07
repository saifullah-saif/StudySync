const express = require("express");
const ProfileController = require("../controller/profileController");
const FileUploadService = require("../services/fileUploadService");
const { verifyTokenFromCookie } = require("../middleware/jwtCookieMiddleware");

const router = express.Router();
const fileUploadService = FileUploadService.getInstance();

// All profile routes require authentication
router.use(verifyTokenFromCookie);

// GET /api/profile - Get user profile
router.get("/", ProfileController.getProfile);

// GET /api/profile/courses - Get all available courses
router.get("/courses", ProfileController.getAllCourses);

// PUT /api/profile - Update user profile (with optional profile picture)
router.put("/", fileUploadService.getUploadMiddleware(), ProfileController.updateProfile);

module.exports = router;