const express = require("express");
const router = express.Router();
const chatController = require("../controller/chatController");
const { verifyTokenFromCookie } = require("../middleware/jwtCookieMiddleware");

// All chat routes require authentication
router.use(verifyTokenFromCookie);

// GET /api/chats/conversations - Get all conversations for current user
router.get("/conversations", chatController.getConversations);

// GET /api/chats/:userId - Get chat history with specific user
router.get("/:userId", chatController.getChatHistory);

// POST /api/chats/:userId - Send message to specific user
router.post("/:userId", chatController.sendMessage);

// PUT /api/chats/:userId/read - Mark messages from specific user as read
router.put("/:userId/read", chatController.markAsRead);

module.exports = router;