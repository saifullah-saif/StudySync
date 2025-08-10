const jwt = require("jsonwebtoken");
const AuthService = require("../services/authService");

const authService = AuthService.getInstance();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the token
      const decoded = authService.verifyToken(token);

      // Get user details
      const user = await authService.getUserById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid token - user not found",
        });
      }

      // Add user info to request object
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        department: user.department,
        semester: user.semester,
        bio: user.bio,
        profile_picture_url: user.profile_picture_url,
        cgpa: user.cgpa,
      };

      next();
    } catch (tokenError) {
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expired",
          code: "TOKEN_EXPIRED",
        });
      } else if (tokenError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      } else {
        throw tokenError;
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};

// Optional auth middleware - doesn't fail if no token provided
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = authService.verifyToken(token);
      const user = await authService.getUserById(decoded.id);

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          department: user.department,
          semester: user.semester,
          bio: user.bio,
          profile_picture_url: user.profile_picture_url,
          cgpa: user.cgpa,
        };
      } else {
        req.user = null;
      }
    } catch (tokenError) {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    req.user = null;
    next();
  }
};

// Role-based middleware (simplified for users only)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // In this simplified schema, all authenticated users are 'user' role
    const userRole = "user";
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuthMiddleware;
module.exports.requireRole = requireRole;
