const courseServices = require("../services/courseServices");

// Get all courses
const getAllCourses = async (req, res) => {
  try {
    const courses = await courseServices.getAllCourses();
    res.status(200).json({
      success: true,
      data: courses,
      message: "Courses retrieved successfully"
    });
  } catch (error) {
    console.error("Error in getAllCourses controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve courses",
      error: error.message
    });
  }
};

// Get course by ID
const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await courseServices.getCourseById(parseInt(id));
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: course,
      message: "Course retrieved successfully"
    });
  } catch (error) {
    console.error("Error in getCourseById controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve course",
      error: error.message
    });
  }
};

// Get courses by department
const getCoursesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const courses = await courseServices.getCoursesByDepartment(department);
    
    res.status(200).json({
      success: true,
      data: courses,
      message: "Courses retrieved successfully"
    });
  } catch (error) {
    console.error("Error in getCoursesByDepartment controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve courses",
      error: error.message
    });
  }
};

// Search courses
const searchCourses = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }
    
    const courses = await courseServices.searchCourses(q);
    
    res.status(200).json({
      success: true,
      data: courses,
      message: "Search completed successfully"
    });
  } catch (error) {
    console.error("Error in searchCourses controller:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search courses",
      error: error.message
    });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  getCoursesByDepartment,
  searchCourses
};