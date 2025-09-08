const express = require("express");
const router = express.Router();
const courseController = require("../controller/courseController");
const authMiddleware = require("../middleware/authMiddleware");

// Get all courses (temporarily without auth for testing)
router.get("/", courseController.getAllCourses);

// Search courses
router.get("/search", authMiddleware, courseController.searchCourses);

// Get courses by department
router.get("/department/:department", authMiddleware, courseController.getCoursesByDepartment);

// Get course by ID
router.get("/:id", authMiddleware, courseController.getCourseById);

module.exports = router;