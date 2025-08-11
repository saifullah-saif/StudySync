const express = require("express");
const ProfileController = require("../controller/profileController");
const { verifyTokenFromCookie } = require("../middleware/jwtCookieMiddleware");

const router = express.Router();

// All profile routes require authentication
router.use(verifyTokenFromCookie);

// Test route to verify authentication
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Profile route is working",
    user: req.user
  });
});

// GET /api/profile - Get user profile
router.get("/", ProfileController.getProfile);

// GET /api/profile/courses - Get all available courses
router.get("/courses", ProfileController.getAllCourses);

// PUT /api/profile - Update user profile
router.put("/", ProfileController.updateProfile);

// PUT /api/profile/simple - Simple update for debugging
router.put("/simple", ProfileController.updateProfileSimple);

module.exports = router;