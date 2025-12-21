const ProfileService = require("../services/profileServices");
const FileUploadService = require("../services/fileUploadService");
const { PrismaClient } = require("@prisma/client");

const profileService = ProfileService.getInstance();
const fileUploadService = FileUploadService.getInstance();
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

  // Update user profile with optional profile picture
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware
      let updateData = req.body;
      const profilePictureFile = req.file; // From multer middleware

      // Parse JSON strings for arrays if they come as strings from FormData
      if (typeof updateData.courses === 'string') {
        try {
          updateData.courses = JSON.parse(updateData.courses);
        } catch (e) {
          updateData.courses = [];
        }
      }
      if (typeof updateData.previousCourses === 'string') {
        try {
          updateData.previousCourses = JSON.parse(updateData.previousCourses);
        } catch (e) {
          updateData.previousCourses = [];
        }
      }
      if (typeof updateData.completedCourses === 'string') {
        try {
          updateData.completedCourses = JSON.parse(updateData.completedCourses);
        } catch (e) {
          updateData.completedCourses = [];
        }
      }

      console.log('Update profile request:');
      console.log('User ID:', userId);
      console.log('Update data:', updateData);
      console.log('Profile picture file:', profilePictureFile ? {
        name: profilePictureFile.originalname,
        size: profilePictureFile.size,
        type: profilePictureFile.mimetype
      } : 'No file');

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

      const updatedProfile = await profileService.updateUserProfile(userId, updateData, profilePictureFile);
      
      console.log('Updated profile response:', updatedProfile);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { profile: updatedProfile },
      });
    } catch (error) {
      console.error("Update profile error:", error.message);

      // Handle file upload specific errors
      if (error.message.includes('Invalid file type')) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
        });
      }

      if (error.message.includes('File too large')) {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 5MB.",
        });
      }

      if (error.message.includes('Failed to upload profile picture')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

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