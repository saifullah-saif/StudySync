const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ChatService {
  // Get chat history between two users
  async getChatHistory(currentUserId, otherUserId) {
    try {
      const messages = await prisma.chat_messages.findMany({
        where: {
          OR: [
            {
              sender_id: currentUserId,
              receiver_id: parseInt(otherUserId),
            },
            {
              sender_id: parseInt(otherUserId),
              receiver_id: currentUserId,
            },
          ],
        },
        include: {
          users_chat_messages_sender_idTousers: {
            select: {
              id: true,
              name: true,
              profile_picture_url: true,
            },
          },
          users_chat_messages_receiver_idTousers: {
            select: {
              id: true,
              name: true,
              profile_picture_url: true,
            },
          },
        },
        orderBy: {
          created_at: "asc",
        },
      });

      // Mark messages as read if they were sent to the current user
      await prisma.chat_messages.updateMany({
        where: {
          sender_id: parseInt(otherUserId),
          receiver_id: currentUserId,
          is_read: false,
        },
        data: {
          is_read: true,
        },
      });

      return {
        success: true,
        data: {
          messages: messages.map((message) => ({
            id: message.id,
            content: message.message_text,
            sender_id: message.sender_id,
            receiver_id: message.receiver_id,
            timestamp: message.created_at,
            is_read: message.is_read,
            sender: message.users_chat_messages_sender_idTousers,
            receiver: message.users_chat_messages_receiver_idTousers,
          })),
        },
      };
    } catch (error) {
      console.error("Error fetching chat history:", error);
      throw new Error("Failed to fetch chat history");
    }
  }

  // Send a new message
  async sendMessage(senderId, receiverId, content) {
    try {
      const message = await prisma.chat_messages.create({
        data: {
          sender_id: senderId,
          receiver_id: parseInt(receiverId),
          message_text: content,
          is_read: false,
        },
        include: {
          users_chat_messages_sender_idTousers: {
            select: {
              id: true,
              name: true,
              profile_picture_url: true,
            },
          },
          users_chat_messages_receiver_idTousers: {
            select: {
              id: true,
              name: true,
              profile_picture_url: true,
            },
          },
        },
      });

      return {
        success: true,
        data: {
          message: {
            id: message.id,
            content: message.message_text,
            sender_id: message.sender_id,
            receiver_id: message.receiver_id,
            timestamp: message.created_at,
            is_read: message.is_read,
            sender: message.users_chat_messages_sender_idTousers,
            receiver: message.users_chat_messages_receiver_idTousers,
          },
        },
      };
    } catch (error) {
      console.error("Error sending message:", error);
      throw new Error("Failed to send message");
    }
  }

  // Get conversation list for a user
  async getConversations(userId) {
    try {
      const conversations = await prisma.$queryRaw`
        SELECT DISTINCT
          CASE 
            WHEN cm.sender_id = ${userId} THEN cm.receiver_id 
            ELSE cm.sender_id 
          END as other_user_id,
          u.name,
          u.profile_picture_url,
          u.department,
          u.semester,
          (SELECT cm2.message_text 
           FROM chat_messages cm2 
           WHERE (cm2.sender_id = ${userId} AND cm2.receiver_id = CASE WHEN cm.sender_id = ${userId} THEN cm.receiver_id ELSE cm.sender_id END)
              OR (cm2.sender_id = CASE WHEN cm.sender_id = ${userId} THEN cm.receiver_id ELSE cm.sender_id END AND cm2.receiver_id = ${userId})
           ORDER BY cm2.created_at DESC 
           LIMIT 1) as last_message,
          (SELECT cm2.created_at 
           FROM chat_messages cm2 
           WHERE (cm2.sender_id = ${userId} AND cm2.receiver_id = CASE WHEN cm.sender_id = ${userId} THEN cm.receiver_id ELSE cm.sender_id END)
              OR (cm2.sender_id = CASE WHEN cm.sender_id = ${userId} THEN cm.receiver_id ELSE cm.sender_id END AND cm2.receiver_id = ${userId})
           ORDER BY cm2.created_at DESC 
           LIMIT 1) as last_message_time,
          (SELECT COUNT(*) 
           FROM chat_messages cm3 
           WHERE cm3.sender_id = CASE WHEN cm.sender_id = ${userId} THEN cm.receiver_id ELSE cm.sender_id END 
             AND cm3.receiver_id = ${userId} 
             AND cm3.is_read = false) as unread_count
        FROM chat_messages cm
        JOIN users u ON u.id = CASE WHEN cm.sender_id = ${userId} THEN cm.receiver_id ELSE cm.sender_id END
        WHERE cm.sender_id = ${userId} OR cm.receiver_id = ${userId}
        ORDER BY last_message_time DESC
      `;

      return {
        success: true,
        data: {
          conversations: conversations.map((conv) => ({
            user_id: Number(conv.other_user_id),
            name: conv.name,
            profile_picture_url: conv.profile_picture_url,
            department: conv.department,
            semester: conv.semester,
            last_message: conv.last_message,
            last_message_time: conv.last_message_time,
            unread_count: Number(conv.unread_count),
          })),
        },
      };
    } catch (error) {
      console.error("Error fetching conversations:", error);
      throw new Error("Failed to fetch conversations");
    }
  }

  // Mark messages as read
  async markAsRead(senderId, receiverId) {
    try {
      await prisma.chat_messages.updateMany({
        where: {
          sender_id: parseInt(senderId),
          receiver_id: parseInt(receiverId),
          is_read: false,
        },
        data: {
          is_read: true,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Error marking messages as read:", error);
      throw new Error("Failed to mark messages as read");
    }
  }
}

module.exports = new ChatService();