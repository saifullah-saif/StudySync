const express = require("express");
const ProfileController = require("../controller/profileController");
const { verifyTokenFromCookie } = require("../middleware/jwtCookieMiddleware");

const router = express.Router();

// All profile routes require authentication
router.use(verifyTokenFromCookie);

// GET /api/profile - Get user profile
router.get("/", ProfileController.getProfile);

// GET /api/profile/courses - Get all available courses
router.get("/courses", ProfileController.getAllCourses);

// PUT /api/profile - Update user profile
router.put("/", ProfileController.updateProfile);

module.exports = router;