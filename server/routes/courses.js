const express = require("express");
const router = express.Router();
const courseController = require("../controller/courseController");
const { authenticateToken } = require("../middleware/authMiddleware");

// Get all courses (temporarily without auth for testing)
router.get("/", courseController.getAllCourses);

// Search courses
router.get("/search", authenticateToken, courseController.searchCourses);

// Get courses by department
router.get(
  "/department/:department",
  authenticateToken,
  courseController.getCoursesByDepartment
);

// Get course by ID
router.get("/:id", authenticateToken, courseController.getCourseById);

module.exports = router;
