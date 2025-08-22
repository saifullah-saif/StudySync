const BuddyService = require("../services/buddyServices");

const buddyService = BuddyService.getInstance();

class BuddyController {
  // Get buddies (peers or mentors)
  static async getBuddies(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware
      const { type, search } = req.query; // 'peers' or 'mentors', and search query

      // Validate user ID
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate type parameter
      const buddyType = type === 'mentors' ? 'mentors' : 'peers'; // Default to peers
      
      // Get search query (can be empty)
      const searchQuery = search ? search.toString().trim() : '';

      const buddies = await buddyService.getBuddies(userId, buddyType, searchQuery);

      res.status(200).json({
        success: true,
        message: `${buddyType.charAt(0).toUpperCase() + buddyType.slice(1)} retrieved successfully`,
        data: { 
          buddies,
          type: buddyType,
          count: buddies.length,
          searchQuery: searchQuery || null
        },
      });
    } catch (error) {
      console.error("Get buddies error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve buddies",
        error: error.message,
      });
    }
  }

  // Create a new connection request
  static async createConnection(req, res) {
    try {
      const requesterId = req.user.id; // From JWT middleware
      const { addresseeId, requestType } = req.body;

      // Validate user ID
      if (!requesterId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate required fields
      if (!addresseeId || !requestType) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: addresseeId and requestType",
        });
      }

      // Validate request type
      if (!['peer', 'mentor'].includes(requestType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid request type. Must be 'peer' or 'mentor'",
        });
      }

      const connection = await buddyService.createConnection(
        requesterId,
        parseInt(addresseeId),
        requestType
      );

      res.status(201).json({
        success: true,
        message: `${requestType === 'peer' ? 'Study invite' : 'Mentoring request'} sent successfully`,
        data: { connection },
      });
    } catch (error) {
      console.error("Create connection error:", error.message);
      
      if (error.message.includes("already exists")) {
        return res.status(409).json({
          success: false,
          message: "Connection request already exists",
        });
      }
      
      if (error.message.includes("not found")) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (error.message.includes("yourself")) {
        return res.status(400).json({
          success: false,
          message: "Cannot send connection request to yourself",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create connection request",
        error: error.message,
      });
    }
  }

  // Get pending connection requests
  static async getPendingConnections(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware

      // Validate user ID
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const connections = await buddyService.getPendingConnections(userId);

      res.status(200).json({
        success: true,
        message: "Pending connections retrieved successfully",
        data: { 
          connections,
          count: connections.length 
        },
      });
    } catch (error) {
      console.error("Get pending connections error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve pending connections",
        error: error.message,
      });
    }
  }

  // Get pending invitations (alias for getPendingConnections)
  static async getPendingInvitations(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware

      // Validate user ID
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const invitations = await buddyService.getPendingInvitations(userId);

      res.status(200).json({
        success: true,
        message: "Pending invitations retrieved successfully",
        data: { 
          invitations,
          count: invitations.length 
        },
      });
    } catch (error) {
      console.error("Get pending invitations error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve pending invitations",
        error: error.message,
      });
    }
  }

  // Respond to invitation (accept or reject)
  static async respondToInvitation(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware
      const { invitationId } = req.params;
      const { response } = req.body;

      // Validate user ID
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate required fields
      if (!response) {
        return res.status(400).json({
          success: false,
          message: "Response is required",
        });
      }

      // Validate response
      if (!['accepted', 'rejected'].includes(response)) {
        return res.status(400).json({
          success: false,
          message: "Invalid response. Must be 'accepted' or 'rejected'",
        });
      }

      const invitation = await buddyService.respondToInvitation(
        parseInt(invitationId),
        response,
        userId
      );

      res.status(200).json({
        success: true,
        message: `Invitation ${response} successfully`,
        data: { invitation },
      });
    } catch (error) {
      console.error("Respond to invitation error:", error.message);
      
      if (error.message.includes("not found") || error.message.includes("not authorized")) {
        return res.status(404).json({
          success: false,
          message: "Invitation not found or not authorized",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to respond to invitation",
        error: error.message,
      });
    }
  }

  // Update connection status (accept/reject)
  static async updateConnectionStatus(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware
      const { connectionId } = req.params;
      const { status } = req.body;

      // Validate user ID
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Validate required fields
      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      // Validate status
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status. Must be 'accepted' or 'rejected'",
        });
      }

      const connection = await buddyService.updateConnectionStatus(
        parseInt(connectionId),
        status,
        userId
      );

      res.status(200).json({
        success: true,
        message: `Connection request ${status} successfully`,
        data: { connection },
      });
    } catch (error) {
      console.error("Update connection status error:", error.message);
      
      if (error.message.includes("not found") || error.message.includes("not authorized")) {
        return res.status(404).json({
          success: false,
          message: "Connection request not found or not authorized",
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update connection status",
        error: error.message,
      });
    }
  }

  // Get accepted connections for a user
  static async getAcceptedConnections(req, res) {
    try {
      const userId = req.user.id; // From JWT middleware

      // Validate user ID
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const connections = await buddyService.getAcceptedConnections(userId);

      res.status(200).json({
        success: true,
        message: "Accepted connections retrieved successfully",
        data: { 
          connections,
          count: connections.length 
        },
      });
    } catch (error) {
      console.error("Get accepted connections error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve accepted connections",
        error: error.message,
      });
    }
  }
}

module.exports = BuddyController;