const chatService = require("../services/chatServices");

class ChatController {
  // Get chat history between current user and another user
  async getChatHistory(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const result = await chatService.getChatHistory(currentUserId, userId);
      res.json(result);
    } catch (error) {
      console.error("Error in getChatHistory:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch chat history",
      });
    }
  }

  // Send a message to another user
  async sendMessage(req, res) {
    try {
      const { userId } = req.params;
      const { content } = req.body;
      const senderId = req.user.id;

      if (!userId || !content || content.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "User ID and message content are required",
        });
      }

      const result = await chatService.sendMessage(senderId, userId, content.trim());
      
      // Trigger Pusher event to receiver
      const pusher = req.app.get('pusher');
      if (pusher) {
        await pusher.trigger(`user_${userId}`, 'new_message', {
          message: result.data.message,
          sender_id: senderId,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error in sendMessage:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to send message",
      });
    }
  }

  // Get conversation list for current user
  async getConversations(req, res) {
    try {
      const userId = req.user.id;
      const result = await chatService.getConversations(userId);
      res.json(result);
    } catch (error) {
      console.error("Error in getConversations:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch conversations",
      });
    }
  }

  // Mark messages as read
  async markAsRead(req, res) {
    try {
      const { userId } = req.params;
      const currentUserId = req.user.id;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const result = await chatService.markAsRead(userId, currentUserId);
      
      // Trigger Pusher event for read status update
      const pusher = req.app.get('pusher');
      if (pusher) {
        await pusher.trigger(`user_${userId}`, 'messages_read', {
          reader_id: currentUserId,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Error in markAsRead:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to mark messages as read",
      });
    }
  }
}

module.exports = new ChatController();