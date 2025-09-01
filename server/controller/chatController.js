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
      
      // Emit the message to both sender and receiver via socket.io
      const io = req.app.get('io');
      if (io) {
        // Emit to receiver
        io.to(`user_${userId}`).emit('new_message', {
          message: result.data.message,
          sender_id: senderId,
        });
        
        // Emit to sender for real-time update
        io.to(`user_${senderId}`).emit('message_sent', {
          message: result.data.message,
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
      
      // Emit read status update via socket.io
      const io = req.app.get('io');
      if (io) {
        io.to(`user_${userId}`).emit('messages_read', {
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