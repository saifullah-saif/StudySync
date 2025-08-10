const AuthService = require("../services/authService");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { generateToken } = require("../middleware/jwtCookieMiddleware");

const prisma = new PrismaClient();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET;

// JWT Utility Functions
const verifyToken = (token) => {
  try {
    const verified = jwt.verify(token, JWT_SECRET);

    // Ensure both id and user_id are available for compatibility
    if (verified.id && !verified.user_id) {
      verified.user_id = verified.id;
    } else if (verified.user_id && !verified.id) {
      verified.id = verified.user_id;
    }

    return verified;
  } catch (error) {
    console.error("Token verification error:", error);
    throw error;
  }
};

// Initialize services
const authService = AuthService.getInstance();

class AuthController {
  // Register with email/password - aligns with users table schema
  static async register(req, res) {
    try {
      const { name, email, password, department, semester, bio } = req.body;

      // Validate required fields
      if (!name || !email || !password || !department) {
        return res.status(400).json({
          success: false,
          message: "Name, email, password, and department are required",
        });
      }

      // Register user using AuthService
      const result = await authService.registerUser({
        name,
        email,
        password,
        department,
        semester,
        bio,
      });

      res.status(201).json({
        success: true,
        message: "Registration successful",
        data: {
          user: {
            id: result.id,
            name: result.name,
            email: result.email,
            department: result.department,
            semester: result.semester,
            bio: result.bio,
          },
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      if (error.message === "User already exists with this email") {
        return res.status(409).json({
          success: false,
          message: "A user with this email already exists",
        });
      }

      res.status(500).json({
        success: false,
        message: "Registration failed. Please try again.",
      });
    }
  }

  // Login with email/password - aligns with users table schema
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      console.log("Login attempt for email:", email);

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Login user using AuthService
      const result = await authService.loginUser(email, password);
      console.log("Login successful for user:", result.user.id);

      // Generate JWT token and set HTTP-only cookie
      const token = generateToken({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      });

      // Set HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            department: result.user.department,
            semester: result.user.semester,
            bio: result.user.bio,
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error.message);
      res.status(401).json({
        success: false,
        message: "Login failed. Please try again.",
      });
    }
  }

  // Validate session token
  static async validateSession(req, res) {
    try {
      // If we reach here, the middleware has already validated the token
      // req.user should contain the user data
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Invalid session",
        });
      }

      // Get fresh user data from database
      const user = await authService.getUserById(
        req.user.id || req.user.user_id
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            semester: user.semester,
            bio: user.bio,
            profile_picture_url: user.profile_picture_url,
            cgpa: user.cgpa,
          },
        },
      });
    } catch (error) {
      console.error("Session validation error:", error);
      res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }
  }

  // Logout
  static async logout(req, res) {
    try {
      // Clear the HTTP-only cookie
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "lax",
        path: "/",
      });

      // Call logout service (for future token blacklisting)
      if (req.user && req.user.id) {
        await authService.logout(req.user.id);
      }

      res.json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }
  }

  // Get current user
  static async getCurrentUser(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Get fresh user data from database
      const user = await authService.getUserById(
        req.user.id || req.user.user_id
      );

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            semester: user.semester,
            bio: user.bio,
            profile_picture_url: user.profile_picture_url,
            cgpa: user.cgpa,
          },
        },
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get user data",
      });
    }
  }

  // Update profile
  static async updateProfile(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { name, department, semester, bio, profile_picture_url, cgpa } =
        req.body;

      const updatedUser = await authService.updateUserProfile(
        req.user.id || req.user.user_id,
        {
          name,
          department,
          semester,
          bio,
          profile_picture_url,
          cgpa,
        }
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  }
}

module.exports = AuthController;
