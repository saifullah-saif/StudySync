const ProfileService = require("../services/profileServices");
const { PrismaClient } = require("@prisma/client");

const profileService = ProfileService.getInstance();
const prisma = new PrismaClient();

class ProfileController {
  // Get user profile
  static async getProfile(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware

      const profile = await profileService.getUserProfile(userId);

      res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        data: { profile },
      });
    } catch (error) {
      console.error("Get profile error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve profile",
        error: error.message,
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware
      const updateData = req.body;

      // Validate user ID
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate required fields if provided
      if (updateData.email && !updateData.email.includes("@")) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
      }

      if (updateData.semester && (updateData.semester < 1 || updateData.semester > 8)) {
        return res.status(400).json({
          success: false,
          message: "Semester must be between 1 and 8",
        });
      }

      const updatedProfile = await profileService.updateUserProfile(userId, updateData);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { profile: updatedProfile },
      });
    } catch (error) {
      console.error("Update profile error:", error.message);

      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Handle specific errors
      if (error.message.includes("Unique constraint")) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      if (error.message.includes("User not found")) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update profile",
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  // Get all available courses
  static async getAllCourses(req, res) {
    try {
      const courses = await profileService.getAllCourses();

      res.status(200).json({
        success: true,
        message: "Courses retrieved successfully",
        data: { courses },
      });
    } catch (error) {
      console.error("Get courses error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve courses",
        error: error.message,
      });
    }
  }
}

module.exports = ProfileController;