const express = require("express");
const AuthController = require("../controller/authController");
const { verifyTokenFromCookie } = require("../middleware/jwtCookieMiddleware");

const router = express.Router();

// Public routes - Basic authentication only
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Protected routes - using JWT cookie middleware
router.get("/me", verifyTokenFromCookie, AuthController.getCurrentUser);
router.get(
  "/validate-session",
  verifyTokenFromCookie,
  AuthController.validateSession
);
router.post("/logout", verifyTokenFromCookie, AuthController.logout);
router.put(
  "/update-profile",
  verifyTokenFromCookie,
  AuthController.updateProfile
);

module.exports = router;
